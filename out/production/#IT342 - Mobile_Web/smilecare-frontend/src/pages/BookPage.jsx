// pages/BookPage.jsx
import { useState, useEffect, useRef } from "react";
import { getAvailableTimeSlots, bookAppointment, getUserAppointments, getClinicHours } from "../api/api.js";
import { getClinicExceptions } from "../api/exceptionsApi.js";
import BookingCalendar from "../components/BookingCalendar.jsx";

export default function BookPage({ services, user, setPage, onBook }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [clinicHours, setClinicHours] = useState([]);
  const [clinicExceptions, setClinicExceptions] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Abort controller for cancelling ongoing requests during rapid switches
  const abortControllerRef = useRef(null);
  
  // Debounce timer for rapid date switches
  const dateDebounceRef = useRef(null);

  // Fetch clinic hours on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [hours, exceptions] = await Promise.all([
          getClinicHours(),
          getClinicExceptions().catch(e => {
            console.error("Non-fatal: Failed to load clinic exceptions", e);
            return [];
          })
        ]);
        setClinicHours(hours || []);
        setClinicExceptions(exceptions || []);
      } catch (err) {
        console.error("Error loading calendar config:", err);
      }
    };
    loadConfig();
  }, []);

  // Fetch time slots when a service is selected
  useEffect(() => {
    if (selectedIdx !== null) {
      // Abort any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      fetchTimeSlots(null, abortControllerRef.current.signal);
    }
  }, [selectedIdx]);

  // Fetch time slots when a date is selected with debounce (prevent rapid requests)
  useEffect(() => {
    if (selectedIdx !== null && selectedDate) {
      // Clear previous timeout
      if (dateDebounceRef.current) {
        clearTimeout(dateDebounceRef.current);
      }
      
      // Set new timeout (wait 300ms before fetching)
      dateDebounceRef.current = setTimeout(() => {
        // Create abort controller for date-based fetch
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        fetchTimeSlots(selectedDate, abortControllerRef.current.signal);
      }, 300);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (dateDebounceRef.current) {
        clearTimeout(dateDebounceRef.current);
      }
    };
  }, [selectedDate, selectedIdx]);

  const fetchTimeSlots = async (date = null, abortSignal = null) => {
    if (selectedIdx === null) return;
    
    try {
      setError(null); // Clear previous errors
      setLoading(true);
      const selectedService = services[selectedIdx];
      console.log("📅 Fetching slots for service:", selectedService);
      
      if (!selectedService?.id) {
        setError("Invalid service selected");
        setLoading(false);
        return;
      }
      
      // Fetch slots with optional date parameter and abort signal
      const slots = await getAvailableTimeSlots(selectedService.id, date, abortSignal);
      
      // Check if request was aborted (user switched services before response)
      if (abortSignal?.aborted) {
        console.log("ℹ️ Request aborted - user switched services");
        setLoading(false);
        return;
      }
      
      console.log("📅 Received slots:", slots);
      console.log("📅 Slot count:", slots?.length || 0);
      
      if (!slots || slots.length === 0) {
        console.warn("⚠️ No slots received from backend");
        setTimeSlots([]);
        
        // Only show error if a specific date was selected (not on initial service selection)
        if (date) {
          setError("No available time slots for this date. Please select another date.");
        }
        // Don't show error for initial service selection - backend will generate slots for next 14 days
      } else {
        setTimeSlots(slots);
        setError(null); // Clear any previous error
        console.log("✅ TimeSlots set successfully");
      }
    } catch (err) {
      // Don't log/display error if request was aborted (normal during rapid switching)
      if (err.name === "AbortError") {
        console.log("ℹ️ Request was cancelled (user switched services)");
        setLoading(false);
        return;
      }
      
      console.error("❌ Error fetching time slots:", err);
      setTimeSlots([]);
      setError(err.message || "Could not load available time slots. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSlots = async () => {
    try {
      console.log("🔄 Manually refreshing slots...");
      await fetchTimeSlots(selectedDate);
      setLastRefresh(new Date());
      console.log("✅ Slots refreshed at", new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error refreshing:", error);
    }
  };

  const handleConfirm = async () => {
    if (selectedIdx === null || !selectedTimeSlotId || !user?.id) {
      setError("Please select a service and time slot");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Find the service ID from the services array
      const selectedService = services[selectedIdx];
      if (!selectedService?.id) {
        throw new Error("Invalid service selected");
      }

      // Find the selected time slot to get its details
      const selectedSlot = timeSlots.find(t => t.id === selectedTimeSlotId);
      if (!selectedSlot) {
        throw new Error("Selected time slot not found");
      }

      // Book the appointment via API with slot details
      const bookingData = {
        patientId: user.id,
        serviceId: selectedService.id,
        timeSlotId: selectedTimeSlotId,
        startTime: selectedSlot.startTime,      // 09:00
        endTime: selectedSlot.endTime,          // 10:00
        appointmentDate: selectedSlot.date,     // 2026-04-07
        status: "PENDING"
      };

      const appointment = await bookAppointment(bookingData);
      
      // Call the old onBook callback for any legacy handling
      if (onBook) {
        onBook({
          type: selectedService.name,
          time: selectedSlot.startTime || ""
        });
      }

      setBookingSuccess(true);
      setConfirmed(true);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || "Failed to book appointment. Please try again.");
      setLoading(false);
    }
  };

  if (confirmed) {
    const bookedSlot = timeSlots.find(t => t.id === selectedTimeSlotId);
    let displayTime = bookedSlot?.startTime || "";
    let displayDate = "";
    
    if (bookedSlot?.date) {
      // Avoid timezone shifting issues by parsing YYYY-MM-DD directly
      const [year, month, day] = bookedSlot.date.split('-');
      const localDate = new Date(year, month - 1, day);
      displayDate = localDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    }

    if (displayTime) {
      const timeParts = displayTime.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        let mins = parseInt(timeParts[2], 10);
        if (timeParts[3] && timeParts[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (timeParts[3] && timeParts[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
        
        let displayHours = hours % 12 || 12;
        let displayMins = mins.toString().padStart(2, '0');
        let ampm = hours >= 12 ? 'PM' : 'AM';
        displayTime = `${displayHours.toString().padStart(2, '0')}:${displayMins} ${ampm}`;
      }
    }

    return (
      <main className="sc-main page-enter">
        <div className="card">
          <div className="confirm-success">
            <div className="success-icon">🎉</div>
            <h2>Appointment Booked!</h2>
            <p>
              Your <strong>{services[selectedIdx]?.name}</strong> is scheduled at{" "}
              <strong>{displayTime}</strong> on{" "}
              <strong>{displayDate}</strong>.<br />
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

      {error && (
        <div className="card" style={{ background: "#fee", borderLeft: "4px solid #f66", marginBottom: "16px" }}>
          <p style={{ color: "#c00", margin: "0", fontSize: "13px" }}>⚠️ {error}</p>
        </div>
      )}

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
                onClick={() => { 
                  // Abort any pending requests when switching services
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                  }
                  setSelectedIdx(i); 
                  setSelectedTimeSlotId(null); 
                  setSelectedDate(null);
                }}
              >
                <div className="book-service-icon">{s.icon}</div>
                <div>
                  <div className="book-service-name">{s.name}</div>
                  <div className="book-service-dur">
                    {s.duration_unit === 'hours' ? `${s.duration_minutes / 60} hr${s.duration_minutes / 60 !== 1 ? 's' : ''}` : `${s.duration_minutes || s.duration} min`} · ₱{s.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Calendar & Time Slot */}
      {selectedIdx !== null && (
        <div className="card fade-in" style={{ marginBottom: 14 }}>
          <div className="card-title">
            <span>Step 2 — Choose a Date and Time</span>
          </div>
          <BookingCalendar
            timeSlots={timeSlots}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedSlotId={selectedTimeSlotId}
            setSelectedSlotId={setSelectedTimeSlotId}
            clinicHours={clinicHours}
            clinicExceptions={clinicExceptions}
          />
          <button 
            onClick={handleRefreshSlots} 
            style={{ 
              marginBottom: "10px", 
              marginTop: "10px",
              padding: "8px 16px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            🔄 Refresh Availability
          </button>
          <p style={{ fontSize: "12px", color: "#999", margin: "0" }}>
            Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : "Not yet"}
          </p>
          {timeSlots.length === 0 && selectedDate && (
            <div className="empty-state" style={{ marginTop: "16px" }}>
              <span className="empty-icon">📅</span>
              <p>No available time slots for this date.<br />Please select another date.</p>
            </div>
          )}
        </div>
      )}

      {/* Confirm */}
      <button
        className="btn-primary"
        style={{ width: "100%", padding: 15, fontSize: 15, opacity: (selectedIdx !== null && selectedTimeSlotId) ? 1 : 0.45 }}
        disabled={selectedIdx === null || !selectedTimeSlotId || loading}
        onClick={handleConfirm}
      >
        {loading ? "⏳ Booking..." : "Confirm Appointment"}
      </button>
    </main>
  );
}