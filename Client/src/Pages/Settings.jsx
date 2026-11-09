import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../Context/Authcontext.jsx';
import '../css/DashboardPages.css';

export default function Settings({ onSignIn }) {
  const { user, login } = useAuth();
  const [name, setName] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setError(''); setMessage(''); setBusy(true);
    try {
      const result = await api('/api/auth/profile', { method: 'POST', body: JSON.stringify({ name: name ?? user.name }) });
      login(result.user); setName(result.user.name); setMessage('Your profile name has been updated.');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError(''); setMessage('');
    if (newPassword !== confirmation) return setError('The new passwords do not match.');
    setBusy(true);
    try {
      await api('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      setCurrentPassword(''); setNewPassword(''); setConfirmation(''); setMessage('Your password has been changed.');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  if (!user) return <main className="dashboard-page-content"><header className="dashboard-page-top"><div><span className="dashboard-page-eyebrow">YOUR ACCOUNT</span><h1>Account Settings</h1><p>Sign in to view and manage your account.</p></div><Link className="dashboard-page-back" to="/dashboard">← Dashboard</Link></header><button className="dashboard-primary-link" type="button" onClick={onSignIn}>Sign in</button></main>;

  return (
    <main className="dashboard-page-content">
      <header className="dashboard-page-top"><div><span className="dashboard-page-eyebrow">ACCOUNT PREFERENCES</span><h1>Account Settings</h1><p>Manage the information used for your Zillow Elite account.</p></div><Link className="dashboard-page-back" to="/dashboard">← Dashboard</Link></header>
      {error && <p className="dashboard-page-error" role="alert">{error}</p>}{message && <p className="dashboard-page-message" role="status">{message}</p>}
      <section className="settings-card">
        <h2>Profile information</h2>
        <div className="settings-profile"><div className="settings-value"><span>Email address</span><strong>{user.email}</strong></div><div className="settings-value"><span>Account created</span><strong>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Account active'}</strong></div></div>
        <form className="settings-form" onSubmit={saveProfile}><label>Full name<input value={name ?? user.name ?? ''} minLength={2} maxLength={160} onChange={(event) => setName(event.target.value)} required /></label><button type="submit" disabled={busy}>Save profile</button></form>
        <div className="settings-separator" />
        <h2>Change password</h2>
        <form className="settings-form" onSubmit={changePassword}><label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label><label>New password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label><label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label><button type="submit" disabled={busy}>Update password</button></form>
      </section>
    </main>
  );
}
