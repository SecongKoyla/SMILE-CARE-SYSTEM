// pages/AdminAvailabilityPage.jsx
import { useState, useEffect } from "react";
import { getClinicHours, updateClinicHours } from "../api/api.js";
import { getClinicExceptions, addClinicException, deleteClinicException } from "../api/exceptionsApi.js";

// Days of the week in calendar order (Sunday-Saturday)
// But backend stores: 0=Monday, 1=Tuesday, ..., 5=Saturday, 6=Sunday
// So we map: This array shows which backend day index corresponds to each calendar day
const DAY_MAPPING = [
  { label: "Sunday", backendIndex: 6 },
  { label: "Monday", backendIndex: 0 },
  { label: "Tuesday", backendIndex: 1 },
  { label: "Wednesday", backendIndex: 2 },
  { label: "Thursday", backendIndex: 3 },
  { label: "Friday", backendIndex: 4 },
  { label: "Saturday", backendIndex: 5 }
];

export default function AdminAvailabilityPage() {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Date Exceptions state
  const [exceptions, setExceptions] = useState([]);
  const [newExceptionDate, setNewExceptionDate] = useState("");
  const [newExceptionReason, setNewExceptionReason] = useState("");

  useEffect(() => {
    fetchClinicHours();
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    try {
      const data = await getClinicExceptions();
      setExceptions(data || []);
    } catch (err) {
      console.error("Error fetching exceptions:", err);
    }
  };

  const handleAddException = async (e) => {
    e.preventDefault();
    if (!newExceptionDate) return;
    try {
      await addClinicException(newExceptionDate, newExceptionReason || "Closed");
      setSuccessMsg(`Exception added for ${newExceptionDate}`);
      setNewExceptionDate("");
      setNewExceptionReason("");
      fetchExceptions();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError("Failed to add exception. Date might already exist.");
    }
  };

  const handleDeleteException = async (id) => {
    try {
      await deleteClinicException(id);
      setSuccessMsg("Exception removed");
      fetchExceptions();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError("Failed to delete exception");
    }
  };

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

  const handleSave = async (backendDayIndex, config) => {
    try {
      setError(null);
      await updateClinicHours(backendDayIndex, config);
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
        {DAY_MAPPING.map(({ label, backendIndex }) => {
          const dayConfig = hours.find(h => h.dayOfWeek === backendIndex);
          
          return (
            <AvailabilityCard
              key={backendIndex}
              backendIndex={backendIndex}
              dayName={label}
              config={dayConfig}
              isEditing={editingDay === backendIndex}
              onEdit={() => setEditingDay(backendIndex)}
              onCancel={() => setEditingDay(null)}
              onSave={(config) => handleSave(backendIndex, config)}
            />
          );
        })}
      </div>

      {/* Exceptions Section */}
      <div style={{ marginTop: "40px", padding: "24px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "var(--shadow)", border: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{ background: "var(--red-light)", padding: "10px", borderRadius: "12px", color: "var(--red)", fontSize: "20px" }}>🚫</div>
          <h4 style={{ margin: 0, color: "var(--navy)", fontSize: "20px" }}>Date-Specific Exceptions</h4>
        </div>
        <p style={{ fontSize: "14px", color: "var(--gray)", marginBottom: "24px", lineHeight: "1.5" }}>
          These specific dates override regular clinic hours and automatically mark the clinic as <strong>CLOSED</strong>. Patients will not be able to book appointments on these days.
        </p>
        
        <form onSubmit={handleAddException} style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "28px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ flex: "1", minWidth: "150px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--navy)", marginBottom: "6px" }}>Select Date</label>
            <input 
              type="date" 
              value={newExceptionDate} 
              onChange={e => setNewExceptionDate(e.target.value)} 
              required 
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" }}
            />
          </div>
          <div style={{ flex: "2", minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--navy)", marginBottom: "6px" }}>Reason for Closure (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g., National Holiday, Clinic Renovation" 
              value={newExceptionReason} 
              onChange={e => setNewExceptionReason(e.target.value)} 
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn-primary" style={{ padding: "10px 20px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>➕</span> Add Exception
            </button>
          </div>
        </form>

        {exceptions.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {exceptions.map(exc => (
              <div key={exc.id} style={{ 
                background: "#ffffff", 
                border: "1px solid #e2e8f0", 
                borderRadius: "12px", 
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "700", color: "var(--navy)", fontSize: "16px" }}>
                      {new Date(exc.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "700", background: "var(--red-light)", color: "var(--red)", padding: "2px 6px", borderRadius: "10px", textTransform: "uppercase" }}>CLOSED</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--gray)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>📝</span> {exc.reason || "No reason provided"}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteException(exc.id)}
                  style={{ 
                    background: "var(--red-light)", 
                    color: "var(--red)", 
                    width: "36px", 
                    height: "36px", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    border: "none", 
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  title="Remove Exception"
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "var(--red-light)"}
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <span style={{ fontSize: "32px", display: "block", marginBottom: "12px", color: "#94a3b8" }}>📅</span>
            <p style={{ fontSize: "15px", color: "var(--navy)", fontWeight: "600", margin: "0 0 4px 0" }}>No Exceptions Planned</p>
            <p style={{ fontSize: "13px", color: "var(--gray)", margin: 0 }}>The clinic will operate on standard weekly hours.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function AvailabilityCard({ backendIndex, dayName, config, isEditing, onEdit, onCancel, onSave }) {
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

  // Enhanced UI with better visual feedback
  const styles = {
    card: {
      padding: "16px",
      backgroundColor: isOpen ? "#ffffff" : "#f9f9f9",
      borderLeft: isOpen ? "4px solid var(--mint)" : "4px solid #ddd",
      borderRadius: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "all 0.2s",
    },
    dayLabel: {
      fontWeight: "700",
      fontSize: "16px",
      color: "var(--navy)",
      marginBottom: "8px",
    },
    hoursText: {
      fontSize: "13px",
      color: isOpen ? "var(--gray)" : "#999",
      lineHeight: "1.6",
    },
    editButton: {
      padding: "8px 16px",
      background: "var(--mint)",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "13px",
      whiteSpace: "nowrap",
    }
  };

  if (isEditing) {
    return (
      <div className="card" style={{ padding: "24px", backgroundColor: "rgba(78, 203, 166, 0.02)" }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: "1px solid #eee"
        }}>
          <h3 style={{ margin: 0, color: "var(--navy)", fontSize: "18px" }}>
            {dayName}
          </h3>
          <div style={{ fontSize: "12px", color: "var(--gray)", fontStyle: "italic" }}>
            Click Save to apply changes
          </div>
        </div>

        {/* Open/Closed Toggle */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            cursor: "pointer",
            padding: "12px",
            backgroundColor: "white",
            borderRadius: "6px",
            border: "1px solid #eee",
            transition: "all 0.2s"
          }}>
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => handleChange("isOperating", e.target.checked)}
              style={{ 
                width: "20px", 
                height: "20px", 
                cursor: "pointer",
                accentColor: "var(--mint)"
              }}
            />
            <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--navy)" }}>
              {isOpen ? "✓ Clinic is OPEN" : "✗ Clinic is CLOSED"}
            </span>
          </label>
        </div>

        {/* Time inputs (only show if open) */}
        {isOpen && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "700", 
              color: "var(--navy)", 
              textTransform: "uppercase",
              marginBottom: "12px",
              letterSpacing: "0.5px"
            }}>
              Working Hours
            </div>
            
            {/* Morning Session */}
            <div style={{ 
              marginBottom: "16px", 
              padding: "12px", 
              backgroundColor: "white",
              borderRadius: "6px",
              border: "1px solid #eee"
            }}>
              <div style={{ 
                fontSize: "11px", 
                fontWeight: "700", 
                color: "var(--gray)", 
                textTransform: "uppercase",
                marginBottom: "8px"
              }}>
                🌅 Morning Session
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--navy)" }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={form.morningStart}
                    onChange={(e) => handleChange("morningStart", e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "8px", 
                      borderRadius: "4px", 
                      border: "1px solid #ccc", 
                      marginTop: "4px",
                      fontSize: "13px",
                      fontFamily: "monospace"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--navy)" }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={form.morningEnd}
                    onChange={(e) => handleChange("morningEnd", e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "8px", 
                      borderRadius: "4px", 
                      border: "1px solid #ccc", 
                      marginTop: "4px",
                      fontSize: "13px",
                      fontFamily: "monospace"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Afternoon Session */}
            <div style={{ 
              padding: "12px", 
              backgroundColor: "white",
              borderRadius: "6px",
              border: "1px solid #eee"
            }}>
              <div style={{ 
                fontSize: "11px", 
                fontWeight: "700", 
                color: "var(--gray)", 
                textTransform: "uppercase",
                marginBottom: "8px"
              }}>
                🌥️ Afternoon Session
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--navy)" }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={form.afternoonStart}
                    onChange={(e) => handleChange("afternoonStart", e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "8px", 
                      borderRadius: "4px", 
                      border: "1px solid #ccc", 
                      marginTop: "4px",
                      fontSize: "13px",
                      fontFamily: "monospace"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--navy)" }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={form.afternoonEnd}
                    onChange={(e) => handleChange("afternoonEnd", e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "8px", 
                      borderRadius: "4px", 
                      border: "1px solid #ccc", 
                      marginTop: "4px",
                      fontSize: "13px",
                      fontFamily: "monospace"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "12px",
              background: "var(--mint)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.opacity = "0.9"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            ✓ Save Changes
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              background: "#f0f0f0",
              color: "var(--navy)",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.opacity = "0.8"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  // View mode (compact display)
  return (
    <div style={styles.card}>
      <div style={{ flex: 1 }}>
        <div style={styles.dayLabel}>
          {dayName}
        </div>
        <div style={styles.hoursText}>
          {config?.isOperating ? (
            <>
              {config.morningStart && config.morningEnd && (
                <div>🌅 {config.morningStart} – {config.morningEnd}</div>
              )}
              {config.afternoonStart && config.afternoonEnd && (
                <div>🌥️ {config.afternoonStart} – {config.afternoonEnd}</div>
              )}
              {(!config.morningStart || !config.afternoonStart) && (
                <div style={{ color: "#999", fontSize: "12px" }}>
                  (Partial hours configured)
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "#c00", fontWeight: "600" }}>🚫 Clinic Closed</div>
          )}
        </div>
      </div>
      <button
        onClick={onEdit}
        style={styles.editButton}
        onMouseEnter={(e) => {
          e.target.style.opacity = "0.9";
          e.target.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
        }}
      >
        ✏️ Edit
      </button>
    </div>
  );
}
