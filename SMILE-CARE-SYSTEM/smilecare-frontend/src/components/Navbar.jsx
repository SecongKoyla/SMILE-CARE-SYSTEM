// components/Navbar.jsx
import { useState } from "react";
import { PATIENT_NAV, ADMIN_NAV } from "../data/constants.js";
import ProfileDropdown from "./ProfileDropdown.jsx";

export default function Navbar({ currentPage, setPage, user, onLogout, setUser }) {

  const [menuOpen, setMenuOpen] = useState(false);

  const role = String(user?.role ?? "PATIENT").toUpperCase();
  const displayName = (user?.name ?? user?.fullName ?? "").trim() || "User";

  const navItems = role === "ADMIN" ? ADMIN_NAV : PATIENT_NAV;
  const isAdmin = role === "ADMIN";

  // ✅ Get LAST NAME initial
  const getLastInitial = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    const lastName = parts[parts.length - 1];
    return lastName.charAt(0).toUpperCase();
  };

  const handleNav = (id) => {
    setPage(id);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  const handleNavigateProfile = () => {
    setPage("profile");
    setMenuOpen(false);
  };

  return (
      <>
        <nav className="nav">

          {/* Brand */}
          <div
              className="nav-brand"
              onClick={() => handleNav(isAdmin ? "admin-services" : "home")}
          >
            <div className="nav-brand-icon">🦷</div>
            <span className="nav-brand-name">
            Smile<span>Care</span>
          </span>
            {isAdmin && (
                <span className="badge badge-admin" style={{ marginLeft: 6, fontSize: 10 }}>
              Admin
            </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <ul className="nav-links">
            {navItems.map((item) => (
                <li key={item.id}>
                  <button
                      className={`nav-link ${
                          currentPage === item.id
                              ? isAdmin
                                  ? "active-admin"
                                  : "active"
                              : ""
                      }`}
                      onClick={() => handleNav(item.id)}
                  >
                    {item.label}
                  </button>
                </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="nav-right">

            {/* User Name */}
            <span className="nav-name">{displayName}</span>

            {/* ── Avatar with dropdown (replaces old static avatar) ── */}
            <ProfileDropdown
                user={user}
                setUser={setUser}
                isAdmin={isAdmin}
                onNavigateProfile={handleNavigateProfile}
            />

            {/* Desktop Logout */}
            <button className="nav-logout" onClick={handleLogout}>
              <span>↩</span> Logout
            </button>

            {/* Hamburger */}
            <button
                className={`hamburger${menuOpen ? " open" : ""}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
            <div className="mobile-menu">

              {/* User Section */}
              <div className="mobile-user">
                <div
                    className={`nav-avatar ${
                        isAdmin ? "nav-avatar-admin" : "nav-avatar-patient"
                    }`}
                >
                  {user?.profilePhotoUrl ? (
                      <img
                          src={user.profilePhotoUrl}
                          alt={displayName}
                          className="nav-avatar-img"
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                      />
                  ) : (
                      getLastInitial(displayName)
                  )}
                </div>

                <div className="mobile-user-info">
                  <div className="name">{displayName}</div>
                  <div className="role">{isAdmin ? "Administrator" : "Patient"}</div>
                </div>
              </div>

              <div className="mobile-divider" />

              {/* Profile link in mobile */}
              <button
                  className={`mobile-menu-link ${currentPage === "profile" ? (isAdmin ? "active-admin" : "active") : ""}`}
                  onClick={() => handleNav("profile")}
              >
                <span>👤</span>
                My Profile
              </button>

              <div className="mobile-divider" />

              {/* Mobile Links */}
              {navItems.map((item) => (
                  <button
                      key={item.id}
                      className={`mobile-menu-link ${
                          currentPage === item.id
                              ? isAdmin
                                  ? "active-admin"
                                  : "active"
                              : ""
                      }`}
                      onClick={() => handleNav(item.id)}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
              ))}

              <div className="mobile-divider" />

              {/* Mobile Logout */}
              <button className="mobile-logout" onClick={handleLogout}>
                <span>↩</span> Logout
              </button>
            </div>
        )}
      </>
  );
}