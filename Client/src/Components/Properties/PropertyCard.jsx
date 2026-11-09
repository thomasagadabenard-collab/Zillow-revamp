import '../../css/DashboardPages.css';

function formatPrice(price, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(price));
  } catch {
    return `${currency} ${Number(price).toLocaleString()}`;
  }
}

export default function PropertyCard({ property, saved = false, onToggleSaved, onBuy, busy = false }) {
  const media = property.media?.length ? property.media : (property.images || []);
  const featured = media.find((item) => typeof item === 'string' || item.mediaType !== 'VIDEO') || media[0];
  const src = typeof featured === 'string' ? featured : featured?.url;
  const isVideo = typeof featured === 'object' && featured?.mediaType === 'VIDEO';

  return (
    <article className="dashboard-listing-card">
      <div className="dashboard-listing-media">
        {src && isVideo ? <video src={src} controls preload="metadata" aria-label={`${property.title} property video`} /> : src ? <img src={src} alt={property.title} loading="lazy" /> : <div className="dashboard-page-empty">No media available</div>}
        <button className="dashboard-listing-heart" type="button" aria-label={saved ? `Remove ${property.title} from saved properties` : `Save ${property.title}`} aria-pressed={saved} onClick={() => onToggleSaved?.(property.id)}>{saved ? '♥' : '♡'}</button>
      </div>
      <div className="dashboard-listing-body">
        <span className="dashboard-listing-type">{property.propertyType || property.type || 'Property'}</span>
        <h2>{property.title || property.name}</h2>
        <p className="dashboard-listing-location">⌖ {property.location}</p>
        <div className="dashboard-listing-facts">
          <span>{property.bedrooms ?? 0} beds</span>
          <span>{property.bathrooms ?? 0} baths</span>
          <span>{property.kitchens ?? 1} kitchens</span>
          {property.area && <span>{property.area}</span>}
        </div>
        <div className="dashboard-listing-footer">
          <strong>{formatPrice(property.price, property.currency || 'USD')}</strong>
          <button type="button" onClick={() => onBuy?.(property)} disabled={busy}>{busy ? 'Opening…' : 'Buy with BTC'}</button>
        </div>
      </div>
    </article>
  );
}
