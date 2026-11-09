import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../Context/Authcontext.jsx';
import PropertyCard from '../Components/Properties/PropertyCard.jsx';
import '../css/DashboardPages.css';

export default function SavedProperties({ onSignIn }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    api('/api/properties/saved')
      .then((data) => { if (active) setProperties(data.items || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  async function removeSaved(id) {
    try {
      await api(`/api/properties/saved/${id}`, { method: 'DELETE' });
      setProperties((current) => current.filter((item) => item.id !== id));
    } catch (requestError) { setError(requestError.message); }
  }

  async function buyProperty(property) {
    if (!user) return onSignIn?.();
    setError('');
    setBusyId(property.id);
    try {
      const result = await api('/api/payments/checkout', { method: 'POST', body: JSON.stringify({ propertyId: property.id }) });
      window.location.assign(result.order.invoiceUrl);
    } catch (requestError) { setError(requestError.message); setBusyId(''); }
  }

  if (!user) return <main className="dashboard-page-content"><header className="dashboard-page-top"><div><span className="dashboard-page-eyebrow">YOUR ACCOUNT</span><h1>Saved Properties</h1><p>Sign in to see the homes you have saved.</p></div><Link className="dashboard-page-back" to="/dashboard">← Dashboard</Link></header><button className="dashboard-primary-link" type="button" onClick={onSignIn}>Sign in</button></main>;

  return (
    <main className="dashboard-page-content">
      <header className="dashboard-page-top"><div><span className="dashboard-page-eyebrow">YOUR SHORTLIST</span><h1>Saved Properties</h1><p>Listings you saved from the dashboard or property catalogue.</p></div><Link className="dashboard-page-back" to="/dashboard">← Dashboard</Link></header>
      {error && <p className="dashboard-page-error" role="alert">{error}</p>}
      {loading ? <p>Loading saved properties…</p> : properties.length ? <div className="dashboard-listing-grid">{properties.map((property) => <PropertyCard key={property.id} property={property} saved onToggleSaved={removeSaved} onBuy={buyProperty} busy={busyId === property.id} />)}</div> : <section className="dashboard-page-empty"><h2>No saved properties yet</h2><p>Browse listings and tap the heart to keep them here.</p><Link className="dashboard-primary-link" to="/dashboard/properties">Browse properties</Link></section>}
    </main>
  );
}
