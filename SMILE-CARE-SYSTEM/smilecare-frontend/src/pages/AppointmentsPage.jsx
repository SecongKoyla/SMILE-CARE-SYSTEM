// pages/AppointmentsPage.jsx
import { useState } from "react";
import AppointmentCard from "../components/AppointmentCard.jsx";

const FILTERS = ["all", "confirmed", "pending", "cancelled"];

export default function AppointmentsPage({ appointments, setPage }) {
  const [filter, setFilter] = useState("all");

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