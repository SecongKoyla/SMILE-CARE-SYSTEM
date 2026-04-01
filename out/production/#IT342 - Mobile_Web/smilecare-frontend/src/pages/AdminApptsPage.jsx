// pages/AdminApptsPage.jsx
// Admin-only: view all appointments across all patients
import { useState, useEffect } from "react";
import AppointmentCard from "../components/AppointmentCard.jsx";
import { getAllAppointments, updateAppointmentStatus } from "../api/api.js";

const FILTERS = ["all", "approved", "pending", "cancelled"];

export default function AdminApptsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus.toUpperCase());
      // Refresh appointments after update
      await fetchAppointments();
    } catch (err) {
      alert("Error updating status: " + err.message);
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

  // Map backend status to display status
  const statusMap = {
    "APPROVED": "confirmed",
    "PENDING": "pending",
    "CANCELLED": "cancelled",
    "ARRIVED": "confirmed",
    "COMPLETED": "confirmed"
  };

  const displayAppointments = appointments.map(appt => ({
    id: appt.id,
    day: new Date(appt.timeSlot.date).getDate().toString().padStart(2, '0'),
    month: new Date(appt.timeSlot.date).toLocaleString('default', { month: 'short' }),
    type: appt.service.name,
    doctor: "Dr. Rivera",
    time: appt.timeSlot.startTime,
    status: statusMap[appt.status] || appt.status.toLowerCase(),
    originalStatus: appt.status,
    patient: appt.patient.fullName,
    patientEmail: appt.patient.email
  }));

  const filtered = filter === "all"
    ? displayAppointments
    : displayAppointments.filter(a => a.status === filter);

  const counts = {
    confirmed: displayAppointments.filter(a => a.status === "confirmed").length,
    pending:   displayAppointments.filter(a => a.status === "pending").length,
    cancelled: displayAppointments.filter(a => a.status === "cancelled").length,
  };

  return (
    <main className="sc-main page-enter">
      <div className="page-header">
        <h1>All Appointments</h1>
        <p>Overview of all patient appointments across the clinic</p>
      </div>

      {/* Summary stats */}
      <div className="stats" style={{ marginBottom: 20 }}>
        {[
          { icon: "📅", label: "Total",     value: appointments.length },
          { icon: "✅", label: "Confirmed", value: counts.confirmed },
          { icon: "⏳", label: "Pending",   value: counts.pending },
        ].map(s => (
          <div key={s.label} className="stat">
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-row" style={{ marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`pill${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="appt-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>No {filter === "all" ? "" : filter} appointments found.</p>
            </div>
          ) : filtered.map(a => (
            <div key={a.id} className="appt-admin-item">
              <AppointmentCard appt={a} showStatus showPatient />
              <div className="appt-admin-details">
                <span className="patient-email">📧 {a.patientEmail}</span>
              </div>
              <div className="appt-admin-actions">
                <button
                  className={`status-action ${a.status === "confirmed" ? "active" : ""}`}
                  onClick={() => handleStatusChange(a.id, "APPROVED")}
                >
                  ✓ Confirm
                </button>
                <button
                  className={`status-action ${a.status === "pending" ? "active" : ""}`}
                  onClick={() => handleStatusChange(a.id, "PENDING")}
                >
                  ⏳ Pending
                </button>
                <button
                  className={`status-action ${a.status === "cancelled" ? "active" : ""}`}
                  onClick={() => handleStatusChange(a.id, "CANCELLED")}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}