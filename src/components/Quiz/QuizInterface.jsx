import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Clock, Flag, Save, Send, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

const QuizInterface = ({ user }) => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    fetchQuizData();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId]);

  useEffect(() => {
    if (quiz && timeRemaining > 0) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quiz]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId);

      if (questionsError) throw questionsError;

      // Randomize questions if enabled
      let processedQuestions = questionsData;
      if (quizData.randomize_questions) {
        processedQuestions = [...questionsData].sort(() => Math.random() - 0.5);
      }

      // Randomize options if enabled
      if (quizData.randomize_options) {
        processedQuestions = processedQuestions.map(question => {
          const options = [
            { key: 'a', value: question.option_a },
            { key: 'b', value: question.option_b },
            { key: 'c', value: question.option_c },
            { key: 'd', value: question.option_d }
          ];
          
          const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
          const correctOptionIndex = shuffledOptions.findIndex(opt => opt.key === question.correct_answer);
          
          return {
            ...question,
            option_a: shuffledOptions[0].value,
            option_b: shuffledOptions[1].value,
            option_c: shuffledOptions[2].value,
            option_d: shuffledOptions[3].value,
            correct_answer: ['a', 'b', 'c', 'd'][correctOptionIndex],
            original_correct: question.correct_answer
          };
        });
      }

      setQuiz(quizData);
      setQuestions(processedQuestions);
      setTimeRemaining(quizData.time_limit * 60); // Convert minutes to seconds

      // Create quiz attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          total_questions: processedQuestions.length,
          score: 0,
          correct_answers: 0,
          wrong_answers: 0,
          unattempted: processedQuestions.length,
          percentage: 0,
          time_taken: 0
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      setAttemptId(attemptData.id);

    } catch (error) {
      console.error('Error fetching quiz data:', error);
      alert('Error loading quiz. Please try again.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestionIndex].id]: answer
    }));
  };

  const handleSaveAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = answers[currentQuestion.id];

    if (!selectedAnswer) return;

    try {
      // Check if answer already exists
      const { data: existingAnswer } = await supabase
        .from('user_answers')
        .select('id')
        .eq('attempt_id', attemptId)
        .eq('question_id', currentQuestion.id)
        .single();

      const answerData = {
        attempt_id: attemptId,
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer,
        is_correct: selectedAnswer === currentQuestion.correct_answer,
        is_flagged: flaggedQuestions.has(currentQuestion.id)
      };

      if (existingAnswer) {
        // Update existing answer
        await supabase
          .from('user_answers')
          .update(answerData)
          .eq('id', existingAnswer.id);
      } else {
        // Insert new answer
        await supabase
          .from('user_answers')
          .insert(answerData);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleFlagQuestion = () => {
    const currentQuestionId = questions[currentQuestionIndex].id;
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionId)) {
        newSet.delete(currentQuestionId);
      } else {
        newSet.add(currentQuestionId);
      }
      return newSet;
    });
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!autoSubmit && !showSubmitModal) {
      setShowSubmitModal(true);
      return;
    }

    setSubmitting(true);

    try {
      // Calculate time taken
      const timeTaken = quiz.time_limit * 60 - timeRemaining;

      // Get all user answers
      const { data: userAnswers } = await supabase
        .from('user_answers')
        .select('*')
        .eq('attempt_id', attemptId);

      // Calculate results
      const correctAnswers = userAnswers?.filter(answer => answer.is_correct).length || 0;
      const wrongAnswers = userAnswers?.filter(answer => !answer.is_correct && answer.selected_answer).length || 0;
      const unattempted = questions.length - (userAnswers?.length || 0);
      
      let score = correctAnswers * quiz.marks_per_question;
      if (quiz.negative_marking) {
        score -= wrongAnswers * quiz.negative_marks;
      }
      
      const percentage = Math.round((correctAnswers / questions.length) * 100);

      // Update quiz attempt
      await supabase
        .from('quiz_attempts')
        .update({
          score: Math.max(0, score),
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          unattempted: unattempted,
          percentage: percentage,
          time_taken: timeTaken,
          submitted_at: new Date().toISOString()
        })
        .eq('id', attemptId);

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      navigate(`/results/${attemptId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId) => {
    if (answers[questionId]) return 'answered';
    if (flaggedQuestions.has(questionId)) return 'flagged';
    return 'unanswered';
  };

  if (loading) {
    return <LoadingSpinner text="Loading quiz..." />;
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Quiz not found or no questions available.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                <Clock className="w-4 h-4 mr-2" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                    {currentQuestionIndex + 1}. {currentQuestion.question}
                  </h2>
                  <button
                    onClick={handleFlagQuestion}
                    className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                      flaggedQuestions.has(currentQuestion.id)
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    {flaggedQuestions.has(currentQuestion.id) ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {['a', 'b', 'c', 'd'].map((option) => (
                    <label
                      key={option}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        answers[currentQuestion.id] === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerSelect(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-900">
                        <span className="font-medium uppercase mr-2">({option})</span>
                        {currentQuestion[`option_${option}`]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Navigation and Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 border-t border-gray-200 gap-3">
  
  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
    <button
      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
      disabled={currentQuestionIndex === 0}
      className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Previous
    </button>

    <button
      onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
      disabled={currentQuestionIndex === questions.length - 1}
      className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Next
      <ArrowRight className="w-4 h-4 ml-2" />
    </button>
  </div>

  <div className="w-full sm:w-auto">
    <button
      onClick={handleSaveAnswer}
      disabled={!answers[currentQuestion.id]}
      className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Save className="w-4 h-4 mr-2" />
      Save Answer
    </button>
  </div>

</div>
            </div>
          </div>

          {/* Question Navigation Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
              <h3 className="font-medium text-gray-900 mb-4">Question Navigation</h3>
              
              {/* Legend */}
              <div className="mb-4 space-y-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                  <span>Flagged</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
                  <span>Not Answered</span>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const status = getQuestionStatus(question.id);
                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 text-white'
                          : status === 'answered'
                          ? 'bg-green-500 text-white'
                          : status === 'flagged'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Answered:</span>
                    <span className="font-medium">{Object.keys(answers).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flagged:</span>
                    <span className="font-medium">{flaggedQuestions.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Not Answered:</span>
                    <span className="font-medium">{questions.length - Object.keys(answers).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Submit Quiz</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your quiz? You have answered {Object.keys(answers).length} out of {questions.length} questions.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitQuiz(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizInterface;