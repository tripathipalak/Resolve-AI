import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import { useAuth } from '../auth';
import './login.css';

const points = [
  'AI-assisted complaint investigation',
  'Citations checked against retrieved policy',
  'Agent approval before any reply is sent',
  'Ticket tracking for customers'
];

const ERRORS = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/popup-closed-by-user': null
};

function friendly(err) {
  if (err.code && err.code in ERRORS) return ERRORS[err.code];
  return err.message;
}

export default function AgentLogin() {
  const { loginWithEmail, loginWithGoogle, isAuthed, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (!loading && isAuthed) return <Navigate to="/agent" replace />;

  async function run(action) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (err) {
      const msg = friendly(err);
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    run(() => loginWithEmail(email, password, remember));
  }

  function forgotPassword() {
    if (!email) return setError('Enter your email first, then click Forgot password.');
    run(async () => {
      await sendPasswordResetEmail(firebaseAuth, email);
      setNotice('Password reset email sent. Check your inbox.');
    });
  }

  return (
    <div className="login-page">
      <motion.aside className="login-left"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <div className="login-left-inner">
          <span className="logo logo-lg">R</span>
          <h1>ResolveAI</h1>
          <p className="login-left-sub">The agent workspace for complaint investigation and approval.</p>
          <ul className="login-points">
            {points.map(p => (
              <li key={p}><span className="login-dot" />{p}</li>
            ))}
          </ul>
        </div>
      </motion.aside>

      <div className="login-right">
        <motion.div className="login-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <h2>Welcome back</h2>
          <p className="login-sub">Sign in to your agent account to continue.</p>

          {error && <div className="login-err">{error}</div>}
          {notice && <div className="login-ok">{notice}</div>}

          <form onSubmit={submit}>
            <label className="login-label" htmlFor="email">Email address</label>
            <input id="email" className="login-input" type="email" required
              placeholder="agent@company.com" value={email} onChange={e => setEmail(e.target.value)} />

            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-pass">
              <input id="password" className="login-input"
                type={showPassword ? 'text' : 'password'} required
                placeholder="Enter your password" value={password}
                onChange={e => setPassword(e.target.value)} />
              <button type="button" className="login-toggle" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="login-row">
              <label className="login-check">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                Keep me logged in
              </label>
              <button type="button" className="login-link" onClick={forgotPassword} disabled={busy}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="login-or">or</div>

          <button type="button" className="login-btn ghost"
            onClick={() => run(() => loginWithGoogle())} disabled={busy}>
            <GoogleIcon /> Continue with Google
          </button>

          <p className="login-foot">Don't have an account? Ask an admin to invite you.</p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}