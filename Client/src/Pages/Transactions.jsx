import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../Context/Authcontext.jsx';
import '../css/DashboardPages.css';

const labels = {
  PENDING: 'Awaiting payment',
  CONFIRMING: 'Payment confirming',
  PAID: 'Paid',
  PARTIALLY_PAID: 'Partially paid',
  FAILED: 'Failed',
  EXPIRED: 'Expired',
  REFUNDED: 'Refunded',
  REVIEW: 'Under review',
};

export default function Transactions({ onSignIn }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    api('/api/orders')
      .then((data) => { if (active) setOrders(data.items || []); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  if (!user) return <main className="transactions-wrap"><header className="dashboard-page-top"><div><span className="dashboard-page-eyebrow">PURCHASE HISTORY</span><h1>My Transactions</h1><p>Sign in to view your property payment records.</p></div><Link className="dashboard-page-back" to="/dashboard">← Dashboard</Link></header><button className="dashboard-primary-link" type="button" onClick={onSignIn}>Sign in</button></main>;

  return (
    <main className="transactions-wrap">
      <header className="dashboard-page-top"><div><span className="dashboard-page-eyebrow">PURCHASE HISTORY</span><h1>My Transactions</h1><p>Payment states are updated from signed NOWPayments notifications.</p></div><Link className="dashboard-page-back" to="/dashboard">← Dashboard</Link></header>
      {error && <p className="dashboard-page-error" role="alert">{error}</p>}
      {loading ? <p>Loading transactions…</p> : orders.length === 0 ? <section className="dashboard-page-empty"><h2>No transactions yet</h2><p>Your crypto purchase orders will appear here.</p><Link className="dashboard-primary-link" to="/dashboard/properties">Browse properties</Link></section> : (
        <div style={{ display: 'grid', gap: 14 }}>
          {orders.map((order) => {
            const photo = order.property.images?.find((item) => item.mediaType !== 'VIDEO');
            const video = order.property.images?.find((item) => item.mediaType === 'VIDEO');
            return <article className="transactions-card" key={order.id}>
              {photo?.url ? <img src={photo.url} alt={order.property.title} /> : video?.url ? <video src={video.url} controls preload="metadata" /> : null}
              <div className="transactions-card-body">
                <h2>{order.property.title}</h2><p>{order.property.location}</p>
                <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD', maximumFractionDigits: 2 }).format(Number(order.amount))}</strong>
                <p>{labels[order.status] || order.status}{order.payCurrency ? ` · ${order.payCurrency.toUpperCase()}${order.payAmount ? ` ${order.payAmount}` : ''}` : ' · BTC invoice'}</p>
                <small>Order {order.id} · {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}{order.paidAt ? ` · paid ${new Date(order.paidAt).toLocaleDateString()}` : ''}</small>
              </div>
              {order.invoiceUrl && ['PENDING', 'PARTIALLY_PAID', 'CONFIRMING'].includes(order.status) && <a href={order.invoiceUrl} target="_blank" rel="noreferrer">Open invoice</a>}
            </article>;
          })}
        </div>
      )}
    </main>
  );
}
