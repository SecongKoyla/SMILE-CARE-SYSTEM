// pages/AdminAvailabilityPage.jsx
import { useState, useEffect } from "react";
import { getClinicHours, updateClinicHours } from "../api/api.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AdminAvailabilityPage() {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchClinicHours();
  }, []);

  const fetchClinicHours = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClinicHours();
      setHours(data || []);
    } catch (err) {
      console.error("Error fetching clinic hours:", err);
      setError("Failed to load clinic hours");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (dayOfWeek, config) => {
    try {
      setError(null);
      await updateClinicHours(dayOfWeek, config);
      setSuccessMsg("Clinic hours updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      setEditingDay(null);
      await fetchClinicHours();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="sc-main page-enter"><p>⏳ Loading clinic hours...</p></div>;
  }

  return (
    <main className="sc-main page-enter">
      <div className="admin-banner">
        <div className="admin-banner-icon">📅</div>
        <div className="admin-banner-text">
          <h3>Clinic Availability</h3>
          <p>Configure working hours and closed days. Changes are reflected immediately for patients.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee", borderLeft: "4px solid #f66", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
          <p style={{ color: "#c00", margin: "0", fontSize: "13px" }}>⚠️ {error}</p>
        </div>
      )}

      {successMsg && (
        <div style={{ background: "#efe", borderLeft: "4px solid #0a0", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
          <p style={{ color: "#0a0", margin: "0", fontSize: "13px" }}>✓ {successMsg}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {DAYS.map((dayName, dayOfWeek) => {
          const dayConfig = hours.find(h => h.dayOfWeek === dayOfWeek);
          const isOpen = dayConfig?.isOperating ?? true;
          
          return (
            <AvailabilityCard
              key={dayOfWeek}
              dayOfWeek={dayOfWeek}
              dayName={dayName}
              config={dayConfig}
              isEditing={editingDay === dayOfWeek}
              onEdit={() => setEditingDay(dayOfWeek)}
              onCancel={() => setEditingDay(null)}
              onSave={(config) => handleSave(dayOfWeek, config)}
            />
          );
        })}
      </div>
    </main>
  );
}

function AvailabilityCard({ dayOfWeek, dayName, config, isEditing, onEdit, onCancel, onSave }) {
  const [form, setForm] = useState({
    isOperating: config?.isOperating ?? true,
    morningStart: config?.morningStart ?? "09:00",
    morningEnd: config?.morningEnd ?? "12:00",
    afternoonStart: config?.afternoonStart ?? "14:00",
    afternoonEnd: config?.afternoonEnd ?? "17:00",
  });

  const isOpen = form.isOperating;

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({
      isOperating: form.isOperating,
      morningStart: form.isOperating ? form.morningStart : null,
      morningEnd: form.isOperating ? form.morningEnd : null,
      afternoonStart: form.isOperating ? form.afternoonStart : null,
      afternoonEnd: form.isOperating ? form.afternoonEnd : null,
    });
  };

  if (isEditing) {
    return (
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 12px 0" }}>{dayName}</h3>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => handleChange("isOperating", e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "14px", color: "var(--navy)" }}>
              {isOpen ? "✓ Clinic is OPEN" : "✗ Clinic is CLOSED"}
            </span>
          </label>
        </div>

        {isOpen && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--navy)", textTransform: "uppercase" }}>
                Morning Start
              </label>
              <input
                type="time"
                value={form.morningStart}
                onChange={(e) => handleChange("morningStart", e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "4px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--navy)", textTransform: "uppercase" }}>
                Morning End
              </label>
              <input
                type="time"
                value={form.morningEnd}
                onChange={(e) => handleChange("morningEnd", e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "4px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--navy)", textTransform: "uppercase" }}>
                Afternoon Start
              </label>
              <input
                type="time"
                value={form.afternoonStart}
                onChange={(e) => handleChange("afternoonStart", e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "4px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--navy)", textTransform: "uppercase" }}>
                Afternoon End
              </label>
              <input
                type="time"
                value={form.afternoonEnd}
                onChange={(e) => handleChange("afternoonEnd", e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "4px" }}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "10px",
              background: "var(--mint)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ✓ Save
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px",
              background: "#f0f0f0",
              color: "var(--navy)",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontWeight: "700", color: "var(--navy)", marginBottom: "6px" }}>{dayName}</div>
        <div style={{ fontSize: "13px", color: "var(--gray)" }}>
          {config?.isOperating ? (
            <>
              {config.morningStart && config.morningEnd && (
                <div>🌅 {config.morningStart} – {config.morningEnd}</div>
              )}
              {config.afternoonStart && config.afternoonEnd && (
                <div>🌥️ {config.afternoonStart} – {config.afternoonEnd}</div>
              )}
            </>
          ) : (
            <div style={{ color: "#666" }}>🚫 Closed</div>
          )}
        </div>
      </div>
      <button
        onClick={onEdit}
        style={{
          padding: "8px 16px",
          background: "var(--mint)",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontWeight: "600",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        ✏️ Edit
      </button>
    </div>
  );
}
