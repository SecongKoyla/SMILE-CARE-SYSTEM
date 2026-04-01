// pages/AppointmentsPage.jsx
import { useState, useEffect } from "react";
import AppointmentCard from "../components/AppointmentCard.jsx";
import { getUserAppointments } from "../api/api.js";

const FILTERS = ["all", "confirmed", "pending", "cancelled"];

export default function AppointmentsPage({ user, setPage }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

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
        doctor: "Dr. Rivera",
        time: appt.timeSlot.startTime,
        status: statusMap[appt.status] || appt.status.toLowerCase(),
        patient: user.name
      }));
      
      setAppointments(transformed);
    } catch (err) {
      console.error("Error fetching user appointments:", err);
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
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
            <AppointmentCard key={a.id} appt={a} showStatus />
          ))}
        </div>
      </div>
    </main>
  );
}