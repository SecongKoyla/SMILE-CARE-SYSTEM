// pages/ProfilePage.jsx
import { useEffect, useRef, useState } from "react";
import { API_URL } from "../api/api";
import "../styles/profile.css";

export default function ProfilePage({ user, setUser, onBack, initialTab = "info" }) {

    const displayName = (user?.name ?? user?.fullName ?? "").trim() || "User";
    const isAdmin = String(user?.role ?? "PATIENT").toUpperCase() === "ADMIN";

    // ── Section tabs ──────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState(initialTab); // "info" | "password" | "photo"

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // ── Edit Profile state ────────────────────────────────────────
    const [profileForm, setProfileForm] = useState({
        fullName: displayName,
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMsg, setProfileMsg]   = useState(null); // { type: "success"|"error", text }

    // ── Password state ─────────────────────────────────────────────
    const [passForm, setPassForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg]         = useState(null);
    const [showPass, setShowPass]       = useState({ current: false, new: false, confirm: false });

    // ── Photo state ────────────────────────────────────────────────
    const [photoPreview, setPhotoPreview] = useState(user?.profilePhotoUrl ?? null);
    const [photoFile, setPhotoFile]       = useState(null);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [photoMsg, setPhotoMsg]         = useState(null);
    const fileInputRef = useRef(null);

    // ── Helpers ────────────────────────────────────────────────────
    const getLastInitial = (name) => {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        return parts[parts.length - 1].charAt(0).toUpperCase();
    };

    const syncUserState = (updater) => {
        setUser((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            localStorage.setItem("user", JSON.stringify(next));
            return next;
        });
    };

    // ── Edit Profile submit ────────────────────────────────────────
    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileMsg(null);

        if (!profileForm.fullName.trim()) {
            setProfileMsg({ type: "error", text: "Full name is required." });
            return;
        }

        const normalizedFullName = profileForm.fullName.trim().replace(/\s+/g, " ");
        const fullNamePattern = /^[\p{L}\s]+$/u;

        if (!fullNamePattern.test(normalizedFullName)) {
            setProfileMsg({ type: "error", text: "Full name can only contain letters and spaces." });
            return;
        }

        setProfileLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName: normalizedFullName,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to update profile.");
            }

            const updated = await res.json();
            syncUserState((prev) => ({ ...prev, ...updated }));
            setProfileMsg({ type: "success", text: "Profile updated successfully!" });
        } catch (err) {
            setProfileMsg({ type: "error", text: err.message });
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Password submit ────────────────────────────────────────────
    const handlePasswordSave = async (e) => {
        e.preventDefault();
        setPassMsg(null);

        if (!passForm.currentPassword) {
            setPassMsg({ type: "error", text: "Current password is required." });
            return;
        }
        if (passForm.newPassword.length < 8) {
            setPassMsg({ type: "error", text: "New password must be at least 8 characters." });
            return;
        }
        if (passForm.newPassword !== passForm.confirmPassword) {
            setPassMsg({ type: "error", text: "New passwords do not match." });
            return;
        }

        setPassLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/${user.id}/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword: passForm.currentPassword,
                    newPassword:     passForm.newPassword,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to update password.");
            }

            setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setPassMsg({ type: "success", text: "Password changed successfully!" });
        } catch (err) {
            setPassMsg({ type: "error", text: err.message });
        } finally {
            setPassLoading(false);
        }
    };

    // ── Photo select ───────────────────────────────────────────────
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setPhotoMsg({ type: "error", text: "Please select an image file." });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setPhotoMsg({ type: "error", text: "Image must be under 5 MB." });
            return;
        }

        setPhotoFile(file);
        setPhotoMsg(null);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    // ── Photo upload ───────────────────────────────────────────────
    const handlePhotoUpload = async () => {
        if (!photoFile) {
            setPhotoMsg({ type: "error", text: "Please choose a photo first." });
            return;
        }

        setPhotoLoading(true);
        setPhotoMsg(null);
        try {
            const formData = new FormData();
            formData.append("file", photoFile);

            const res = await fetch(`${API_URL}/users/${user.id}/profile-photo`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to upload photo.");
            }

            const data = await res.json();
            const photoUrl = data.profilePhotoUrl ?? data.photoUrl ?? data.url;
            syncUserState((prev) => ({ ...prev, profilePhotoUrl: photoUrl }));
            setPhotoMsg({ type: "success", text: "Profile photo updated!" });
            setPhotoFile(null);
        } catch (err) {
            setPhotoMsg({ type: "error", text: err.message });
        } finally {
            setPhotoLoading(false);
        }
    };

    // ── Remove photo ───────────────────────────────────────────────
    const handlePhotoRemove = async () => {
        if (!window.confirm("Remove your profile photo?")) return;
        setPhotoLoading(true);
        try {
            await fetch(`${API_URL}/users/${user.id}/profile-photo`, {
                method: "DELETE",
            });
            setPhotoPreview(null);
            setPhotoFile(null);
            syncUserState((prev) => ({ ...prev, profilePhotoUrl: null }));
            setPhotoMsg({ type: "success", text: "Photo removed." });
        } catch {
            setPhotoMsg({ type: "error", text: "Failed to remove photo." });
        } finally {
            setPhotoLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    return (
        <div className="profile-page">

            {/* Page Header */}
            <div className="profile-page-header">
                <button className="profile-back-btn" onClick={onBack}>
                    ‹ Back
                </button>
                <div>
                    <h1 className="profile-page-title">My Profile</h1>
                    <p className="profile-page-sub">Manage your account details and security</p>
                </div>
            </div>

            <div className="profile-layout">

                {/* ── Left card: Avatar + summary ── */}
                <aside className="profile-sidebar">
                    <div className="profile-card profile-identity-card">
                        <div className="profile-avatar-wrap">
                            <div className={`profile-avatar-lg ${isAdmin ? "nav-avatar-admin" : "nav-avatar-patient"}`}>
                                {photoPreview ? (
                                    <img src={photoPreview} alt={displayName} className="profile-avatar-img" />
                                ) : (
                                    getLastInitial(displayName)
                                )}
                            </div>
                            <button
                                className="profile-avatar-change-btn"
                                onClick={() => { setActiveTab("photo"); fileInputRef.current?.click(); }}
                                title="Change photo"
                            >
                                📷
                            </button>
                        </div>

                        <div className="profile-identity-info">
                            <div className="profile-identity-name">{displayName}</div>
                            <div className="profile-identity-email">{user?.email}</div>
                            <span className={`profile-role-badge ${isAdmin ? "profile-role-admin" : "profile-role-patient"}`}>
                {isAdmin ? "Administrator" : "Patient"}
              </span>
                        </div>

                        {/* Sidebar nav */}
                        <nav className="profile-sidebar-nav">
                            <button
                                className={`profile-sidebar-item ${activeTab === "info" ? "active" + (isAdmin ? "-admin" : "") : ""}`}
                                onClick={() => setActiveTab("info")}
                            >
                                <span>👤</span> Personal Info
                            </button>
                            <button
                                className={`profile-sidebar-item ${activeTab === "password" ? "active" + (isAdmin ? "-admin" : "") : ""}`}
                                onClick={() => setActiveTab("password")}
                            >
                                <span>🔒</span> Change Password
                            </button>
                            <button
                                className={`profile-sidebar-item ${activeTab === "photo" ? "active" + (isAdmin ? "-admin" : "") : ""}`}
                                onClick={() => setActiveTab("photo")}
                            >
                                <span>📷</span> Profile Photo
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* ── Right panel ── */}
                <main className="profile-main">

                    {/* ── PERSONAL INFO ── */}
                    {activeTab === "info" && (
                        <div className="profile-card profile-form-card">
                            <div className="profile-card-header">
                                <div className={`profile-card-icon ${isAdmin ? "icon-admin" : "icon-patient"}`}>👤</div>
                                <div>
                                    <h2 className="profile-card-title">Personal Information</h2>
                                    <p className="profile-card-sub">Update your name and email address</p>
                                </div>
                            </div>

                            {profileMsg && (
                                <div className={`profile-alert ${profileMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                                    {profileMsg.type === "success" ? "✅" : "⚠️"} {profileMsg.text}
                                </div>
                            )}

                            <form className="profile-form" onSubmit={handleProfileSave}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={profileForm.fullName}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                                        placeholder="Your full name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        className="form-input form-input-readonly"
                                        type="email"
                                        value={user?.email ?? ""}
                                        placeholder="your@email.com"
                                        readOnly
                                    />
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className={`btn-primary ${isAdmin ? "btn-admin" : ""}`}
                                        disabled={profileLoading}
                                    >
                                        {profileLoading ? "Saving…" : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ── CHANGE PASSWORD ── */}
                    {activeTab === "password" && (
                        <div className="profile-card profile-form-card">
                            <div className="profile-card-header">
                                <div className={`profile-card-icon ${isAdmin ? "icon-admin" : "icon-patient"}`}>🔒</div>
                                <div>
                                    <h2 className="profile-card-title">Change Password</h2>
                                    <p className="profile-card-sub">Keep your account secure with a strong password</p>
                                </div>
                            </div>

                            {passMsg && (
                                <div className={`profile-alert ${passMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                                    {passMsg.type === "success" ? "✅" : "⚠️"} {passMsg.text}
                                </div>
                            )}

                            <form className="profile-form" onSubmit={handlePasswordSave}>
                                {/* Current Password */}
                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
                                    <div className="form-input-wrap">
                                        <input
                                            className="form-input"
                                            type={showPass.current ? "text" : "password"}
                                            value={passForm.currentPassword}
                                            onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))}
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            className="form-eye-btn"
                                            onClick={() => setShowPass((p) => ({ ...p, current: !p.current }))}
                                        >
                                            {showPass.current ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <div className="form-input-wrap">
                                        <input
                                            className="form-input"
                                            type={showPass.new ? "text" : "password"}
                                            value={passForm.newPassword}
                                            onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                                            placeholder="At least 8 characters"
                                        />
                                        <button
                                            type="button"
                                            className="form-eye-btn"
                                            onClick={() => setShowPass((p) => ({ ...p, new: !p.new }))}
                                        >
                                            {showPass.new ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                    {/* Password strength */}
                                    {passForm.newPassword && (
                                        <div className="pass-strength">
                                            {[1,2,3,4].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`pass-bar ${
                                                        passForm.newPassword.length >= i * 3
                                                            ? passForm.newPassword.length < 6
                                                                ? "bar-weak"
                                                                : passForm.newPassword.length < 10
                                                                    ? "bar-medium"
                                                                    : "bar-strong"
                                                            : ""
                                                    }`}
                                                />
                                            ))}
                                            <span className="pass-strength-label">
                        {passForm.newPassword.length < 6
                            ? "Weak"
                            : passForm.newPassword.length < 10
                                ? "Medium"
                                : "Strong"}
                      </span>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <div className="form-input-wrap">
                                        <input
                                            className={`form-input ${
                                                passForm.confirmPassword && passForm.confirmPassword !== passForm.newPassword
                                                    ? "input-error"
                                                    : passForm.confirmPassword && passForm.confirmPassword === passForm.newPassword
                                                        ? "input-success"
                                                        : ""
                                            }`}
                                            type={showPass.confirm ? "text" : "password"}
                                            value={passForm.confirmPassword}
                                            onChange={(e) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                            placeholder="Repeat new password"
                                        />
                                        <button
                                            type="button"
                                            className="form-eye-btn"
                                            onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}
                                        >
                                            {showPass.confirm ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                    {passForm.confirmPassword && passForm.confirmPassword !== passForm.newPassword && (
                                        <span className="form-hint-error">Passwords do not match</span>
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className={`btn-primary ${isAdmin ? "btn-admin" : ""}`}
                                        disabled={passLoading}
                                    >
                                        {passLoading ? "Updating…" : "Update Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ── PROFILE PHOTO ── */}
                    {activeTab === "photo" && (
                        <div className="profile-card profile-form-card">
                            <div className="profile-card-header">
                                <div className={`profile-card-icon ${isAdmin ? "icon-admin" : "icon-patient"}`}>📷</div>
                                <div>
                                    <h2 className="profile-card-title">Profile Photo</h2>
                                    <p className="profile-card-sub">Upload a photo to personalize your profile</p>
                                </div>
                            </div>

                            {photoMsg && (
                                <div className={`profile-alert ${photoMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                                    {photoMsg.type === "success" ? "✅" : "⚠️"} {photoMsg.text}
                                </div>
                            )}

                            {/* Drop zone */}
                            <div
                                className="photo-dropzone"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("dragging"); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove("dragging")}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove("dragging");
                                    const file = e.dataTransfer.files[0];
                                    if (file) {
                                        const fakeEvent = { target: { files: [file] } };
                                        handleFileSelect(fakeEvent);
                                    }
                                }}
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="photo-preview" />
                                ) : (
                                    <div className="photo-dropzone-placeholder">
                                        <div className="photo-drop-icon">📷</div>
                                        <div className="photo-drop-label">Click or drag & drop to upload</div>
                                        <div className="photo-drop-hint">JPG, PNG, WEBP · Max 5 MB</div>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleFileSelect}
                            />

                            {photoFile && (
                                <div className="photo-file-info">
                                    <span className="photo-file-name">📎 {photoFile.name}</span>
                                    <span className="photo-file-size">
                    {(photoFile.size / 1024).toFixed(0)} KB
                  </span>
                                </div>
                            )}

                            <div className="form-actions photo-actions">
                                <button
                                    className={`btn-primary ${isAdmin ? "btn-admin" : ""}`}
                                    onClick={handlePhotoUpload}
                                    disabled={photoLoading || !photoFile}
                                >
                                    {photoLoading ? "Uploading…" : "Upload Photo"}
                                </button>

                                {photoPreview && !photoFile && (
                                    <button
                                        className="btn-danger"
                                        onClick={handlePhotoRemove}
                                        disabled={photoLoading}
                                    >
                                        Remove Photo
                                    </button>
                                )}

                                <button
                                    className="btn-secondary"
                                    onClick={() => { setPhotoPreview(user?.profilePhotoUrl ?? null); setPhotoFile(null); setPhotoMsg(null); }}
                                    disabled={photoLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}