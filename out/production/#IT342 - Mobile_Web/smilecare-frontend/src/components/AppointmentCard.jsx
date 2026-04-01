// components/AppointmentCard.jsx
// Reusable appointment row — used in HomePage, AppointmentsPage, AdminApptsPage

export default function AppointmentCard({ appt, showStatus = false, showPatient = false }) {
  return (
    <div className="appt">
      {/* Date block */}
      <div className="appt-date">
        <div className="appt-day">{appt.day}</div>
        <div className="appt-month">{appt.month}</div>
      </div>

      <div className="appt-divider" />

      {/* Info */}
      <div className="appt-info">
        <div className="appt-type">{appt.type}</div>
        <div className="appt-doctor">
          {appt.doctor}
          {showPatient && ` · ${appt.patient}`}
        </div>
      </div>

      {/* Time pill */}
      <div className="appt-time">{appt.time}</div>

      {/* Status badge */}
      {showStatus && (
        <span className={`badge badge-${appt.status}`}>
          {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
        </span>
      )}
    </div>
  );
}