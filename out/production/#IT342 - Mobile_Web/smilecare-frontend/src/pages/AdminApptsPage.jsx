// pages/AdminApptsPage.jsx
// Admin-only: view all appointments across all patients
import { useState, useEffect } from "react";
import AppointmentCard from "../components/AppointmentCard.jsx";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.jsx";
import { getAllAppointments, updateAppointmentStatus, deleteAppointment } from "../api/api.js";

const FILTERS = ["all", "approved", "pending", "cancelled"];

export default function AdminApptsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState(null);

  // Delete modal states
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    appointmentData: null,
    isDeleting: false,
    deleteError: null,
    successMessage: null,
  });

  useEffect(() => {
    fetchAppointments();
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  const fetchAppointments = async (autoRetry = false) => {
    try {
      if (!autoRetry) {
        setLoading(true);
        setError(null);
        setRetryCount(0);
      }
      
      console.log("[AdminApptsPage] Fetching appointments...");
      const data = await getAllAppointments();
      setAppointments(data || []);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error("[AdminApptsPage] Error fetching appointments:", err);
      setError(err.message);
      setAppointments([]);
      
      // Auto-retry on server errors (5xx) up to 3 times
      if (autoRetry === false && err.message.includes("Server error")) {
        const newRetryCount = retryCount + 1;
        if (newRetryCount <= 3) {
          setRetryCount(newRetryCount);
          const delayMs = Math.min(1000 * Math.pow(2, newRetryCount - 1), 5000);
          console.log(`[AdminApptsPage] Scheduling auto-retry ${newRetryCount}/3 in ${delayMs}ms...`);
          
          const timeout = setTimeout(() => {
            fetchAppointments(true);
          }, delayMs);
          
          setRetryTimeout(timeout);
          setError(`Server error. Retrying automatically (${newRetryCount}/3)...`);
        }
      }
    } finally {
      if (!autoRetry) {
        setLoading(false);
      }
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

  const openDeleteModal = (appointmentData) => {
    // Get the original appointment object with full nested structure
    const originalAppt = appointmentData._original;
    
    if (!originalAppt) {
      console.error("[AdminApptsPage] No appointment data found:", appointmentData);
      alert("Could not load appointment details. Please try refreshing the page.");
      return;
    }

    // Validate appointment has an ID
    if (!originalAppt.id || originalAppt.id <= 0) {
      console.error("[AdminApptsPage] Invalid appointment ID:", originalAppt.id);
      alert("Invalid appointment ID. Please refresh and try again.");
      return;
    }

    // Format the appointment data for display in modal
    const formattedDate = new Date(originalAppt.timeSlot.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    console.log("[AdminApptsPage] Opening delete modal for appointment ID:", originalAppt.id, 
                "Patient:", originalAppt.patient.fullName, 
                "Full appointment:", originalAppt);

    setDeleteModal({
      isOpen: true,
      appointmentData: {
        id: originalAppt.id,
        patientName: originalAppt.patient.fullName,
        serviceType: originalAppt.service.name,
        date: formattedDate,
        time: originalAppt.timeSlot.startTime,
      },
      isDeleting: false,
      deleteError: null,
      successMessage: null,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      appointmentData: null,
      isDeleting: false,
      deleteError: null,
      successMessage: null,
    });
  };

  const confirmDeleteAppointment = async () => {
    if (!deleteModal.appointmentData) {
      console.error("[AdminApptsPage] No appointment data in delete modal");
      return;
    }

    const appointmentId = deleteModal.appointmentData.id;
    console.log("[AdminApptsPage] Confirming deletion for appointment ID:", appointmentId, "Type:", typeof appointmentId);
    
    // Validate the appointment ID exists and is valid
    if (!appointmentId || appointmentId <= 0) {
      console.error("[AdminApptsPage] Invalid appointment ID for deletion:", appointmentId);
      setDeleteModal(prev => ({
        ...prev,
        isDeleting: false,
        deleteError: "Invalid appointment ID. Cannot delete.",
      }));
      return;
    }

    setDeleteModal(prev => ({
      ...prev,
      isDeleting: true,
      deleteError: null,
    }));

    try {
      // Call the delete API
      console.log("[AdminApptsPage] Sending DELETE request for appointment", appointmentId);
      await deleteAppointment(appointmentId);
      console.log("✅ Appointment deleted successfully");

      // Show success message briefly
      setDeleteModal(prev => ({
        ...prev,
        successMessage: "Appointment deleted successfully!",
      }));

      // Close modal and refresh after a short delay
      setTimeout(() => {
        closeDeleteModal();
        fetchAppointments();
      }, 800);

    } catch (err) {
      console.error("❌ Error deleting appointment:", err);
      setDeleteModal(prev => ({
        ...prev,
        isDeleting: false,
        deleteError: err.message || "Failed to delete appointment. Please try again.",
      }));
    }
  };

  if (loading) {
    return <div className="sc-main page-enter"><p>⏳ Loading appointments...</p></div>;
  }

  if (error) {
    const isAutoRetrying = error.includes("Retrying automatically");
    return (
      <div className="sc-main page-enter">
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>
            {isAutoRetrying ? "⏳" : "⚠️"}
          </div>
          <h2>{isAutoRetrying ? "Retrying..." : "Unable to Load Appointments"}</h2>
          <p style={{ color: "var(--gray)", marginBottom: "16px" }}>
            {error}
          </p>
          <p style={{ color: "var(--gray)", fontSize: "13px", marginBottom: "20px" }}>
            Make sure the backend server is running on http://localhost:8085
          </p>
          <button 
            className="btn-primary"
            onClick={() => fetchAppointments()}
            style={{ minWidth: "120px" }}
            disabled={isAutoRetrying}
          >
            🔄 {isAutoRetrying ? "Retrying..." : "Retry Now"}
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

  // Map filter names to actual status display names
  // This is needed because filters use "approved" but statuses map to "confirmed"
  const filterToStatusMap = {
    "all": null,           // null means show all
    "approved": "confirmed",
    "pending": "pending",
    "cancelled": "cancelled"
  };

  // Map for display labels (what to show in empty state and logs)
  const filterLabelMap = {
    "approved": "confirmed",
    "pending": "pending",
    "cancelled": "cancelled"
  };

  const displayAppointments = appointments.map(appt => ({
    id: appt.id,
    day: new Date(appt.timeSlot.date).getDate().toString().padStart(2, '0'),
    month: new Date(appt.timeSlot.date).toLocaleString('default', { month: 'short' }),
    type: appt.service.name,
    time: appt.timeSlot.startTime,
    status: statusMap[appt.status] || appt.status.toLowerCase(),
    originalStatus: appt.status,
    patient: appt.patient.fullName,
    patientEmail: appt.patient.email,
    // Include the full original appointment object for actions like delete
    _original: appt
  }));

  const filtered = filter === "all"
    ? displayAppointments
    : displayAppointments.filter(a => a.status === filterToStatusMap[filter]);

  const counts = {
    confirmed: displayAppointments.filter(a => a.status === "confirmed").length,
    pending:   displayAppointments.filter(a => a.status === "pending").length,
    cancelled: displayAppointments.filter(a => a.status === "cancelled").length,
  };

  return (
    <main className="sc-main page-enter">
      <div className="page-header">
        <div>
          <h1>All Appointments</h1>
          <p>Manage and track all patient appointments across the clinic</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats">
        {[
          { icon: "📅", label: "Total",     value: appointments.length },
          { icon: "✅", label: "Confirmed", value: counts.confirmed },
          { icon: "⏳", label: "Pending",   value: counts.pending },
          { icon: "❌", label: "Cancelled", value: displayAppointments.filter(a => a.status === "cancelled").length },
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
      <div className="filter-row">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`pill${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} 
            {f !== "all" && ` (${
              f === "approved" ? counts.confirmed : 
              f === "pending" ? counts.pending : 
              displayAppointments.filter(a => a.status === f).length
            })`}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="appt-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>No {filter === "all" ? "appointments" : `${filterLabelMap[filter]} appointments`} found.</p>
            </div>
          ) : filtered.map(a => (
            <div key={a.id} className="appt-admin-item">
              <div>
                <AppointmentCard appt={a} showStatus showPatient />
                <div className="appt-admin-details" style={{ marginTop: "10px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--navy)" }}>
                    {a.patient}
                  </div>
                  <div className="patient-email">{a.patientEmail}</div>
                </div>
              </div>
              <div className="appt-admin-actions">
                <button
                  className={`status-action${a.status === "confirmed" ? " active" : ""}`}
                  onClick={() => handleStatusChange(a.id, "APPROVED")}
                  title="Confirm appointment"
                >
                  ✓ Confirm
                </button>
                <button
                  className={`status-action${a.status === "pending" ? " active" : ""}`}
                  onClick={() => handleStatusChange(a.id, "PENDING")}
                  title="Mark as pending"
                >
                  ⏳ Pending
                </button>
                <button
                  className={`status-action${a.status === "cancelled" ? " active" : ""}`}
                  onClick={() => handleStatusChange(a.id, "CANCELLED")}
                  title="Cancel appointment"
                >
                  ✕ Cancel
                </button>
                <button
                  className="status-action delete-action"
                  onClick={() => openDeleteModal(a)}
                  title="Delete appointment"
                  style={{ color: "#dc3545" }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        appointmentInfo={deleteModal.appointmentData}
        onConfirm={confirmDeleteAppointment}
        onCancel={closeDeleteModal}
        isLoading={deleteModal.isDeleting}
        errorMessage={deleteModal.deleteError}
      />
    </main>
  );
}