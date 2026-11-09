import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import '../css/ResetPassword.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!token) return setError('This password-reset link is missing its token. Request a new one.');
    if (password !== confirmation) return setError('The passwords do not match.');
    setBusy(true);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="reset-password-page">
      <section className="reset-password-card">
        <span>ZILLOW ELITE ACCOUNT</span>
        <h1>{success ? 'Password updated' : 'Set a new password'}</h1>
        {success ? (
          <>
            <p>Your password is ready. Sign in using your email address and your new password.</p>
            <Link to="/">Return to Zillow Elite</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p>Choose a strong password with at least 12 characters.</p>
            <label>New password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
            {error && <p className="reset-password-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
          </form>
        )}
      </section>
    </main>
  );
}
