import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Trophy, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, Eye } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

const QuizResults = ({ user }) => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResultsData();
  }, [attemptId]);

  const fetchResultsData = async () => {
    try {
      // Fetch attempt details with quiz information
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

      setAttempt(attemptData);
      setQuiz(attemptData.quizzes);
    } catch (error) {
      console.error('Error fetching results:', error);
      alert('Error loading results. Please try again.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (percentage) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return <LoadingSpinner text="Loading results..." />;
  }

  if (!attempt || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Results not found.</p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link to="/dashboard" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
              <p className="text-gray-600">{quiz.title}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Card */}
        <div className={`bg-white rounded-xl shadow-lg border-2 p-8 mb-8 ${getScoreBackground(attempt.percentage)}`}>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full ${attempt.percentage >= 60 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Trophy className={`w-12 h-12 ${attempt.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {attempt.percentage >= 80 ? 'Excellent!' : attempt.percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'}
            </h2>
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(attempt.percentage)}`}>
              {attempt.percentage}%
            </div>
            <p className="text-xl text-gray-700">
              You scored <span className="font-semibold">{Math.max(0, attempt.score)}</span> out of{' '}
              <span className="font-semibold">{attempt.total_questions * quiz.marks_per_question}</span> marks
            </p>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">{attempt.total_questions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Correct</p>
                <p className="text-2xl font-bold text-green-600">{attempt.correct_answers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wrong</p>
                <p className="text-2xl font-bold text-red-600">{attempt.wrong_answers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unattempted</p>
                <p className="text-2xl font-bold text-gray-600">{attempt.unattempted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Quiz Title:</span>
                <span className="font-medium text-gray-900">{quiz.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Taken:</span>
                <span className="font-medium text-gray-900">{formatTime(attempt.time_taken)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted At:</span>
                <span className="font-medium text-gray-900">
                  {new Date(attempt.submitted_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scoring Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Marks per Question:</span>
                <span className="font-medium text-gray-900">{quiz.marks_per_question}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Correct Answers:</span>
                <span className="font-medium text-green-600">
                  +{attempt.correct_answers * quiz.marks_per_question}
                </span>
              </div>
              {quiz.negative_marking && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Wrong Answers:</span>
                  <span className="font-medium text-red-600">
                    -{attempt.wrong_answers * quiz.negative_marks}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-semibold">Total Score:</span>
                <span className="font-bold text-gray-900">{Math.max(0, attempt.score)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round((attempt.correct_answers / attempt.total_questions) * 100)}%
              </div>
              <p className="text-sm text-gray-600">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.round(((attempt.total_questions - attempt.unattempted) / attempt.total_questions) * 100)}%
              </div>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {attempt.time_taken > 0 ? Math.round(attempt.total_questions / (attempt.time_taken / 60)) : 0}
              </div>
              <p className="text-sm text-gray-600">Questions per Minute</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/review/${attemptId}`}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-5 h-5 mr-2" />
            Review Answers
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;