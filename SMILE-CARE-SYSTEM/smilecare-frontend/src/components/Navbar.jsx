// components/Navbar.jsx
import { useState } from "react";
import { PATIENT_NAV, ADMIN_NAV } from "../data/constants.js";

export default function Navbar({ currentPage, setPage, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = user.role === "ADMIN" ? ADMIN_NAV : PATIENT_NAV;
  const isAdmin  = user.role === "ADMIN";
  
  // Extract initials from fullName
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleNav = (id) => {
    setPage(id);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  return (
    <>
      <nav className="nav">
        {/* Brand */}
        <div className="nav-brand" onClick={() => handleNav(isAdmin ? "admin-services" : "home")}>
          <div className="nav-brand-icon">🦷</div>
          <span className="nav-brand-name">Smile<span>Care</span></span>
          {isAdmin && (
            <span className="badge badge-admin" style={{ marginLeft: 6, fontSize: 10 }}>
              Admin
            </span>
          )}
        </div>

        {/* Desktop links */}
        <ul className="nav-links">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                className={`nav-link ${currentPage === item.id
                  ? isAdmin ? "active-admin" : "active"
                  : ""
                }`}
                onClick={() => handleNav(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className="nav-right">
          <span className="nav-name">{user.fullName}</span>
          <div className={`nav-avatar ${isAdmin ? "nav-avatar-admin" : "nav-avatar-patient"}`}>
            {getInitials(user.fullName)}
          </div>

          {/* Desktop logout */}
          <button className="nav-logout" onClick={handleLogout}>
            <span>↩</span> Logout
          </button>

          {/* Hamburger (mobile only) */}
          <button
            className={`hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-menu">
          {/* User info */}
          <div className="mobile-user">
            <div className={`nav-avatar ${isAdmin ? "nav-avatar-admin" : "nav-avatar-patient"}`}>
              {getInitials(user.fullName)}
            </div>
            <div className="mobile-user-info">
              <div className="name">{user.fullName}</div>
              <div className="role">{isAdmin ? "Administrator" : "Patient"}</div>
            </div>
          </div>

          <div className="mobile-divider" />

          {navItems.map(item => (
            <button
              key={item.id}
              className={`mobile-menu-link ${currentPage === item.id
                ? isAdmin ? "active-admin" : "active"
                : ""
              }`}
              onClick={() => handleNav(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="mobile-divider" />

          <button className="mobile-logout" onClick={handleLogout}>
            <span>↩</span> Logout
          </button>
        </div>
      )}
    </>
  );
}