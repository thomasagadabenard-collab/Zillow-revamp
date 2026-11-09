import { useEffect, useState } from 'react';
import { useAuth } from '../../Context/Authcontext.jsx';
import { api } from '../../api.js';
import '../../css/AdminDashboard.css';

const emptyForm = { title: '', price: '', currency: 'USD', location: '', propertyType: 'House', bedrooms: '', bathrooms: '', kitchens: '1', area: '', description: '' };

function formatPrice(price, currency = 'USD') {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(price)); }
  catch { return `${currency} ${Number(price).toLocaleString()}`; }
}

export default function AdminDashboard() {
  const { user, login, logout, authLoading } = useAuth();
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadProperties() {
    const data = await api('/api/properties/admin/all');
    setProperties(data.items);
  }

  async function loadInquiries() {
    const data = await api('/api/inquiries/admin');
    setInquiries(data.items || []);
  }

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let active = true;
    Promise.all([api('/api/properties/admin/all'), api('/api/inquiries/admin')])
      .then(([propertyData, inquiryData]) => {
        if (!active) return;
        setProperties(propertyData.items || []);
        setInquiries(inquiryData.items || []);
      })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [user?.role]);

  async function handleLogin(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await api('/api/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      login(result.user);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function handleFileChange(event) {
    const chosen = Array.from(event.target.files || []);
    const all = [...files, ...chosen];
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'];
    if (all.length > 8) { setError('You can upload at most 8 photos or videos per property.'); event.target.value = ''; return; }
    if (chosen.some((file) => !allowed.includes(file.type) || (file.type.startsWith('image/') && file.size > 1.5 * 1024 * 1024) || (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024))) {
      setError('Use JPEG/PNG/WEBP/AVIF photos up to 1.5 MB, or MP4/WebM videos up to 50 MB.'); event.target.value = ''; return;
    }
    setError(''); setFiles(all); event.target.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault(); setMessage(''); setError('');
    if (!files.length) { setError('Upload at least one property photo or video.'); return; }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    files.forEach((file) => data.append('media', file));
    setBusy(true);
    try {
      await api('/api/properties/admin', { method: 'POST', body: data });
      setForm(emptyForm); setFiles([]); setMessage('Property published successfully.'); await loadProperties();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function archiveProperty(id) {
    if (!window.confirm('Archive this listing? It will no longer appear to buyers.')) return;
    setError('');
    try { await api(`/api/properties/admin/${id}`, { method: 'DELETE' }); await loadProperties(); setMessage('Listing archived.'); }
    catch (e) { setError(e.message); }
  }

  async function updateInquiryStatus(id, status) {
    setError(''); setMessage('');
    try {
      await api(`/api/inquiries/admin/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadInquiries();
      setMessage('Submission status updated.');
    } catch (e) { setError(e.message); }
  }

  if (authLoading) return <main className="admin-dashboard"><p className="admin-message">Checking administrator session…</p></main>;
  if (user?.role !== 'ADMIN') {
    return (
      <main className="admin-dashboard" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <form className="admin-panel" onSubmit={handleLogin} style={{ width: 'min(440px, 100%)', padding: 32 }}>
          <span className="admin-section-label">ZILLOW ELITE</span>
          <h1>Administrator sign in</h1>
          <p>Sign in with the administrator credentials configured by the site owner.</p>
          <label className="admin-field"><span>Email address</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
          <label className="admin-field"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {error && <p className="admin-message" role="alert">{error}</p>}
          <button className="admin-submit-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </main>
    );
  }

  const active = properties.filter((item) => item.status === 'ACTIVE');
  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand"><div className="admin-brand__icon">Z</div><div><h2>Zillow Elite</h2><span>Admin Panel</span></div></div>
        <div className="admin-sidebar__section"><span className="admin-sidebar__heading">MAIN MENU</span><a href="#overview" className="admin-nav-link active"><span>▦</span>Overview</a><a href="#add-property" className="admin-nav-link"><span>＋</span>Add Property</a><a href="#properties" className="admin-nav-link"><span>⌂</span>Manage Properties</a><a href="#inquiries" className="admin-nav-link"><span>✉</span>Seller requests {inquiries.filter((item) => item.status === 'NEW').length > 0 && <small>{inquiries.filter((item) => item.status === 'NEW').length}</small>}</a></div>
        <div className="admin-sidebar__bottom"><a href="/" className="admin-nav-link"><span>↗</span>View Website</a><button className="admin-nav-link" onClick={() => logout()}><span>↪</span>Sign out</button></div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar"><div><span className="admin-topbar__eyebrow">ADMINISTRATION</span><h1>Dashboard</h1></div><div className="admin-profile"><div className="admin-profile__avatar">{user.name?.[0] || 'A'}</div><div><strong>{user.name}</strong><span>{user.email}</span></div></div></header>
        <div className="admin-content">
          {error && <p className="admin-message" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
          <section id="overview" className="admin-welcome"><div><span>WELCOME BACK</span><h2>Manage your properties</h2><p>Published listings are saved to the PostgreSQL database and shown to visitors.</p></div><div className="admin-welcome__icon">⌂</div></section>
          <section className="admin-stats"><article className="admin-stat-card"><div className="admin-stat-icon blue">⌂</div><div><span>Total Listings</span><strong>{properties.length}</strong></div></article><article className="admin-stat-card"><div className="admin-stat-icon green">✓</div><div><span>Active Listings</span><strong>{active.length}</strong></div></article><article className="admin-stat-card"><div className="admin-stat-icon orange">＋</div><div><span>Recently Added</span><strong>{properties.filter((p) => new Date(p.createdAt).toDateString() === new Date().toDateString()).length}</strong></div></article></section>
          <section id="add-property" className="admin-panel">
            <div className="admin-panel__heading"><div><span className="admin-section-label">PROPERTY MANAGEMENT</span><h2>Add a New Property</h2><p>Enter the listing details and upload up to eight photos or videos.</p></div></div>
            <form onSubmit={handleSubmit} className="admin-property-form">
              <div className="admin-form-grid">
                <div className="admin-field admin-field--full"><label htmlFor="title">Property Name *</label><input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} minLength="3" maxLength="180" required /></div>
                <div className="admin-field"><label htmlFor="price">Price ({form.currency}) *</label><input id="price" type="number" min="1" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                <div className="admin-field"><label htmlFor="currency">Price Currency</label><select id="currency" value="USD" disabled><option value="USD">USD (paid in BTC)</option></select></div>
                <div className="admin-field"><label htmlFor="location">Location *</label><input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength="180" required /></div>
                <div className="admin-field"><label htmlFor="propertyType">Property Type</label><select id="propertyType" value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}><option>House</option><option>Apartment</option><option>Duplex</option><option>Villa</option><option>Land</option><option>Commercial</option></select></div>
                <div className="admin-field"><label htmlFor="bedrooms">Bedrooms</label><input id="bedrooms" type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
                <div className="admin-field"><label htmlFor="bathrooms">Bathrooms</label><input id="bathrooms" type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
                <div className="admin-field"><label htmlFor="kitchens">Kitchens</label><input id="kitchens" type="number" min="0" value={form.kitchens} onChange={(e) => setForm({ ...form, kitchens: e.target.value })} /></div>
                <div className="admin-field"><label htmlFor="area">Area</label><input id="area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. 450 sqm" /></div>
                <div className="admin-field admin-field--full"><label htmlFor="description">Description</label><textarea id="description" rows="4" maxLength="10000" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="admin-field admin-field--full"><label>Property photos/videos * (maximum 8; images 1.5 MB and videos 50 MB each)</label><input type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" multiple onChange={handleFileChange} />{files.map((file, i) => <span key={`${file.name}-${i}`} style={{ display: 'block', marginTop: 6 }}>{file.type.startsWith('video/') ? 'Video: ' : 'Image: '}{file.name} <button type="button" onClick={() => setFiles(files.filter((_, index) => index !== i))}>Remove</button></span>)}</div>
              </div>
              <div className="admin-form-actions"><button type="button" className="admin-reset-button" onClick={() => { setForm(emptyForm); setFiles([]); setError(''); setMessage(''); }}>Clear Form</button><button type="submit" className="admin-submit-button" disabled={busy}>{busy ? 'Publishing…' : '+ Publish Property'}</button></div>
            </form>
          </section>
          <section id="properties" className="admin-panel"><div className="admin-panel__heading admin-list-heading"><div><span className="admin-section-label">YOUR CATALOGUE</span><h2>Manage Properties</h2><p>Listings stored on the server.</p></div><span className="admin-count">{properties.length} Listings</span></div>
            {!properties.length ? <div className="admin-empty-state"><span>⌂</span><h3>No properties yet</h3><p>Published properties will appear here.</p></div> : <div className="admin-property-list">{properties.map((property) => <article className="admin-property-row" key={property.id}>{property.images?.[0]?.mediaType === 'VIDEO' ? <video className="admin-property-row__image" src={property.images[0].url} controls preload="metadata" /> : <img className="admin-property-row__image" src={property.images?.[0]?.url} alt={property.title} />}<div className="admin-property-row__details"><h3>{property.title}</h3><span>{property.location}</span><small>{property.propertyType} · {property.bedrooms} Beds · {property.bathrooms} Baths · {property.kitchens} Kitchens · {property.media?.length || property.images?.length || 0} media</small></div><strong className="admin-property-row__price">{formatPrice(property.price, property.currency)}</strong><span className="admin-status">{property.status}</span>{property.status === 'ACTIVE' && <button className="admin-delete-button" type="button" onClick={() => archiveProperty(property.id)}>Archive</button>}</article>)}</div>}
          </section>
          <section id="inquiries" className="admin-panel">
            <div className="admin-panel__heading admin-list-heading"><div><span className="admin-section-label">SELLER INBOX</span><h2>Property listing requests</h2><p>Review owner submissions before publishing a listing.</p></div><span className="admin-count">{inquiries.length} Requests</span></div>
            {!inquiries.length ? <div className="admin-empty-state"><span>✉</span><h3>No seller requests yet</h3><p>Submissions from the List Property form will appear here.</p></div> : <div className="admin-inquiry-list">{inquiries.map((item) => <article className="admin-inquiry-card" key={item.id}>
              <div className="admin-inquiry-head"><div><span className="admin-section-label">{item.status} · {new Date(item.createdAt).toLocaleString()}</span><h3>{item.title}</h3><p>{item.propertyType} · {item.address}, {item.city}</p></div><strong>{formatPrice(item.price, 'USD')}</strong></div>
              <div className="admin-inquiry-contact"><a href={`mailto:${item.email}`}>{item.fullName} · {item.email}</a><a href={`tel:${item.phone}`}>{item.phone}</a></div>
              <p className="admin-inquiry-description">{item.description}</p>
              <p className="admin-inquiry-facts">{item.bedrooms} bedrooms · {item.bathrooms} bathrooms · {item.kitchens} kitchens</p>
              {!!item.media?.length && <div className="admin-inquiry-media">{item.media.map((media) => media.mediaType === 'VIDEO' ? <video key={media.id} src={media.url} controls preload="metadata" aria-label={`Seller video: ${item.title}`} /> : <a key={media.id} href={media.url} target="_blank" rel="noreferrer"><img src={media.url} alt={`${item.title} submitted property`} loading="lazy" /></a>)}</div>}
              <label className="admin-inquiry-status">Update request status<select value={item.status} onChange={(event) => updateInquiryStatus(item.id, event.target.value)}><option value="NEW">New</option><option value="REVIEWED">Reviewed</option><option value="CONTACTED">Contacted</option><option value="CLOSED">Closed</option></select></label>
            </article>)}</div>}
          </section>
        </div>
      </main>
    </div>
  );
}
