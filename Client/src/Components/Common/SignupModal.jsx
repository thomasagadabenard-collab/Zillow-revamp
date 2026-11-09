import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import '../../css/SignupModal.css';

export default function SignupModal({ isOpen, onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function closeDialog() {
    setMode('login');
    setError('');
    setMessage('');
    onClose();
  }

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => { if (event.key === 'Escape') { setMode('login'); setError(''); setMessage(''); onClose(); } };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (mode === 'register' && password !== confirmation) return setError('The passwords do not match.');
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const result = await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
        setMessage(result.message || 'If that email has an account, a reset link will be sent.');
        return;
      }
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'register' ? { name, email, password } : { email, password };
      const result = await api(endpoint, { method: 'POST', body: JSON.stringify(body) });
      setMode('login');
      setError('');
      setMessage('');
      onAuthenticated?.(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  return (
    <div className="signup-modal" role="presentation" onMouseDown={closeDialog}>
      <section className="signup-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="signup-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="signup-modal__close" type="button" onClick={closeDialog} aria-label="Close sign-in dialog">×</button>
        <div className="signup-modal__header">
          <p className="signup-modal__eyebrow">WELCOME TO ZILLOW ELITE</p>
          <h2 id="signup-modal-title">{isForgot ? 'Reset your password' : isRegister ? 'Create your account' : 'Sign in'}</h2>
          <p>{isForgot ? 'Enter the email address on your account. We will send a one-time reset link.' : isRegister ? 'Create an account with your name, email address, and password.' : 'Sign in to save properties and view your transactions.'}</p>
        </div>
        <form className="signup-modal__form" onSubmit={handleSubmit}>
          {isRegister && <label className="signup-modal__field">Full name<input type="text" autoComplete="name" minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} required /></label>}
          <label className="signup-modal__field">Email address<input type="email" autoComplete="email" maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          {!isForgot && <label className="signup-modal__field">Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 12 : undefined} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>}
          {isRegister && <label className="signup-modal__field">Confirm password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>}
          {error && <p className="signup-modal__error" role="alert">{error}</p>}
          {message && <p className="signup-modal__success" role="status">{message}</p>}
          <button className="signup-modal__submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isForgot ? 'Send reset link' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        {!isRegister && !isForgot && <button className="signup-modal__text-button signup-modal__forgot" type="button" onClick={() => switchMode('forgot')}>Forgot password?</button>}
        <p className="signup-modal__switch">
          {isRegister ? 'Already have an account?' : isForgot ? 'Remember your password?' : 'New to Zillow Elite?'}{' '}
          <button className="signup-modal__text-button" type="button" onClick={() => switchMode(isRegister || isForgot ? 'login' : 'register')}>{isRegister || isForgot ? 'Sign in' : 'Create an account'}</button>
        </p>
        <p className="signup-modal__terms">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
      </section>
    </div>
  );
}
