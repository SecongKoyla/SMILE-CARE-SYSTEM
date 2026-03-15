// pages/AdminServicesPage.jsx
// Admin-only: add, edit, delete services
import { useState } from "react";
import Modal from "../components/Modal.jsx";
import { ICON_OPTIONS } from "../data/constants.js";

const EMPTY_FORM = { icon: "🦷", name: "", desc: "", price: "", duration: "" };

export default function AdminServicesPage({ services, setServices }) {
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add mode
  const [form, setForm]             = useState(EMPTY_FORM);
  const [deleteId, setDeleteId]     = useState(null);

  // ── Open add modal ──
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  // ── Open edit modal ──
  const openEdit = (service) => {
    setEditTarget(service.id);
    setForm({ icon: service.icon, name: service.name, desc: service.desc, price: service.price, duration: service.duration });
    setShowModal(true);
  };

  // ── Save (add or update) ──
  const handleSave = () => {
    if (!form.name.trim() || !form.price.trim()) return;

    if (editTarget === null) {
      // Add new
      const newService = { ...form, id: Date.now() };
      setServices(prev => [...prev, newService]);
    } else {
      // Update existing
      setServices(prev =>
        prev.map(s => s.id === editTarget ? { ...s, ...form } : s)
      );
    }
    setShowModal(false);
  };

  // ── Delete ──
  const handleDelete = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setDeleteId(null);
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

      {/* Add button */}
      <button className="add-service-btn" onClick={openAdd}>
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
                <div className="admin-service-desc">{s.desc || "No description."}</div>
                <div className="admin-service-meta">
                  <span className="admin-service-price">{s.price}</span>
                  <span className="admin-service-dur">· {s.duration}</span>
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
          {/* Icon picker */}
          <div className="sc-form-group">
            <label className="sc-label">Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ICON_OPTIONS.map(ico => (
                <button
                  key={ico}
                  onClick={() => setForm(p => ({ ...p, icon: ico }))}
                  style={{
                    width: 40, height: 40,
                    borderRadius: 8,
                    border: form.icon === ico ? "2px solid var(--mint)" : "1.5px solid var(--gray-border)",
                    background: form.icon === ico ? "var(--mint-light)" : "var(--white)",
                    fontSize: 20,
                    cursor: "pointer",
                    transition: "all 0.15s",
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
              <input className="sc-input" placeholder="e.g. Teeth Cleaning" {...field("name")} />
            </div>
            <div>
              <label className="sc-label">Price *</label>
              <input className="sc-input" placeholder="e.g. ₱800" {...field("price")} />
            </div>
          </div>

          {/* Duration */}
          <div className="sc-form-group">
            <label className="sc-label">Duration</label>
            <input className="sc-input" placeholder="e.g. 45 min" {...field("duration")} />
          </div>

          {/* Description */}
          <div className="sc-form-group">
            <label className="sc-label">Description</label>
            <textarea
              className="sc-input"
              rows={3}
              placeholder="Brief description of the service..."
              style={{ resize: "vertical", lineHeight: 1.6 }}
              {...field("desc")}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!form.name.trim() || !form.price.trim()}
              style={{ flex: 2 }}
            >
              {editTarget === null ? "Add Service" : "Save Changes"}
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
            <button className="btn-ghost" onClick={() => setDeleteId(null)} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteId)}
              style={{
                flex: 2, padding: "13px 24px", border: "none",
                borderRadius: "var(--radius-sm)", background: "var(--red-txt)",
                color: "white", fontFamily: "'Nunito', sans-serif",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Delete Service
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}