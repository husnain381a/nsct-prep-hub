import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

const QuizReview = ({ user }) => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, correct, wrong, unattempted

  useEffect(() => {
    fetchReviewData();
  }, [attemptId]);

  const fetchReviewData = async () => {
    try {
      // Fetch attempt details
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes (
            title,
            description,
            marks_per_question,
            negative_marking,
            negative_marks
          )
        `)
        .eq('id', attemptId)
        .eq('user_id', user.id)
        .single();

      if (attemptError) throw attemptError;

      // Fetch questions for this quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', attemptData.quiz_id)
        .order('created_at');

      if (questionsError) throw questionsError;

      // Fetch user answers
      const { data: answersData, error: answersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('attempt_id', attemptId);

      if (answersError) throw answersError;

      // Create answers map
      const answersMap = {};
      answersData?.forEach(answer => {
        answersMap[answer.question_id] = answer;
      });

      setAttempt(attemptData);
      setQuiz(attemptData.quizzes);
      setQuestions(questionsData);
      setUserAnswers(answersMap);
    } catch (error) {
      console.error('Error fetching review data:', error);
      alert('Error loading review. Please try again.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionStatus = (question) => {
    const userAnswer = userAnswers[question.id];
    if (!userAnswer || !userAnswer.selected_answer) return 'unattempted';
    return userAnswer.is_correct ? 'correct' : 'wrong';
  };

  const getFilteredQuestions = () => {
    if (filter === 'all') return questions;
    return questions.filter(question => getQuestionStatus(question) === filter);
  };

  const filteredQuestions = getFilteredQuestions();
  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const userAnswer = currentQuestion ? userAnswers[currentQuestion.id] : null;
  const questionStatus = currentQuestion ? getQuestionStatus(currentQuestion) : null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'correct':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'wrong':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'unattempted':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'correct':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'wrong':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'unattempted':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getOptionStyle = (option, question, userAnswer) => {
    const isCorrect = option === question.correct_answer;
    const isSelected = userAnswer?.selected_answer === option;
    
    if (isCorrect && isSelected) {
      return 'border-green-500 bg-green-50 text-green-900'; // Correct and selected
    } else if (isCorrect) {
      return 'border-green-500 bg-green-100 text-green-900'; // Correct answer
    } else if (isSelected) {
      return 'border-red-500 bg-red-50 text-red-900'; // Wrong selection
    }
    return 'border-gray-200 bg-white text-gray-900'; // Default
  };

  if (loading) {
    return <LoadingSpinner text="Loading review..." />;
  }

  if (!attempt || !quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Review not found.</p>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link to={`/results/${attemptId}`} className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quiz Review</h1>
                <p className="text-gray-600">{quiz.title}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Score: {Math.max(0, attempt.score)} / {attempt.total_questions * quiz.marks_per_question}
              </p>
              <p className="text-lg font-semibold text-gray-900">{attempt.percentage}%</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Review Panel */}
          <div className="lg:col-span-3">
            {currentQuestion ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    {getStatusIcon(questionStatus)}
                    <h2 className="text-lg font-medium text-gray-900 ml-2">
                      Question {questions.findIndex(q => q.id === currentQuestion.id) + 1} of {questions.length}
                    </h2>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(questionStatus)}`}>
                    {questionStatus === 'correct' ? 'Correct' : questionStatus === 'wrong' ? 'Wrong' : 'Not Attempted'}
                    {userAnswer?.is_flagged && (
                      <Flag className="w-4 h-4 inline ml-1" />
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-6">
                  <p className="text-lg text-gray-900 leading-relaxed mb-6">
                    {currentQuestion.question}
                  </p>

                  {/* Options */}
                  <div className="space-y-3">
                    {['a', 'b', 'c', 'd'].map((option) => (
                      <div
                        key={option}
                        className={`flex items-center p-4 border-2 rounded-lg ${getOptionStyle(option, currentQuestion, userAnswer)}`}
                      >
                        <div className="flex items-center">
                          {option === currentQuestion.correct_answer && (
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                          )}
                          {userAnswer?.selected_answer === option && option !== currentQuestion.correct_answer && (
                            <XCircle className="w-5 h-5 text-red-600 mr-3" />
                          )}
                          <span className="font-medium uppercase mr-3">({option})</span>
                          <span>{currentQuestion[`option_${option}`]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Answer Analysis */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Your Answer</h3>
                      {userAnswer?.selected_answer ? (
                        <p className={`text-sm ${userAnswer.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                          Option {userAnswer.selected_answer.toUpperCase()}: {currentQuestion[`option_${userAnswer.selected_answer}`]}
                          {userAnswer.is_correct ? ' ✓' : ' ✗'}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">Not attempted</p>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Correct Answer</h3>
                      <p className="text-sm text-green-600">
                        Option {currentQuestion.correct_answer.toUpperCase()}: {currentQuestion[`option_${currentQuestion.correct_answer}`]} ✓
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  {currentQuestion.explanation && (
                    <div className="mt-4">
                      <h3 className="font-medium text-gray-900 mb-2">Explanation</h3>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}

                  {/* Scoring */}
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Scoring</h3>
                    <div className="text-sm text-gray-600">
                      {userAnswer?.is_correct ? (
                        <span className="text-green-600">+{quiz.marks_per_question} marks</span>
                      ) : userAnswer?.selected_answer ? (
                        <span className="text-red-600">
                          {quiz.negative_marking ? `-${quiz.negative_marks}` : '0'} marks
                        </span>
                      ) : (
                        <span className="text-gray-500">0 marks (not attempted)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    {currentQuestionIndex + 1} of {filteredQuestions.length} 
                    {filter !== 'all' && ` (${filter})`}
                  </span>
                  
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(filteredQuestions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === filteredQuestions.length - 1}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-gray-500">No questions match the current filter.</p>
              </div>
            )}
          </div>

          {/* Navigation Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-6">
              <h3 className="font-medium text-gray-900 mb-4">Question Navigation</h3>
              
              {/* Filter Buttons */}
              <div className="mb-4 space-y-2">
                <button
                  onClick={() => {
                    setFilter('all');
                    setCurrentQuestionIndex(0);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filter === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  All Questions ({questions.length})
                </button>
                <button
                  onClick={() => {
                    setFilter('correct');
                    setCurrentQuestionIndex(0);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filter === 'correct' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
                  }`}
                >
                  Correct ({attempt.correct_answers})
                </button>
                <button
                  onClick={() => {
                    setFilter('wrong');
                    setCurrentQuestionIndex(0);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filter === 'wrong' ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'
                  }`}
                >
                  Wrong ({attempt.wrong_answers})
                </button>
                <button
                  onClick={() => {
                    setFilter('unattempted');
                    setCurrentQuestionIndex(0);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filter === 'unattempted' ? 'bg-gray-100 text-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  Not Attempted ({attempt.unattempted})
                </button>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((question, index) => {
                  const status = getQuestionStatus(question);
                  const originalIndex = questions.findIndex(q => q.id === question.id);
                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 text-white'
                          : status === 'correct'
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : status === 'wrong'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {originalIndex + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span>Correct</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  <span>Wrong</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
                  <span>Not Attempted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizReview;