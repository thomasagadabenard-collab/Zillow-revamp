import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fetchAllProperties } from '../api.js';
import { useAuth } from '../Context/Authcontext.jsx';
import PropertyCard from '../Components/Properties/PropertyCard.jsx';
import '../css/DashboardPages.css';

export default function BrowseProperties({ onSignIn }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let active = true;
    fetchAllProperties()
      .then((items) => { if (active) setProperties(items); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    api('/api/properties/saved')
      .then((data) => { if (active) setSavedIds(new Set((data.items || []).map((item) => item.id))); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [user]);

  const filtered = useMemo(() => properties.filter((item) => `${item.title} ${item.location} ${item.propertyType}`.toLowerCase().includes(search.toLowerCase())), [properties, search]);

  async function toggleSaved(id) {
    if (!user) return onSignIn?.();
    try {
      if (savedIds.has(id)) {
        await api(`/api/properties/saved/${id}`, { method: 'DELETE' });
        setSavedIds((current) => { const next = new Set(current); next.delete(id); return next; });
      } else {
        await api(`/api/properties/saved/${id}`, { method: 'PUT' });
        setSavedIds((current) => new Set(current).add(id));
      }
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

  return (
    <main className="dashboard-page-content">
      <header className="dashboard-page-top"><div><span className="dashboard-page-eyebrow">PROPERTY CATALOGUE</span><h1>Browse Properties</h1><p>Live listings published by the Zillow Elite administrator.</p></div><Link className="dashboard-page-back" to="/dashboard">← Dashboard</Link></header>
      <label className="dashboard-page-search">Search listings<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, location or type" /></label>
      {error && <p className="dashboard-page-error" role="alert">{error}</p>}
      {loading ? <p>Loading properties…</p> : filtered.length ? <div className="dashboard-listing-grid">{filtered.map((property) => <PropertyCard key={property.id} property={property} saved={savedIds.has(property.id)} onToggleSaved={toggleSaved} onBuy={buyProperty} busy={busyId === property.id} />)}</div> : <section className="dashboard-page-empty"><h2>No properties found</h2><p>{properties.length ? 'Try a different search.' : 'New properties will appear here when the admin publishes them.'}</p></section>}
    </main>
  );
}
