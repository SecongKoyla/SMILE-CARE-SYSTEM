// pages/AdminApptsPage.jsx
// Admin-only: view all appointments across all patients
import { useState } from "react";
import AppointmentCard from "../components/AppointmentCard.jsx";

const FILTERS = ["all", "confirmed", "pending", "cancelled"];

export default function AdminApptsPage({ appointments }) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? appointments
    : appointments.filter(a => a.status === filter);

  const counts = {
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    pending:   appointments.filter(a => a.status === "pending").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
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
            <AppointmentCard key={a.id} appt={a} showStatus showPatient />
          ))}
        </div>
      </div>
    </main>
  );
}