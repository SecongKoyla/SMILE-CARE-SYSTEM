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

export default function AppointmentCard({ appt, showStatus = false, showPatient = false, onCancel }) {
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
        {appt.desc && (
          <div className="appt-desc" style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            {appt.desc}
          </div>
        )}
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

      {/* Actions (like cancel) */}
      {onCancel && appt.status === 'pending' && (
        <button 
          className="btn-outline" 
          title="Cancel Appointment"
          onClick={() => onCancel(appt)}
          style={{ 
            fontSize: '13px', 
            padding: '6px 14px', 
            minWidth: 'auto', 
            marginLeft: '12px', 
            color: '#dc2626', 
            backgroundColor: '#fef2f2',
            borderColor: '#fca5a5',
            fontWeight: '600',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.target.style.backgroundColor = '#fee2e2'; e.target.style.borderColor = '#f87171'; }}
          onMouseLeave={(e) => { e.target.style.backgroundColor = '#fef2f2'; e.target.style.borderColor = '#fca5a5'; }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}