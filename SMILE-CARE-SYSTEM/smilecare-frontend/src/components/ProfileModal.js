import { useState } from "react";

export default function ProfileModal({ user, onClose, onUpdate }) {
    const [fullName, setFullName] = useState(user.fullName || "");
    const [password, setPassword] = useState("");
    const [profilePic, setProfilePic] = useState(user.profilePic || "");
    const [preview, setPreview] = useState(user.profilePic || "");
    const [error, setError] = useState("");

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
        setProfilePic(file); // we can send the file later to backend
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!fullName.trim()) {
            setError("Full name cannot be empty.");
            return;
        }

        // Prepare updated user object
        const updatedUser = {
            ...user,
            fullName: fullName.trim(),
            password: password || user.password, // keep old password if empty
            profilePic: preview, // we use base64 for demo purposes
        };

        onUpdate(updatedUser);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>Edit Profile</h3>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                        <div
                            style={{
                                width: 80, height: 80, borderRadius: "50%", overflow: "hidden",
                                border: "2px solid var(--mint)", display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                        >
                            <img src={preview || "/default-avatar.png"} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    </div>

                    <label>
                        Full Name:
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </label>

                    <label>
                        New Password:
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current password" />
                    </label>

                    <label>
                        Profile Picture:
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                    </label>

                    {error && <p style={{ color: "red" }}>{error}</p>}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
