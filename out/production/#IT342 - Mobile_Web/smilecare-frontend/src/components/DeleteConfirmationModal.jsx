import React from "react";
import "../styles/deleteConfirmationModal.css";

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

/**
 * DeleteConfirmationModal Component
 * Displays a styled confirmation dialog before deleting an appointment
 * Uses the app theme (mint green, navy, etc.)
 * 
 * Props:
 *   - isOpen: boolean - Whether modal is open
 *   - appointmentInfo: object - { patientName, serviceType, date, time, id }
 *   - onConfirm: function - Callback when user confirms deletion
 *   - onCancel: function - Callback when user cancels
 *   - isLoading: boolean - Show loading state while deleting
 *   - errorMessage: string - Error message to display (if any)
 */
export default function DeleteConfirmationModal({
  isOpen,
  appointmentInfo = {},
  onConfirm,
  onCancel,
  isLoading = false,
  errorMessage = null,
}) {
  if (!isOpen) return null;

  const { patientName = "Unknown", serviceType = "Appointment", date = "", time = "", id = "" } = appointmentInfo;
  const formattedTime = formatTime(time);

  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="delete-modal-header">
          <div className="delete-modal-icon">🗑️</div>
          <h2>Delete Appointment</h2>
        </div>

        {/* Modal Content */}
        <div className="delete-modal-content">
          <p className="delete-modal-title">
            Are you sure you want to delete this appointment?
          </p>

          {/* Appointment Details */}
          <div className="delete-appointment-details">
            <div className="detail-row">
              <span className="detail-label">👤 Patient:</span>
              <span className="detail-value">{patientName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">🏥 Service:</span>
              <span className="detail-value">{serviceType}</span>
            </div>
            {date && (
              <div className="detail-row">
                <span className="detail-label">📅 Date:</span>
                <span className="detail-value">{date}</span>
              </div>
            )}
            {formattedTime && (
              <div className="detail-row">
                <span className="detail-label">⏰ Time:</span>
                <span className="detail-value">{formattedTime}</span>
              </div>
            )}
          </div>

          {/* Warning Message */}
          <div className="delete-warning">
            <span className="warning-icon">⚠️</span>
            <p>This action <strong>cannot be undone</strong>. The appointment will be permanently deleted from the system, and the time slot will become available for other bookings.</p>
          </div>

          {/* Error Message (if any) */}
          {errorMessage && (
            <div className="delete-error-message">
              <span className="error-icon">❌</span>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="delete-modal-actions">
          <button
            className="btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            ✕ Cancel
          </button>
          <button
            className="btn-delete"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Deleting...
              </>
            ) : (
              <>🗑️ Delete Appointment</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
