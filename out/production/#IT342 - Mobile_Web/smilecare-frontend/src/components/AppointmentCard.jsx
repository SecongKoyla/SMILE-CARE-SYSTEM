// components/AppointmentCard.jsx
// Reusable appointment row — used in HomePage, AppointmentsPage, AdminApptsPage

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * Input: "14:30" → Output: "2:30 PM"
 * Input: "09:00" → Output: "9:00 AM"
 */
function formatTime(timeString) {
  if (!timeString) return timeString;
  
  // Handle both "14:30" and "14:30:00" formats
  const timeParts = timeString.split(':');
  let hours = parseInt(timeParts[0]);
  const minutes = timeParts[1];
  
  const isAM = hours < 12;
  if (hours === 0) hours = 12;        // 00:xx → 12:xx AM
  if (hours > 12) hours -= 12;        // 13:xx → 1:xx PM
  
  return `${hours}:${minutes} ${isAM ? 'AM' : 'PM'}`;
}

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
        {showPatient && (
          <div className="appt-patient">{appt.patient}</div>
        )}
      </div>

      {/* Time pill */}
      <div className="appt-time">{formatTime(appt.time)}</div>

      {/* Status badge */}
      {showStatus && (
        <span className={`badge badge-${appt.status}`}>
          {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
        </span>
      )}
    </div>
  );
}