// components/ProfileDropdown.jsx
import { useState, useRef, useEffect } from "react";
import "../styles/profile.css";

export default function ProfileDropdown({ user, onNavigateProfile, isAdmin }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const getLastInitial = (name) => {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        return parts[parts.length - 1].charAt(0).toUpperCase();
    };

    const displayName = (user?.firstName && user?.lastName) 
        ? `${user.firstName} ${user.lastName}`
        : (user?.name ?? user?.fullName ?? "").trim() || "User";
    const email = user?.email ?? "";

    const handleNavigate = (tab) => {
        setOpen(false);
        onNavigateProfile?.(tab);
    };

    return (
        <div className="profile-dropdown-wrapper" ref={dropdownRef}>
            {/* Avatar trigger */}
            <button
                className={`nav-avatar nav-avatar-btn ${isAdmin ? "nav-avatar-admin" : "nav-avatar-patient"}`}
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Open profile menu"
                aria-expanded={open}
            >
                {user?.profilePhotoUrl ? (
                    <img
                        src={user.profilePhotoUrl}
                        alt={displayName}
                        className="nav-avatar-img"
                    />
                ) : (
                    getLastInitial(displayName)
                )}
                <span className={`avatar-dot ${isAdmin ? "avatar-dot-admin" : "avatar-dot-patient"}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className={`profile-dropdown ${isAdmin ? "profile-dropdown-admin" : ""}`}>
                    {/* Header */}
                    <div className="pd-header">
                        <div className={`pd-avatar-lg ${isAdmin ? "nav-avatar-admin" : "nav-avatar-patient"}`}>
                            {user?.profilePhotoUrl ? (
                                <img src={user.profilePhotoUrl} alt={displayName} className="nav-avatar-img" />
                            ) : (
                                getLastInitial(displayName)
                            )}
                        </div>
                        <div className="pd-user-info">
                            <div className="pd-name">{displayName}</div>
                            <div className="pd-email">{email}</div>
                            <span className={`pd-role-badge ${isAdmin ? "pd-role-admin" : "pd-role-patient"}`}>
                {isAdmin ? "Administrator" : "Patient"}
              </span>
                        </div>
                    </div>

                    <div className="pd-divider" />

                    {/* Actions */}
                    <button className="pd-item" onClick={() => handleNavigate("info")}>
                        <span className="pd-item-icon">👤</span>
                        <div className="pd-item-content">
                            <span className="pd-item-label">View Profile</span>
                            <span className="pd-item-sub">Manage your account</span>
                        </div>
                        <span className="pd-item-arrow">›</span>
                    </button>

                    <button className="pd-item" onClick={() => handleNavigate("password")}>
                        <span className="pd-item-icon">🔒</span>
                        <div className="pd-item-content">
                            <span className="pd-item-label">Change Password</span>
                            <span className="pd-item-sub">Keep your account secure</span>
                        </div>
                        <span className="pd-item-arrow">›</span>
                    </button>

                    <button className="pd-item" onClick={() => handleNavigate("photo")}>
                        <span className="pd-item-icon">📷</span>
                        <div className="pd-item-content">
                            <span className="pd-item-label">Upload Photo</span>
                            <span className="pd-item-sub">Set your profile picture</span>
                        </div>
                        <span className="pd-item-arrow">›</span>
                    </button>
                </div>
            )}
        </div>
    );
}