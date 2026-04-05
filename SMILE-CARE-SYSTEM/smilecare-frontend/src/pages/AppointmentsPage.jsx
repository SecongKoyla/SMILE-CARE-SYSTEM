// pages/AppointmentsPage.jsx
import { useState, useEffect } from "react";
import AppointmentCard from "../components/AppointmentCard.jsx";
import Modal from "../components/Modal.jsx";
import { getUserAppointments, updateAppointmentStatus } from "../api/api.js";

const FILTERS = ["all", "confirmed", "pending", "cancelled"];

export default function AppointmentsPage({ user, setPage }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  
  // Custom cancel modal state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserAppointments(user.id);
      
      // Map backend status to display status
      const statusMap = {
        "APPROVED": "confirmed",
        "PENDING": "pending",
        "CANCELLED": "cancelled",
        "ARRIVED": "confirmed",
        "COMPLETED": "confirmed"
      };

      const transformed = data.map(appt => ({
        id: appt.id,
        day: new Date(appt.timeSlot.date).getDate().toString().padStart(2, '0'),
        month: new Date(appt.timeSlot.date).toLocaleString('default', { month: 'short' }),
        type: appt.service.name,
        desc: appt.service.description || appt.service.desc || "No description available.",
        time: appt.timeSlot.startTime,
        status: statusMap[appt.status] || appt.status.toLowerCase(),
        patient: user.name
      }));
      
      // Sort by date (descending or ascending? typically most recent or upcoming first)
      transformed.sort((a, b) => new Date(`${b.month} ${b.day}, ${new Date().getFullYear()} ${b.time}`) - new Date(`${a.month} ${a.day}, ${new Date().getFullYear()} ${a.time}`));
      setAppointments(transformed);
    } catch (err) {
      console.error("Error fetching user appointments:", err);
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = (appt) => {
    // Open modal instead of window.confirm
    setCancelTarget(appt);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    
    try {
      setCancelLoading(true);
      await updateAppointmentStatus(cancelTarget.id, "CANCELLED");
      setAppointments(prev => prev.map(a => a.id === cancelTarget.id ? { ...a, status: "cancelled" } : a));
      setCancelTarget(null);
    } catch (err) {
      alert("Failed to cancel the appointment: " + err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return <div className="sc-main page-enter"><p>⏳ Loading appointments...</p></div>;
  }

  if (error) {
    return (
      <div className="sc-main page-enter">
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h2>Unable to Load Appointments</h2>
          <p style={{ color: "var(--gray)", marginBottom: "16px" }}>
            {error}
          </p>
          <p style={{ color: "var(--gray)", fontSize: "13px", marginBottom: "20px" }}>
            Make sure the backend server is running on http://localhost:8085
          </p>
          <button 
            className="btn-primary"
            onClick={fetchAppointments}
            style={{ minWidth: "120px" }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const filtered = filter === "all"
    ? appointments
    : appointments.filter(a => a.status === filter);

  return (
    <main className="sc-main page-enter">
      <div className="page-header">
        <h1>My Appointments</h1>
        <p>Track and manage all your dental visits</p>
      </div>

      {/* Filter row */}
      <div className="filter-row">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`pill${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="filter-row-right">
          <button className="btn-primary" onClick={() => setPage("book")}>
            + New Appointment
          </button>
        </div>
      </div>

      <div className="card">
        <div className="appt-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>No {filter === "all" ? "" : filter} appointments found.</p>
              <button className="btn-primary" onClick={() => setPage("book")}>
                Book an Appointment
              </button>
            </div>
          ) : filtered.map(a => (
            <AppointmentCard key={a.id} appt={a} showStatus onCancel={handleCancelAppointment} />
          ))}
        </div>
      </div>

      {/* ── Cancel Confirmation Modal ── */}
      {cancelTarget && (
        <Modal
          title="Cancel Appointment"
          onClose={() => !cancelLoading && setCancelTarget(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '15px' }}>
              Are you sure you want to cancel your upcoming appointment?
            </p>
            
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {cancelTarget.type}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Date: {cancelTarget.month} {cancelTarget.day} at {cancelTarget.time}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '8px' }}>
              <button 
                className="btn-outline" 
                onClick={() => setCancelTarget(null)}
                disabled={cancelLoading}
              >
                No, Keep It
              </button>
              <button 
                className="btn-primary" 
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={confirmCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Appointment'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}