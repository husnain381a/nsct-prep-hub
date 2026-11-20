import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AuthLayout from './AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
    } catch {
      setError('Sign-in is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in" description="Open your quizzes and pick up where you left off.">
      <form className="auth-form" onSubmit={handleLogin}>
        {error && <p className="auth-message auth-error" role="alert">{error}</p>}
        <div className="auth-field">
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <button className="app-button app-button-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'} <ArrowRight aria-hidden="true" size={18} />
        </button>
      </form>
      <p className="auth-switch">New to NSCT PrepHub? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
}
