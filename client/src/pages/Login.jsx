import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle } from 'lucide-react';
import '../index.css'; // Global styles

const authErrors = {
  'auth/user-not-found':    'No account found with this email.',
  'auth/wrong-password':    'Incorrect password.',
  'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password':     'Password must be at least 8 characters.',
  'auth/invalid-email':     'Please enter a valid email address.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/network-request-failed': 'Connection failed. Check your internet.',
  'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.'
};

const getAuthError = (code) => 
  authErrors[code] || 'Something went wrong. Please try again.';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
      // Navigation is now handled by the useEffect above once AuthContext updates
    } catch (err) {
      setError(getAuthError(err.code));
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      if (isRegistering) {
        await registerWithEmail(email, password, email.split('@')[0]);
      } else {
        await loginWithEmail(email, password);
      }
      // Navigation is handled by useEffect
    } catch (err) {
      setError(getAuthError(err.code));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-[#F5F5F5] font-sans relative px-4">
      <div className="login-card z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity">
            <svg style={{ color: '#F5F5F5', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span className="font-serif text-2xl font-bold tracking-tight">
              <span className="font-normal italic text-[#D4AF37]">Civic</span>Pulse
            </span>
          </Link>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6C6863]">
            CIVIC INFRASTRUCTURE · AI-POWERED
          </div>
        </div>

        <hr className="border-t border-[rgba(255,255,255,0.06)] my-8" />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-900/50 rounded flex items-start gap-2 text-red-200 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Google Auth */}
        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn-google flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]"></div>
          <span className="text-xs text-[#6C6863] font-mono">OR</span>
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]"></div>
        </div>

        {/* Email Auth */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <input 
              type="email" 
              placeholder="Email address"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-signin mt-2 disabled:opacity-50"
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-[#F5F5F5] hover:text-[#D4AF37] transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-12 text-center text-[10px] text-[#6C6863] leading-relaxed">
          By continuing, you agree to our <br/>
          <a href="#" className="underline hover:text-[#F5F5F5]">Terms of Service</a> and <a href="#" className="underline hover:text-[#F5F5F5]">Privacy Policy</a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .login-card {
          background: #0F0F0F;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 48px 40px;
          width: 100%;
          max-width: 400px;
        }
        .login-input {
          width: 100%;
          background: #080808;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 12px 16px;
          color: #F5F5F5;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .login-input:focus {
          border-color: rgba(255,255,255,0.24);
        }
        .btn-google {
          width: 100%;
          background: #F5F5F5;
          color: #080808;
          border: none;
          border-radius: 6px;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-google:hover { background: #ffffff; }
        .btn-signin {
          width: 100%;
          background: transparent;
          color: #F5F5F5;
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 6px;
          padding: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-signin:hover {
          border-color: rgba(255,255,255,0.4);
        }
      `}} />
    </div>
  );
}
