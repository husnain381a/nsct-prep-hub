import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AuthLayout from './AuthLayout';

export default function Register() {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (name === 'password' || name === 'confirmPassword') setPasswordError('');
    setConfirmationSent(false);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setPasswordError('');
    setConfirmationSent(false);

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName } },
      });
      if (signUpError) setError(signUpError.message);
      else if (!data.session) setConfirmationSent(true);
    } catch {
      setError('Registration is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an account" description="Save your quizzes and see your progress across attempts.">
      <form className="auth-form" onSubmit={handleRegister}>
        {error && <p className="auth-message auth-error" role="alert">{error}</p>}
        {confirmationSent && <p className="auth-message auth-success" role="status">Check your inbox for the email confirmation link.</p>}
        <div className="auth-field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" autoComplete="name" required value={formData.fullName} onChange={handleChange} />
        </div>
        <div className="auth-field">
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" required value={formData.email} onChange={handleChange} />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} aria-describedby="password-hint" required value={formData.password} onChange={handleChange} />
          <p className="auth-hint" id="password-hint">At least 6 characters.</p>
        </div>
        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'confirm-password-error' : undefined} required value={formData.confirmPassword} onChange={handleChange} />
          {passwordError && <p className="auth-field-error" id="confirm-password-error" role="alert">{passwordError}</p>}
        </div>
        <button className="app-button app-button-primary" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'} <ArrowRight aria-hidden="true" size={18} />
        </button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
