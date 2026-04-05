// pages/AdminApptsPage.jsx
// Admin-only: view all appointments across all patients
import { useState, useEffect, useMemo } from "react";
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

  // Calendar states
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);

  // Delete modal states
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    appointmentData: null,
    isDeleting: false,
    deleteError: null,
    successMessage: null,
  });

  // Booking Settings Modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [daysInAdvance, setDaysInAdvance] = useState(() => localStorage.getItem("bookingWindowDays") || "60");

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

  const displayAppointments = useMemo(() => appointments.map(appt => {
    const d = new Date(appt.timeSlot.date);
    const rawDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    return {
      id: appt.id,
      rawDate: rawDateStr,
      day: d.getDate().toString().padStart(2, '0'),
      month: d.toLocaleString('default', { month: 'short' }),
      type: appt.service.name,
      time: appt.timeSlot.startTime,
      status: statusMap[appt.status] || appt.status.toLowerCase(),
      originalStatus: appt.status,
      patient: appt.patient.fullName,
      patientEmail: appt.patient.email,
      // Include the full original appointment object for actions like delete
      _original: appt
    };
  }), [appointments]); // Only depends on appointments

  const appointmentsByDate = useMemo(() => {
    const map = {};
    displayAppointments.forEach(appt => {
      // filter mapped colors or just add them all
      if (filter !== "all" && appt.status !== filterToStatusMap[filter]) return;
      if (!map[appt.rawDate]) map[appt.rawDate] = [];
      map[appt.rawDate].push(appt);
    });
    return map;
  }, [displayAppointments, filter]);

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

  let filtered = filter === "all"
    ? displayAppointments
    : displayAppointments.filter(a => a.status === filterToStatusMap[filter]);

  if (selectedDateFilter) {
    filtered = filtered.filter(a => a.rawDate === selectedDateFilter);
  }

  const counts = {
    confirmed: displayAppointments.filter(a => a.status === "confirmed").length,
    pending:   displayAppointments.filter(a => a.status === "pending").length,
    cancelled: displayAppointments.filter(a => a.status === "cancelled").length,
  };

  // Calendar helpers
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));
  
  // Custom Month Dropdown handler
  const handleMonthDropdown = (e) => {
    const selectedMonth = parseInt(e.target.value, 10);
    setCurrentMonthDate(new Date(year, selectedMonth, 1));
  };
  
  // Custom Year Dropdown handler
  const handleYearDropdown = (e) => {
    const selectedYear = parseInt(e.target.value, 10);
    setCurrentMonthDate(new Date(selectedYear, month, 1));
  };

  const saveSettings = () => {
    localStorage.setItem("bookingWindowDays", daysInAdvance);
    setShowSettingsModal(false);
  };

  return (
    <main className="sc-main page-enter">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>All Appointments</h1>
          <p>Manage and track all patient appointments across the clinic</p>
        </div>
        <button 
          onClick={() => setShowSettingsModal(true)}
          style={{ 
            padding: "10px 20px", 
            borderRadius: "12px", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            background: "var(--navy)",
            color: "#fff",
            border: "none",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <span style={{ fontSize: "18px" }}>⚙️</span> Booking Settings
        </button>
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
            onClick={() => { setFilter(f); setSelectedDateFilter(null); }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} 
            {f !== "all" && ` (${
              f === "approved" ? counts.confirmed : 
              f === "pending" ? counts.pending : 
              counts.cancelled
            })`}
          </button>
        ))}
      </div>

      {/* Calendar Filter UI */}
      <div className="card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", margin: 0, color: "var(--navy)" }}>Filter by Date</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {selectedDateFilter && (
               <button 
                className="btn-outline" 
                style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "12px" }} 
                onClick={() => setSelectedDateFilter(null)}
               >
                 Clear Date Filter
               </button>
            )}
            <button
              onClick={handlePrevMonth}
              className="btn-outline"
              style={{
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                border: "1px solid var(--mint)",
                color: "var(--mint)",
                background: "var(--mint-light)",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              ←
            </button>
            <div style={{ display: "flex", gap: "8px", fontWeight: "600", minWidth: "180px", justifyContent: "center" }}>
              <select 
                value={month} 
                onChange={handleMonthDropdown}
                className="custom-select-month"
                style={{ 
                  appearance: "none",
                  border: "2px solid #e2e8f0", 
                  borderRadius: "12px", 
                  padding: "8px 14px", 
                  paddingRight: "30px", // space for down arrow
                  background: "#ffffff url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" viewBox=\"0 0 20 20\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5.29289 7.29289C5.68342 6.90237 6.31658 6.90237 6.70711 7.29289L10 10.5858L13.2929 7.29289C13.6834 6.90237 14.3166 6.90237 14.7071 7.29289C15.0976 7.68342 15.0976 8.31658 14.7071 8.70711L10.7071 12.7071C10.3166 13.0976 9.68342 13.0976 9.29289 12.7071L5.29289 8.70711C4.90237 8.31658 4.90237 7.68342 5.29289 7.29289Z\" fill=\"%2364748B\"/></svg>') no-repeat right 8px center",
                  color: "var(--navy)",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.borderColor = "var(--mint)"}
                onMouseLeave={(e) => e.target.style.borderColor = "#e2e8f0"}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{new Date(year, i, 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={handleYearDropdown}
                className="custom-select-year"
                style={{ 
                  appearance: "none",
                  border: "2px solid #e2e8f0", 
                  borderRadius: "12px", 
                  padding: "8px 14px", 
                  paddingRight: "30px",
                  background: "#ffffff url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" viewBox=\"0 0 20 20\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5.29289 7.29289C5.68342 6.90237 6.31658 6.90237 6.70711 7.29289L10 10.5858L13.2929 7.29289C13.6834 6.90237 14.3166 6.90237 14.7071 7.29289C15.0976 7.68342 15.0976 8.31658 14.7071 8.70711L10.7071 12.7071C10.3166 13.0976 9.68342 13.0976 9.29289 12.7071L5.29289 8.70711C4.90237 8.31658 4.90237 7.68342 5.29289 7.29289Z\" fill=\"%2364748B\"/></svg>') no-repeat right 8px center",
                  color: "var(--navy)",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.borderColor = "var(--mint)"}
                onMouseLeave={(e) => e.target.style.borderColor = "#e2e8f0"}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <option key={i} value={new Date().getFullYear() + i - 1}>{new Date().getFullYear() + i - 1}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleNextMonth}
              className="btn-outline"
              style={{
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                border: "1px solid var(--mint)",
                color: "var(--mint)",
                background: "var(--mint-light)",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              →
            </button>
          </div>
        </div>

        <div className="calendar-grid" style={{
          display: "grid", 
          gridTemplateColumns: "repeat(7, 1fr)", 
          gap: "8px", 
          textAlign: "center" 
        }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} style={{ fontSize: "13px", fontWeight: "600", color: "var(--gray)", paddingBottom: "8px" }}>
              {d}
            </div>
          ))}

          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayAppts = appointmentsByDate[dateStr] || [];
            const isSelected = selectedDateFilter === dateStr;
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = dateStr === todayStr;

            return (
              <div 
                key={dateStr}
                onClick={() => setSelectedDateFilter(isSelected ? null : dateStr)}
                style={{
                  padding: "8px 4px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: isSelected ? "var(--mint)" : isToday ? "#f1f5f9" : "transparent",
                  color: isSelected ? "white" : "var(--navy)",
                  border: isToday && !isSelected ? "1px solid var(--mint)" : "1px solid transparent",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  minHeight: "56px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.background = "#e2e8f0" }}
                onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.background = isToday ? "#f1f5f9" : "transparent" }}
              >
                <span style={{ fontWeight: isSelected || isToday ? "700" : "500", fontSize: "14px" }}>{dayNum}</span>
                
                {/* Dots for appointments */}
                {dayAppts.length > 0 && (
                   <div style={{ display: "flex", gap: "3px", marginTop: "6px", flexWrap: "wrap", justifyContent: "center", padding: "0 4px" }}>
                     {dayAppts.slice(0,3).map((da, idx) => (
                       <div key={idx} style={{
                         width: "8px", height: "8px", borderRadius: "50%",
                         border: isSelected ? "1px solid white" : "none",
                         background: 
                           da.status === 'confirmed' ? '#22c55e' : // explicitly green
                           da.status === 'pending' ? '#eab308' : 
                           '#ef4444' // cancelled
                       }} title={`${da.patient} - ${da.type}`} />
                     ))}
                     {dayAppts.length > 3 && <span style={{ fontSize: "10px", lineHeight: "8px", color: isSelected ? "white" : "var(--gray)", marginLeft: "1px" }}>+</span>}
                   </div>
                )}
              </div>
            )
          })}
        </div>
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

      {/* Booking Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: "420px", width: "100%", padding: "32px", borderRadius: "24px", background: "#ffffff", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ background: "var(--mint-light)", padding: "10px", borderRadius: "12px", color: "var(--mint)", fontSize: "20px" }}>⚙️</div>
              <h2 style={{ margin: 0, color: "var(--navy)", fontSize: "22px", fontWeight: "700" }}>Booking Settings</h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "28px", lineHeight: "1.5" }}>
              Configure how many days in advance a patient is allowed to book their appointment from the user dashboard.
            </p>
            <div style={{ marginBottom: "32px", background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "var(--navy)", fontSize: "15px" }}>Maximum Booking Distance (Days)</label>
              <input 
                type="number" 
                value={daysInAdvance} 
                onChange={(e) => setDaysInAdvance(e.target.value)}
                min="1"
                max="365"
                style={{ 
                  width: "100%", 
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "var(--navy)",
                  outline: "none",
                  transition: "all 0.2s"
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--mint)"; e.target.style.boxShadow = "0 0 0 3px var(--mint-light)" }}
                onBlur={(e) => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setShowSettingsModal(false)}
                style={{ 
                  flex: 1, 
                  padding: "14px", 
                  borderRadius: "12px", 
                  background: "#f1f5f9", 
                  color: "#475569", 
                  border: "none", 
                  fontWeight: "600", 
                  fontSize: "15px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
              >
                Cancel
              </button>
              <button 
                onClick={saveSettings}
                style={{ 
                  flex: 1, 
                  padding: "14px", 
                  borderRadius: "12px", 
                  background: "var(--mint)", 
                  color: "#ffffff", 
                  border: "none", 
                  fontWeight: "600", 
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.2)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}