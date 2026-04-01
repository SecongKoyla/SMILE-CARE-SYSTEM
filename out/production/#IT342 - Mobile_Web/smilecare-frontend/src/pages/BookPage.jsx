// pages/BookPage.jsx
import { useState } from "react";
import { TIME_SLOTS } from "../data/constants.js";

export default function BookPage({ services, setPage, onBook }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [confirmed, setConfirmed]       = useState(false);

  const handleConfirm = () => {
    if (selectedIdx === null || !selectedTime) return;
    onBook({
      type: services[selectedIdx].name,
      time: selectedTime,
    });
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <main className="sc-main page-enter">
        <div className="card">
          <div className="confirm-success">
            <div className="success-icon">🎉</div>
            <h2>Appointment Booked!</h2>
            <p>
              Your <strong>{services[selectedIdx]?.name}</strong> is scheduled at{" "}
              <strong>{selectedTime}</strong>.<br />
              We'll send you a reminder before your visit.
            </p>
            <button className="btn-primary" onClick={() => setPage("appointments")}>
              View My Appointments
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sc-main page-enter">
      <div className="page-header">
        <h1>Book an Appointment</h1>
        <p>Choose a service and time that works for you</p>
      </div>

      {/* Step 1: Service */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title">
          <span>Step 1 — Choose a Service</span>
          {services.length === 0 && (
            <span style={{ color: "var(--gray)", fontSize: 11, fontWeight: 400 }}>
              No services available yet
            </span>
          )}
        </div>
        {services.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✨</span>
            <p>No services have been added yet.<br />Please check back soon.</p>
          </div>
        ) : (
          <div className="book-service-grid">
            {services.map((s, i) => (
              <div
                key={s.id}
                className={`book-service-card${selectedIdx === i ? " selected" : ""}`}
                onClick={() => { setSelectedIdx(i); setSelectedTime(null); }}
              >
                <div className="book-service-icon">{s.icon}</div>
                <div>
                  <div className="book-service-name">{s.name}</div>
                  <div className="book-service-dur">{s.duration} · {s.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Time (only after service picked) */}
      {selectedIdx !== null && (
        <div className="card fade-in" style={{ marginBottom: 14 }}>
          <div className="card-title">
            <span>Step 2 — Choose a Time Slot</span>
          </div>
          <div className="time-slots">
            {TIME_SLOTS.map(t => (
              <div
                key={t}
                className={`time-slot${selectedTime === t ? " selected" : ""}`}
                onClick={() => setSelectedTime(t)}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm */}
      <button
        className="btn-primary"
        style={{ width: "100%", padding: 15, fontSize: 15, opacity: (selectedIdx !== null && selectedTime) ? 1 : 0.45 }}
        disabled={selectedIdx === null || !selectedTime}
        onClick={handleConfirm}
      >
        Confirm Appointment
      </button>
    </main>
  );
}