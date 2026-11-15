import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Food Recalls", path: "/recalls" },
  { label: "Restaurants", path: "/restaurants" },
  { label: "About Us" },
];

function Navbar() {
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
    </header>
  );
}

Navbar.propTypes = {};

export default Navbar;
