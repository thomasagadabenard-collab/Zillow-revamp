
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../css/Navbar.css";
import logo from "../../assets/zillowelite-logo-house.png";
import { useAuth } from "../../Context/Authcontext.jsx";

const navItems = [
  { label: "Buy", to: "/buy" },
  { label: "Agents", to: "/agents" },
  { label: "Mortgage", to: "/mortgage" },
];

export default function Navbar({ onSignIn }) {
  const { user, logout, authLoading } = useAuth();
  const showSignIn = !authLoading && !user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSignIn = () => {
    closeMenu();
    onSignIn?.();
  };

  const handleLogout = async () => {
    closeMenu();
    try {
      await logout();
    } catch (error) {
      console.error("Could not complete the sign-out request:", error);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">

        {/* LOGO */}
        <Link
          className="navbar__brand"
          to="/"
          aria-label="Zillow Elite home"
          onClick={closeMenu}
        >
          <img
            className="navbar__logo-image"
            src={logo}
            alt="Zillow Elite"
          />
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="navbar__nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              className="navbar__link"
              key={item.label}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="navbar__actions">
          {user && !authLoading && (
            <>
              <Link className="navbar__account-link" to="/dashboard/settings">
                Account
              </Link>
              <button className="navbar__logout" type="button" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          )}

          {showSignIn && (
            <button
              className="navbar__sign-in"
              type="button"
              onClick={handleSignIn}
            >
              Sign In
            </button>
          )}

          <Link
            className="navbar__listing-button"
            to="/list-property"
          >
            List Property
          </Link>
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          className={`navbar__mobile-toggle ${
            isMenuOpen ? "navbar__mobile-toggle--open" : ""
          }`}
          type="button"
          aria-label={
            isMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* MOBILE DROPDOWN */}
      <div
        id="mobile-navigation"
        className={`navbar__mobile-panel ${
          isMenuOpen ? "navbar__mobile-panel--open" : ""
        }`}
        aria-hidden={!isMenuOpen}
      >
        <nav
          className="navbar__mobile-nav"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={closeMenu}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* MOBILE BUTTONS */}
        <div className="navbar__mobile-actions">
          {user && !authLoading && (
            <>
              <Link
                className="navbar__account-link"
                to="/dashboard/settings"
                onClick={closeMenu}
                tabIndex={isMenuOpen ? 0 : -1}
              >
                Account
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                tabIndex={isMenuOpen ? 0 : -1}
              >
                Sign Out
              </button>
            </>
          )}

          {showSignIn && (
            <button
              type="button"
              onClick={handleSignIn}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              Sign In
            </button>
          )}

          <Link
            to="/list-property"
            onClick={closeMenu}
            tabIndex={isMenuOpen ? 0 : -1}
          >
            List Property
          </Link>
        </div>
      </div>
    </header>
  );
}
