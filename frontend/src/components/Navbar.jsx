import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./auth/auth.js";
import "./Navbar.css";

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Food Recalls", path: "/recalls" },
  { label: "Restaurants", path: "/restaurants" },
  { label: "About Us" },
];

function Navbar() {
  const { user, loading, working, error, openAuth, signOut, refreshSession } =
    useAuth();
  const [logoutError, setLogoutError] = useState("");

  async function handleSignOut() {
    setLogoutError("");
    try {
      await signOut();
    } catch {
      setLogoutError("Could not sign out. Please try again.");
    }
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/safebite_logo.png" alt="SafeBite home" />
      </Link>

      <nav aria-label="Main">
        <ul className="navbar-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              {item.path ? (
                <NavLink to={item.path} end={item.path === "/"}>
                  {item.label}
                </NavLink>
              ) : (
                <span
                  className="navbar-link-unavailable"
                  role="link"
                  aria-disabled="true"
                  title={`${item.label} is not available yet.`}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="navbar-account" aria-label="Your account">
        {loading ? (
          <span role="status">Checking sign-in…</span>
        ) : user ? (
          <>
            <span className="navbar-account__name">Hi, {user.displayName}</span>
            <button type="button" onClick={handleSignOut} disabled={working}>
              Sign out
            </button>
          </>
        ) : error ? (
          <>
            <span role="status">Sign-in unavailable</span>
            <button
              type="button"
              onClick={() => refreshSession(undefined, true)}
            >
              Retry
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openAuth("login")}
              disabled={working}
            >
              Sign in
            </button>
          </>
        )}
        {logoutError && (
          <span className="navbar-account__error" role="alert">
            {logoutError}
          </span>
        )}
      </div>
    </header>
  );
}

Navbar.propTypes = {};

export default Navbar;
