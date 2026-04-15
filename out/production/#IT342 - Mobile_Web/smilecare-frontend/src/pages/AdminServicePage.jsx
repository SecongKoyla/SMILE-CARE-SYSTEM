// pages/AdminServicesPage.jsx
// Admin-only: add, edit, delete services
import { useState } from "react";
import Modal from "../components/Modal.jsx";
import { ICON_OPTIONS } from "../data/constants.js";
import { addService, updateService, deleteService } from "../api/api.js";

const EMPTY_FORM = { 
  icon: "🦷", 
  name: "", 
  desc: "", 
  price: "", 
  duration: "",
  durationUnit: "minutes" // "minutes" or "hours"
};

// Helper function to format price display
const formatPrice = (price) => {
  if (!price) return "₱0";
  return `₱${parseFloat(price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Helper function to format duration display
const formatDuration = (service) => {
  if (!service) return "N/A";
  
  // Directly use the fields we expect from the DTO
  const mins = service.duration_minutes || service.durationMinutes || 30;
  const unit = service.duration_unit || service.durationUnit || "minutes";
  
  if (unit === "hours") {
    return (mins / 60) + " hr";
  }
  
  return mins + " min";
};

export default function AdminServicesPage({ services, setServices }) {
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add mode
  const [form, setForm]             = useState(EMPTY_FORM);
  const [deleteId, setDeleteId]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // ── Open add modal ──
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
    setError(null);
  };

  // ── Open edit modal ──
  const openEdit = (service) => {
    // Extract directly from what backend sends
    const tempMins = service.duration_minutes || service.durationMinutes || 30;
    const tempUnit = service.duration_unit || service.durationUnit || "minutes";
    
    // Set form fields based on unit
    let formDuration = "";
    if (tempUnit === "hours") {
      formDuration = String(tempMins / 60);
    } else {
      formDuration = String(tempMins);
    }
    
    setEditTarget(service.id);
    setForm({ 
      icon: service.icon, 
      name: service.name, 
      desc: service.description || service.desc, 
      price: service.price || "", 
      duration: formDuration,
      durationUnit: tempUnit
    });
    setShowModal(true);
    setError(null);
  };

  // ── Save (add or update) ──
  const handleSave = async () => {
    // Validation
    if (!form.name.trim()) {
      setError("Service name is required");
      return;
    }

    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a valid number greater than 0");
      return;
    }

    const durationNum = form.duration ? parseInt(form.duration) : null;
    if (form.duration && (isNaN(durationNum) || durationNum <= 0)) {
      setError("Duration must be a valid number greater than 0");
      return;
    }

    setLoading(true);
    try {
      // Prepare data for backend
      let durationMin = null;
      if (form.duration && parseInt(form.duration) > 0) {
        const durationValue = parseInt(form.duration);
        // Convert to minutes if hours selected
        durationMin = form.durationUnit === "hours" ? durationValue * 60 : durationValue;
      }

      const dataToSend = {
        icon: form.icon,
        name: form.name.trim(),
        desc: form.desc.trim(),
        price: priceNum,
        duration_minutes: durationMin, // Send as duration_minutes
        durationUnit: form.durationUnit || "minutes"
      };

      if (editTarget === null) {
        // Add new service to backend
        console.log("➕ Adding new service...", dataToSend);
        const newService = await addService(dataToSend);
        console.log("✅ Service added:", newService);
        setServices(prev => [...prev, newService]);
      } else {
        // Update existing service in backend
        console.log("✏️ Updating service...", dataToSend);
        const updated = await updateService(editTarget, dataToSend);
        console.log("✅ Service updated:", updated);
        setServices(prev =>
          prev.map(s => s.id === editTarget ? { ...s, ...updated } : s)
        );
      }
      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error("❌ Error saving service:", err);
      setError(err.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      console.log("🗑️ Deleting service...");
      await deleteService(id);
      console.log("✅ Service deleted");
      setServices(prev => prev.filter(s => s.id !== id));
      setDeleteId(null);
      setError(null);
    } catch (err) {
      console.error("❌ Error deleting service:", err);
      setError(err.message || "Failed to delete service");
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <main className="sc-main page-enter">

      {/* Admin banner */}
      <div className="admin-banner">
        <div className="admin-banner-icon">🛠️</div>
        <div className="admin-banner-text">
          <h3>Manage Services</h3>
          <p>Add, edit, or remove the services patients can book. Changes reflect immediately on the patient portal.</p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ background: "#fee", borderLeft: "4px solid #f66", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
          <p style={{ color: "#c00", margin: "0", fontSize: "13px" }}>⚠️ {error}</p>
        </div>
      )}

      {/* Add button */}
      <button className="add-service-btn" onClick={openAdd} disabled={loading}>
        <span style={{ fontSize: 20 }}>＋</span>
        Add New Service
      </button>

      {/* Service list */}
      {services.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">✨</span>
            <p>No services yet. Click "Add New Service" to get started.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {services.map(s => (
            <div key={s.id} className="admin-service-card">
              <div className="admin-service-icon">{s.icon}</div>
              <div className="admin-service-body">
                <div className="admin-service-name">{s.name}</div>
                <div className="admin-service-desc">{s.description || s.desc || "No description."}</div>
                <div className="admin-service-meta">
                  <span className="admin-service-price">{formatPrice(s.price)}</span>
                  <span className="admin-service-dur">· {formatDuration(s)}</span>
                </div>
              </div>
              <div className="admin-service-actions">
                <button className="btn-icon btn-icon-edit" onClick={() => openEdit(s)} title="Edit">✏️</button>
                <button className="btn-icon btn-icon-del"  onClick={() => setDeleteId(s.id)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <Modal
          title={editTarget === null ? "Add New Service" : "Edit Service"}
          onClose={() => setShowModal(false)}
        >
          {/* Error in modal */}
          {error && (
            <div style={{ background: "#fee", borderLeft: "4px solid #f66", padding: "10px", borderRadius: "6px", marginBottom: "12px" }}>
              <p style={{ color: "#c00", margin: "0", fontSize: "12px" }}>{error}</p>
            </div>
          )}

          {/* Icon picker */}
          <div className="sc-form-group">
            <label className="sc-label">Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ICON_OPTIONS.map(ico => (
                <button
                  key={ico}
                  onClick={() => setForm(p => ({ ...p, icon: ico }))}
                  disabled={loading}
                  style={{
                    width: 40, height: 40,
                    borderRadius: 8,
                    border: form.icon === ico ? "2px solid var(--mint)" : "1.5px solid var(--gray-border)",
                    background: form.icon === ico ? "var(--mint-light)" : "var(--white)",
                    fontSize: 20,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Price */}
          <div className="sc-form-row">
            <div>
              <label className="sc-label">Service Name *</label>
              <input className="sc-input" placeholder="e.g. Teeth Cleaning" disabled={loading} {...field("name")} />
            </div>
            <div>
              <label className="sc-label">Price (₱) *</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#4ecba6" }}>₱</span>
                <input 
                  className="sc-input" 
                  type="number"
                  placeholder="800" 
                  disabled={loading}
                  min="0"
                  step="10"
                  value={form.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+(\.\d{0,2})?$/.test(val)) {
                      setForm(prev => ({ ...prev, price: val }));
                    }
                  }}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="sc-form-group">
            <label className="sc-label">Service Duration</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <input 
                  className="sc-input" 
                  type="number"
                  placeholder="e.g. 30" 
                  disabled={loading}
                  min="1"
                  value={form.duration}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) {
                      setForm(prev => ({ ...prev, duration: val }));
                    }
                  }}
                />
              </div>
              <select 
                className="sc-input"
                disabled={loading}
                value={form.durationUnit || "minutes"}
                onChange={(e) => setForm(prev => ({ ...prev, durationUnit: e.target.value }))}
                style={{ flex: 0.8 }}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="sc-form-group">
            <label className="sc-label">Description</label>
            <textarea
              className="sc-input"
              rows={3}
              placeholder="Brief description of the service..."
              disabled={loading}
              style={{ resize: "vertical", lineHeight: 1.6 }}
              {...field("desc")}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn-ghost" onClick={() => setShowModal(false)} disabled={loading} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!form.name.trim() || !form.price.trim() || loading}
              style={{ flex: 2, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (editTarget === null ? "Adding..." : "Saving...") : (editTarget === null ? "Add Service" : "Save Changes")}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteId !== null && (
        <Modal title="Delete Service" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: 14, color: "var(--gray)", marginBottom: 24, lineHeight: 1.6 }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: "var(--navy)" }}>
              {services.find(s => s.id === deleteId)?.name}
            </strong>?
            This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-ghost" onClick={() => setDeleteId(null)} disabled={loading} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteId)}
              disabled={loading}
              style={{
                flex: 2, padding: "13px 24px", border: "none",
                borderRadius: "var(--radius-sm)", background: loading ? "#ccc" : "var(--red-txt)",
                color: "white", fontFamily: "'Nunito', sans-serif",
                fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Deleting..." : "Delete Service"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}