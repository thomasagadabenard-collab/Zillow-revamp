import { useEffect, useMemo, useState } from "react";
import { api, fetchAllProperties } from "../api.js";
import { useAuth } from "../Context/Authcontext.jsx";
import "../css/Buy.css";
import RealEstateFooter from "../Components/Common/RealEstateFooter";
import PropertyDetails from "../Components/Properties/PropertyDetails";

function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function Buy({ onSignIn }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [propertyType, setPropertyType] = useState("All Types");
  const [maxPrice, setMaxPrice] = useState("Any Price");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutId, setCheckoutId] = useState('');

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

  const locations = useMemo(() => [...new Set(properties.map((item) => item.city || item.location).filter(Boolean))].sort(), [properties]);
  const propertyTypes = useMemo(() => [...new Set(properties.map((item) => item.propertyType || item.type).filter(Boolean))].sort(), [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        property.title.toLowerCase().includes(search.toLowerCase()) ||
        property.location.toLowerCase().includes(search.toLowerCase());

      const matchesLocation =
        location === "All Locations" || (property.city || property.location) === location;

      const matchesType =
        propertyType === "All Types" || (property.propertyType || property.type) === propertyType;

      const matchesPrice =
        maxPrice === "Any Price" || property.price <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesType &&
        matchesPrice
      );
    });
  }, [properties, search, location, propertyType, maxPrice]);

  async function toggleSaved(propertyId) {
    if (!user) return onSignIn?.();
    try {
      if (savedIds.has(propertyId)) {
        await api(`/api/properties/saved/${propertyId}`, { method: 'DELETE' });
        setSavedIds((current) => { const next = new Set(current); next.delete(propertyId); return next; });
      } else {
        await api(`/api/properties/saved/${propertyId}`, { method: 'PUT' });
        setSavedIds((current) => new Set(current).add(propertyId));
      }
    } catch (requestError) { setError(requestError.message); }
  }

  async function buyProperty(property) {
    if (!user) return onSignIn?.();
    setError(''); setCheckoutId(property.id);
    try {
      const result = await api('/api/payments/checkout', { method: 'POST', body: JSON.stringify({ propertyId: property.id }) });
      window.location.assign(result.order.invoiceUrl);
    } catch (requestError) { setError(requestError.message); setCheckoutId(''); }
  }

  function resetFilters() {
    setSearch("");
    setLocation("All Locations");
    setPropertyType("All Types");
    setMaxPrice("Any Price");
  }

  return (
    <main className="buy-page">
      <section className="buy-hero">
        <div className="buy-hero__content">
          <span className="buy-eyebrow">FIND YOUR PLACE WITH ZILLOWELITE</span>
          <h1>Find a property that feels like home.</h1>
          <p>
            Explore carefully selected properties and discover a place
            that matches your lifestyle and budget.
          </p>

          <a href="#property-results" className="buy-hero__button">
            Explore Properties
          </a>
        </div>
      </section>

      <section className="buy-search-section">
        <div className="buy-search-heading">
          <div>
            <span className="buy-section-label">PROPERTY SEARCH</span>
            <h2>Discover available properties</h2>
          </div>
          <span className="buy-result-count">
            {filteredProperties.length} properties found
          </span>
        </div>

        <div className="buy-filters">
          <div className="buy-filter buy-filter--search">
            <label htmlFor="buy-search">Search</label>
            <input
              id="buy-search"
              type="search"
              placeholder="Property name or location"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="buy-filter">
            <label htmlFor="buy-location">Location</label>
            <select
              id="buy-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            >
              <option>All Locations</option>
              {locations.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div className="buy-filter">
            <label htmlFor="buy-type">Property Type</label>
            <select
              id="buy-type"
              value={propertyType}
              onChange={(event) => setPropertyType(event.target.value)}
            >
              <option>All Types</option>
              {propertyTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div className="buy-filter">
            <label htmlFor="buy-price">Maximum Price</label>
            <select
              id="buy-price"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            >
              <option>Any Price</option>
              <option value="500000">$500,000</option>
              <option value="1000000">$1,000,000</option>
              <option value="2000000">$2,000,000</option>
              <option value="3000000">$3,000,000</option>
              <option value="5000000">$5,000,000</option>
            </select>
          </div>

          <button
            className="buy-reset-button"
            type="button"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </section>

      <section id="property-results" className="buy-listings-section">
        <div className="buy-listings-heading">
          <div>
            <span className="buy-section-label">EXPLORE OUR COLLECTION</span>
            <h2>Properties for sale</h2>
          </div>
        </div>

        {error && <p className="buy-error" role="alert">{error}</p>}
        {loading ? <p className="buy-loading">Loading available properties…</p> : filteredProperties.length > 0 ? (
          <div className="buy-property-grid">
            {filteredProperties.map((property) => (
              <article className="buy-property-card" key={property.id}>
                <div className="buy-property-image">
                  {property.media?.[0]?.mediaType === 'VIDEO' ? <video src={property.media[0].url} controls preload="metadata" aria-label={`${property.title} property video`} /> : <img src={property.images?.[0]?.url || property.media?.[0]?.url || property.image} alt={property.title} loading="lazy" />}
                  <button className="buy-property-heart" type="button" aria-label={user && savedIds.has(property.id) ? `Remove ${property.title} from saved properties` : `Save ${property.title}`} aria-pressed={Boolean(user && savedIds.has(property.id))} onClick={() => toggleSaved(property.id)}>{user && savedIds.has(property.id) ? '♥' : '♡'}</button>

                  {property.featured && (
                    <span className="buy-featured-label">Featured</span>
                  )}
                </div>

                <div className="buy-property-info">
                  <span className="buy-property-type">{property.propertyType || property.type}</span>

                  <h3>{property.title}</h3>

                  <p className="buy-property-location">
                    <span aria-hidden="true">⌖</span>
                    {property.location}
                  </p>

                  <div className="buy-property-features">
                    <span>{property.bedrooms} Bedrooms</span>
                    <span>{property.bathrooms} Bathrooms</span>
                    <span>{property.kitchens ?? 1} Kitchens</span>
                  </div>

                  <div className="buy-property-footer">
                    <strong>{formatPrice(property.price, property.currency || 'USD')}</strong>
                    <button
                        type="button"
                        onClick={() => setSelectedProperty(property)}
                        >
                        View Details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="buy-no-results">
            <h3>No properties found</h3>
            <p>Try changing your search or filters.</p>
            <button type="button" onClick={resetFilters}>
              Clear Filters
            </button>
          </div>
        )}
      </section>


      {selectedProperty && (
        <PropertyDetails
            property={selectedProperty}
            buying={checkoutId === selectedProperty.id}
            onClose={() => setSelectedProperty(null)}
            onBuy={(property) => {
              buyProperty(property);
            }}
        />
        )}

        <RealEstateFooter />
    </main>
  );
}
