
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Authcontext.jsx';
import { api, fetchAllProperties } from '../api.js';
import '../css/Dashboard.css';
import logo from '../assets/zillowelite-logo-house.png';

// Reusable SVG icons.
// This component must remain independent of authentication hooks.
function DashboardIcon({ name }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),

    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9" />
        <path d="M9 21v-7h6v7" />
      </>
    ),

    bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,

    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 9h18" />
        <path d="M16 14h2" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z" />
      </>
    ),

    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),

    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    menu: <path d="M4 6h16M4 12h16M4 18h16" />,

    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,

    bed: (
      <>
        <path d="M3 18V6m18 12V6" />
        <path d="M3 14h18v4H3zM7 14V9h5a3 3 0 0 1 3 3v2" />
      </>
    ),

    bath: (
      <>
        <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
        <path d="M6 12V6a2 2 0 0 1 4 0" />
        <path d="M8 19v2m8-2v2" />
      </>
    ),

    area: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h6V3m6 18v-6h6" />
      </>
    ),
  };

  return (
    <svg
      className="dashboard-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function formatPrice(price, currency = 'USD') {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(price)); }
  catch { return `${currency} ${Number(price).toLocaleString()}`; }
}

export default function Dashboard({ onSignIn }) {
  // Authentication
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || 'Guest';
  const isLoggedIn = Boolean(user);
  const firstLetter = displayName.charAt(0).toUpperCase();

  // Dashboard state
  const [activeNav, setActiveNav] = useState('Overview');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All Locations');
  const [propertyType, setPropertyType] = useState('All Types');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [transactions, setTransactions] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const locations = [...new Set(properties.map((property) => property.location).filter(Boolean))];
  const propertyTypes = [...new Set(properties.map((property) => property.propertyType).filter(Boolean))];

  useEffect(() => {
    let active = true;
    fetchAllProperties()
      .then((items) => { if (active) setProperties(items); })
      .catch((error) => { if (active) console.error('Could not load properties:', error); })
      .finally(() => { if (active) setLoadingProperties(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([api('/api/properties/saved'), api('/api/orders')])
      .then(([saved, orders]) => {
        if (!active) return;
        setSavedIds(new Set((saved.items || []).map((item) => item.id)));
        setTransactions(orders.items || []);
      })
      .catch(() => { if (active) { setSavedIds(new Set()); setTransactions([]); } });
    return () => { active = false; };
  }, [user]);

  async function toggleSaved(propertyId) {
    if (!user) { onSignIn?.(); return; }
    try {
      if (savedIds.has(propertyId)) {
        await api(`/api/properties/saved/${propertyId}`, { method: 'DELETE' });
        setSavedIds((current) => { const next = new Set(current); next.delete(propertyId); return next; });
      } else {
        await api(`/api/properties/saved/${propertyId}`, { method: 'PUT' });
        setSavedIds((current) => new Set(current).add(propertyId));
      }
    } catch (error) { window.alert(error.message); }
  }

  async function startCryptoCheckout(propertyId) {
    if (!user) { onSignIn?.(); return; }
    try {
      const result = await api('/api/payments/checkout', { method: 'POST', body: JSON.stringify({ propertyId }) });
      window.location.assign(result.order.invoiceUrl);
    } catch (error) { window.alert(error.message); }
  }

  // Filter properties based on the user's search and selections.
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.location.toLowerCase().includes(search.toLowerCase());

    const matchesLocation =
      location === 'All Locations' ||
      property.location.includes(location);

    const matchesType =
      propertyType === 'All Types' ||
      property.propertyType === propertyType;

    return matchesSearch && matchesLocation && matchesType;
  });

  // Sidebar navigation configuration.
  const navGroups = [
    {
      heading: 'MAIN MENU',
      items: [
        {
          label: 'Overview',
          icon: 'dashboard',
          path: '/dashboard',
        },
        {
          label: 'Browse Properties',
          icon: 'home',
          path: '/dashboard/properties',
        },
        {
          label: 'Saved Properties',
          icon: 'bookmark',
          path: '/dashboard/saved',
          requiresLogin: true,
        },
      ],
    },
    {
      heading: 'MY ACCOUNT',
      items: [
        {
          label: 'Transactions',
          icon: 'wallet',
          path: '/dashboard/transactions',
        },
        {
          label: 'Settings',
          icon: 'settings',
          path: '/dashboard/settings',
        },
      ],
    },
  ];

  // Scroll to the property listings.
  function exploreProperties() {
    setActiveNav('Browse Properties');

    document.getElementById('properties')?.scrollIntoView({
      behavior: 'smooth',
    });

    setMobileMenuOpen(false);
  }

  // Reset all property filters.
  function resetFilters() {
    setSearch('');
    setLocation('All Locations');
    setPropertyType('All Types');
  }

  // Log out the current user.
  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside
        className={`dashboard-sidebar ${
          mobileMenuOpen ? 'sidebar-open' : ''
        }`}
      >
        {/* Logo */}
        <div className="dashboard-logo">
          <img
            src={logo}
            alt="Zillow Elite Logo"
            className="dashboard-logo-image"
          />

          <button
            className="sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* User profile */}
        <div className="sidebar-profile">
          <div className="profile-avatar">{firstLetter}</div>

          <div>
            <h3>{isLoggedIn ? `Welcome, ${displayName}` : 'Welcome, Guest'}</h3>
            <p>{isLoggedIn ? 'Property Seeker' : 'Guest Visitor'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.heading}>
              <p className="nav-heading">{group.heading}</p>

              {group.items.map((item) => {
                const isLocked = item.requiresLogin && !isLoggedIn;

                return (
                  <NavLink
                    key={item.label}
                    to={isLocked ? '/dashboard' : item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${
                        isActive && !isLocked ? 'active' : ''
                      } ${isLocked ? 'locked-link' : ''}`
                    }
                    onClick={(event) => {
                      if (isLocked) {
                        event.preventDefault();
                        onSignIn?.();
                        return;
                      }

                      setActiveNav(item.label);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <DashboardIcon name={item.icon} />

                    <span>{item.label}</span>

                    {item.label === 'Saved Properties' &&
                      (isLocked ? (
                        <span className="lock-icon" aria-label="Sign in required">
                          🔒
                        </span>
                      ) : (
                        <span className="nav-count">{savedIds.size}</span>
                      ))}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar bottom section */}
        <div className="sidebar-bottom">

          <div className="help-card">
            <div className="help-icon">?</div>

            <h4>Selling a property?</h4>

            <p>
              Send the team your property details and media for review.
            </p>

              <button onClick={() => navigate('/list-property')}>
              List a property
            </button>
          </div>

          {/* Only show logout when a user is signed in */}
          {isLoggedIn && (
            <button
              className="logout-button"
              onClick={handleLogout}
            >
              <span>↪</span> Log Out
            </button>
          )}

        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        {/* TOP NAVIGATION BAR */}
        <header className="dashboard-topbar">

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <DashboardIcon name="menu" />
          </button>

          <div className="breadcrumb">
            <span>Pages</span>
            <span>/</span>
            <strong>{activeNav}</strong>
          </div>

          <div className="topbar-actions">

            <button
              className="topbar-icon"
              aria-label="Search"
              onClick={exploreProperties}
            >
              <DashboardIcon name="search" />
            </button>

            <button
              className="topbar-icon notification-button"
              aria-label="Notifications"
            >
              <DashboardIcon name="bell" />
              <span className="notification-dot" />
            </button>

            {/* User information */}
            <div className="topbar-user">
              <div className="topbar-avatar">{firstLetter}</div>

              <div className="topbar-user-info">
                <strong>{displayName}</strong>
                <span>
                  {isLoggedIn ? 'My Account' : 'Guest Account'}
                </span>
              </div>
            </div>

            {!isLoggedIn && <button className="dashboard-sign-in" type="button" onClick={onSignIn}>Sign in</button>}

          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="dashboard-content">

          {/* WELCOME BANNER */}
          <section className="welcome-banner">

            <div className="welcome-text">

              <span className="welcome-label">
                YOUR PROPERTY JOURNEY STARTS HERE
              </span>

              <h1>
                {isLoggedIn
                  ? `Welcome back, ${displayName}!`
                  : 'Welcome to Zillow Elite!'}
              </h1>

              <p>
                Discover properties that match your lifestyle and investment
                goals. Your next opportunity is just a search away.
              </p>

              <button
                className="welcome-button"
                onClick={exploreProperties}
              >
                Explore Properties
                <DashboardIcon name="arrow" />
              </button>

            </div>

            <div className="welcome-decoration">
              <div className="decoration-circle circle-one" />
              <div className="decoration-circle circle-two" />
              <div className="decoration-house">⌂</div>
            </div>

          </section>

          {/* QUICK STATISTICS */}
          <section className="dashboard-stats">

            <div className="stat-card">
              <div className="stat-icon stat-blue">
                <DashboardIcon name="home" />
              </div>

              <div>
                <p>Available Properties</p>
                <h2>{loadingProperties ? '…' : properties.length}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-purple">
                <DashboardIcon name="bookmark" />
              </div>

              <div>
                <p>Saved Properties</p>
                <h2>{user ? savedIds.size : 0}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-green">
                <DashboardIcon name="wallet" />
              </div>

              <div>
                <p>My Transactions</p>
                <h2>{user ? transactions.length : 0}</h2>
              </div>
            </div>

          </section>

          {/* SEARCH AND FILTERS */}
          <section className="search-section">

            <div className="section-heading">
              <div>
                <h2>Find Your Perfect Property</h2>
                <p>
                  Search through our collection of available properties.
                </p>
              </div>
            </div>

            <div className="property-search">

              <div className="search-input-wrapper">
                <DashboardIcon name="search" />

                <input
                  type="text"
                  placeholder="Search by property name or location..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                aria-label="Filter by location"
              >
                <option>All Locations</option>
                {locations.map((item) => <option key={item}>{item}</option>)}
              </select>

              <select
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
                aria-label="Filter by property type"
              >
                <option>All Types</option>
                {propertyTypes.map((item) => <option key={item}>{item}</option>)}
              </select>

              <button
                className="filter-button"
                onClick={resetFilters}
              >
                Reset
              </button>

            </div>
          </section>

          {/* PROPERTY LISTINGS */}
          <section className="properties-section" id="properties">

            <div className="section-heading properties-heading">

              <div>
                <h2>Available Properties</h2>
                <p>
                  Explore some of our handpicked properties.
                </p>
              </div>

              <span className="results-count">
                {filteredProperties.length} properties found
              </span>

            </div>

            {loadingProperties ? <div className="empty-properties"><p>Loading listings…</p></div> : filteredProperties.length > 0 ? (

              <div className="property-grid">

                {filteredProperties.map((property) => (

                  <article className="property-card" key={property.id}>

                    {/* Property image */}
                    <div className="property-image-wrapper">

                      {property.media?.[0]?.mediaType === 'VIDEO' ? <video src={property.media[0].url} controls preload="metadata" aria-label={`${property.title} property video`} /> : <img src={property.images?.[0]?.url || property.media?.[0]?.url || ''} alt={property.title} loading="lazy" />}

                      <span className="property-status">
                        Available
                      </span>

                      <button
                        className="property-save"
                        aria-label={`${user && savedIds.has(property.id) ? 'Remove saved' : 'Save'} ${property.title}`}
                        onClick={() => toggleSaved(property.id)}
                      >
                        {user && savedIds.has(property.id) ? '♥' : '♡'}
                      </button>

                    </div>

                    {/* Property information */}
                    <div className="property-details">

                      <span className="property-location">
                        <span>⌖</span> {property.location}
                      </span>

                      <h3>{property.title}</h3>

                      {/* Property features */}
                      <div className="property-features">

                        <span>
                          <DashboardIcon name="bed" />
                          {property.bedrooms} Beds
                        </span>

                        <span>
                          <DashboardIcon name="bath" />
                          {property.bathrooms} Baths
                        </span>

                        <span>
                          <DashboardIcon name="area" />
                          {property.kitchens ?? 1} Kitchens
                        </span>

                        <span>
                          <DashboardIcon name="area" />
                          {property.area || 'Area not specified'}
                        </span>

                      </div>

                      {/* Property price and view button */}
                      <div className="property-card-footer">

                        <div>
                          <small>Property Price</small>
                          <strong>{formatPrice(property.price, property.currency)}</strong>
                        </div>

                        <button
                          onClick={() =>
                            startCryptoCheckout(property.id)
                          }
                          aria-label={`Buy ${property.title} with Bitcoin`}
                        >
                          Buy with BTC
                          <DashboardIcon name="arrow" />
                        </button>

                      </div>

                    </div>

                  </article>

                ))}

              </div>

            ) : (

              <div className="empty-properties">
                <h3>No properties found</h3>
                <p>Try changing your search or filters.</p>
              </div>

            )}

          </section>

          {/* FOOTER */}
          <footer className="dashboard-footer">
            <p>© 2026 Zillow Elite. All rights reserved.</p>
            <span>Find a place to call home.</span>
          </footer>

        </div>
      </main>
    </div>
  );
}
