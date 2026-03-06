import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Papa from 'papaparse';
import { ArrowLeft, Upload, FileText, Settings, Save, Download } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

const CreateQuiz = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    timeLimit: 60,
    perQuestionTime: 0,
    marksPerQuestion: 1,
    negativeMarking: false,
    negativeMarks: 0.25,
    randomizeQuestions: false,
    randomizeOptions: false
  });
  const [questions, setQuestions] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvError, setCsvError] = useState('');

  const handleQuizDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuizData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError('');

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const parsedQuestions = results.data
            .filter(row => row.question && row.option_a && row.option_b && row.option_c && row.option_d && row.correct_answer)
            .map((row, index) => ({
              id: index + 1,
              question: row.question.trim(),
              option_a: row.option_a.trim(),
              option_b: row.option_b.trim(),
              option_c: row.option_c.trim(),
              option_d: row.option_d.trim(),
              correct_answer: row.correct_answer.trim().toLowerCase(),
              explanation: row.explanation?.trim() || ''
            }));

          if (parsedQuestions.length === 0) {
            setCsvError('No valid questions found in CSV file');
            return;
          }

          if (parsedQuestions.length > 100) {
            setCsvError('Maximum 100 questions allowed per quiz');
            return;
          }

          // Validate correct answers
          const invalidAnswers = parsedQuestions.filter(q =>
            !['a', 'b', 'c', 'd'].includes(q.correct_answer)
          );

          if (invalidAnswers.length > 0) {
            setCsvError('Correct answer must be a, b, c, or d');
            return;
          }

          setQuestions(parsedQuestions);
          setStep(3);
        } catch (error) {
          setCsvError('Error parsing CSV file');
        }
      },
      error: (error) => {
        setCsvError('Error reading CSV file');
      }
    });
  };

  const createQuiz = async () => {
    if (!quizData.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    if (questions.length === 0) {
      alert('Please upload questions');
      return;
    }

    setLoading(true);

    try {
      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quizData.title,
          description: quizData.description,
          created_by: user.id,
          time_limit: parseInt(quizData.timeLimit),
          per_question_time: parseInt(quizData.perQuestionTime),
          marks_per_question: parseFloat(quizData.marksPerQuestion),
          negative_marking: quizData.negativeMarking,
          negative_marks: parseFloat(quizData.negativeMarks),
          randomize_questions: quizData.randomizeQuestions,
          randomize_options: quizData.randomizeOptions,
          total_questions: questions.length
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Insert questions
      const questionsToInsert = questions.map(q => ({
        quiz_id: quiz.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Creating quiz..." />;
  }

  const downloadExampleCSV = () => {
    const csvContent = "question,option_a,option_b,option_c,option_d,correct_answer,explanation(optional)\n" +
      "What is the capital of France?,Paris,London,Berlin,Madrid,a,Paris is the capital and largest city of France.\n" +
      "Which planet is known as the Red Planet?,Venus,Mars,Jupiter,Saturn,b,Mars has a reddish appearance due to iron oxide on its surface.";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "quiz_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link to="/dashboard" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Quiz Settings</span>
            </div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Upload Questions</span>
            </div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Review & Create</span>
            </div>
          </div>
        </div>

        {/* Step 1: Quiz Settings */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Settings className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Quiz Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={quizData.title}
                  onChange={handleQuizDataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={quizData.description}
                  onChange={handleQuizDataChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quiz description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Time Limit (minutes)
                </label>
                <input
                  type="number"
                  name="timeLimit"
                  value={quizData.timeLimit}
                  onChange={handleQuizDataChange}
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per Question Time (seconds, 0 = no limit)
                </label>
                <input
                  type="number"
                  name="perQuestionTime"
                  value={quizData.perQuestionTime}
                  onChange={handleQuizDataChange}
                  min="0"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks per Question
                </label>
                <input
                  type="number"
                  name="marksPerQuestion"
                  value={quizData.marksPerQuestion}
                  onChange={handleQuizDataChange}
                  min="0.1"
                  max="10"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Negative Marks (if enabled)
                </label>
                <input
                  type="number"
                  name="negativeMarks"
                  value={quizData.negativeMarks}
                  onChange={handleQuizDataChange}
                  min="0"
                  max="5"
                  step="0.1"
                  disabled={!quizData.negativeMarking}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="negativeMarking"
                    checked={quizData.negativeMarking}
                    onChange={handleQuizDataChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Enable Negative Marking
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="randomizeQuestions"
                    checked={quizData.randomizeQuestions}
                    onChange={handleQuizDataChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Randomize Question Order
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="randomizeOptions"
                    checked={quizData.randomizeOptions}
                    onChange={handleQuizDataChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Randomize Answer Options
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Upload Questions
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload Questions */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Upload className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Upload Questions</h2>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Headers: question, option_a, option_b, option_c, option_d, correct_answer, explanation (optional)</li>
                  <li>• Correct answer should be: a, b, c, or d</li>
                  <li>• Maximum 100 questions per quiz</li>
                  <li>• All fields except explanation are required</li>
                </ul>
                {/* New Download Button */}
                <button
                  onClick={downloadExampleCSV}
                  className="flex items-center text-sm font-medium text-blue-700 hover:text-blue-800 bg-blue-100 px-3 py-2 rounded-md transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Example CSV
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-900">Upload CSV File</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-gray-600 mt-2">Click to select your CSV file</p>
                </label>
              </div>

              {csvError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {csvError}
                </div>
              )}

              {csvFile && !csvError && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  File uploaded successfully: {csvFile.name}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={questions.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Review & Create Quiz</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Quiz Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Title:</span> {quizData.title}</p>
                  <p><span className="font-medium">Description:</span> {quizData.description || 'None'}</p>
                  <p><span className="font-medium">Total Questions:</span> {questions.length}</p>
                  <p><span className="font-medium">Time Limit:</span> {quizData.timeLimit} minutes</p>
                  <p><span className="font-medium">Per Question Time:</span> {quizData.perQuestionTime || 'No limit'} seconds</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Scoring Settings</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Marks per Question:</span> {quizData.marksPerQuestion}</p>
                  <p><span className="font-medium">Negative Marking:</span> {quizData.negativeMarking ? `Yes (-${quizData.negativeMarks})` : 'No'}</p>
                  <p><span className="font-medium">Randomize Questions:</span> {quizData.randomizeQuestions ? 'Yes' : 'No'}</p>
                  <p><span className="font-medium">Randomize Options:</span> {quizData.randomizeOptions ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Questions Preview (First 3)</h3>
              <div className="space-y-4">
                {questions.slice(0, 3).map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">
                      {index + 1}. {question.question}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className={question.correct_answer === 'a' ? 'text-green-600 font-medium' : ''}>
                        A) {question.option_a}
                      </p>
                      <p className={question.correct_answer === 'b' ? 'text-green-600 font-medium' : ''}>
                        B) {question.option_b}
                      </p>
                      <p className={question.correct_answer === 'c' ? 'text-green-600 font-medium' : ''}>
                        C) {question.option_c}
                      </p>
                      <p className={question.correct_answer === 'd' ? 'text-green-600 font-medium' : ''}>
                        D) {question.option_d}
                      </p>
                    </div>
                  </div>
                ))}
                {questions.length > 3 && (
                  <p className="text-gray-600 text-center">... and {questions.length - 3} more questions</p>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={createQuiz}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateQuiz;