import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import CreateQuiz from './components/Quiz/CreateQuiz';
import QuizInterface from './components/Quiz/QuizInterface';
import QuizResults from './components/Quiz/QuizResults';
import QuizReview from './components/Quiz/QuizReview';
import LoadingSpinner from './components/UI/LoadingSpinner';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/register" 
            element={!user ? <Register /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/create-quiz" 
            element={user ? <CreateQuiz user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/quiz/:quizId" 
            element={user ? <QuizInterface user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/results/:attemptId" 
            element={user ? <QuizResults user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/review/:attemptId" 
            element={user ? <QuizReview user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;