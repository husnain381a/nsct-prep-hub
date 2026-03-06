import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
// Added Info and PlayCircle icons
import { Plus, BookOpen, Clock, Users, LogOut, FileText, Trophy, Heart, Mail, Info, PlayCircle } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

const Dashboard = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalAttempts: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's quizzes
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      // Fetch user's attempts
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes (
            title,
            total_questions
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setQuizzes(quizzesData || []);
      setAttempts(attemptsData || []);

      // Calculate stats
      const totalAttempts = attemptsData?.length || 0;
      const averageScore = totalAttempts > 0
        ? attemptsData.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalAttempts
        : 0;

      setStats({
        totalQuizzes: quizzesData?.length || 0,
        totalAttempts,
        averageScore: Math.round(averageScore)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="NSCT PrepHub Logo"
               width={70}
              />
              <h1 className="text-2xl font-bold text-gray-900">NSCT PrepHub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.user_metadata?.full_name || user.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* NSCT Info Banner */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 mb-8 flex flex-col sm:flex-row items-start sm:items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-0 sm:mr-4 mb-4 sm:mb-0 flex-shrink-0">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-1">What is the NSCT Test?</h2>
            <p className="text-blue-800 text-sm">
              The National Scholarship Competitive Test (NSCT) is a standardized assessment designed by HEC to evaluate students' academic proficiency and core competencies. It helps identify top talent for scholarships and advanced educational programs.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Quizzes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-gray-900">My Quizzes</h2>

                {/* Tutorial and Create Buttons */}
                <div className="flex items-center space-x-3">
                  <a
                    href="https://www.youtube.com/watch?v=VMZ7lcSdVnY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    How to make a quiz?
                  </a>
                  <Link
                    to="/create-quiz"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quiz
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6">
              {quizzes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No quizzes created yet</p>
                  <Link
                    to="/create-quiz"
                    className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                  >
                    Create your first quiz
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizzes.slice(0, 5).map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-600">
                          {quiz.total_questions} questions • {quiz.time_limit} minutes
                        </p>
                      </div>
                      <Link
                        to={`/quiz/${quiz.id}`}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Start Quiz
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Attempts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Attempts</h2>
            </div>
            <div className="p-6">
              {attempts.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No quiz attempts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{attempt.quizzes?.title}</h3>
                        <p className="text-sm text-gray-600">
                          Score: {attempt.score}/{attempt.quizzes?.total_questions} ({attempt.percentage}%)
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        to={`/review/${attempt.id}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">

            {/* Developed By */}
            <div className="text-gray-500 text-sm flex items-center mb-4 md:mb-0">
              Developed with <Heart className="w-4 h-4 text-red-500 mx-1 fill-current" />
              <a
                href="https://www.husnainmazhar.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 hover:text-blue-600 transition-colors"
              >
                Husnain Mazhar
              </a>
            </div>

            {/* Contact & Feedback */}
            <div className="flex items-center space-x-6">
              {/* <a 
                href="mailto:husnainmazhar002@gmail.com" 
                className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Us
              </a> */}
              <a
                href="https://husnainmazhar.site/#contact" target='_blank'
                className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Provide Feedback
              </a>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;