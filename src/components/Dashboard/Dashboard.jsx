import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
// Added Menu and X for the mobile toggle functionality
import { 
  Plus, 
  BookOpen, 
  Clock, 
  Users, 
  LogOut, 
  FileText, 
  Trophy, 
  Heart, 
  Mail, 
  Info, 
  PlayCircle, 
  Menu, 
  X 
} from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

const Dashboard = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu toggle state
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
  try {
    setIsMenuOpen(false); // Close mobile menu immediately
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Optional: Force a redirect if your App.js doesn't 
    // automatically handle the session change
    // window.location.href = '/login'; 
  } catch (error) {
    console.error('Error logging out:', error.message);
  }
};

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* --- RESPONSIVE HEADER --- */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo Section */}
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="NSCT PrepHub Logo"
                className="w-10 sm:w-[60px]"
              />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 ml-2">NSCT PrepHub</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <span className="text-gray-700 text-sm font-medium">
                Welcome, {user.user_metadata?.full_name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-200">
            <div className="px-4 pt-4 pb-3 space-y-1">
              <p className="px-3 py-2 text-sm text-gray-500 font-medium">
                Signed in as: <span className="text-gray-900">{user.email}</span>
              </p>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
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
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <a
                    href="https://www.youtube.com/watch?v=VMZ7lcSdVnY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Tutorial
                  </a>
                  <Link
                    to="/create-quiz"
                    className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
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
                    <div key={quiz.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-600">
                          {quiz.total_questions} questions • {quiz.time_limit} mins
                        </p>
                      </div>
                      <Link
                        to={`/quiz/${quiz.id}`}
                        className="w-full sm:w-auto text-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
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
                    <div key={attempt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{attempt.quizzes?.title}</h3>
                        <p className="text-sm text-gray-600">
                          Score: {attempt.score}/{attempt.quizzes?.total_questions} ({attempt.percentage}%)
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        to={`/review/${attempt.id}`}
                        className="w-full sm:w-auto text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="text-gray-500 text-sm flex items-center justify-center">
              Developed with <Heart className="w-4 h-4 text-red-500 mx-1 fill-current" />
              <a
                href="https://www.husnainmazhar.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 font-medium hover:text-blue-600 transition-colors"
              >
                Husnain Mazhar
              </a>
            </div>

            <div className="flex items-center space-x-6">
              <a
                href="https://husnainmazhar.site/#contact"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Feedback
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;