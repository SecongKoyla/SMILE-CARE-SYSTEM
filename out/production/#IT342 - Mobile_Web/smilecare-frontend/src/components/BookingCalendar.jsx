// components/BookingCalendar.jsx
import { useState, useEffect } from "react";

export default function BookingCalendar({ 
  timeSlots = [], 
  selectedDate, 
  setSelectedDate,
  selectedSlotId,
  setSelectedSlotId,
  clinicHours = []
}) {
  
  const today = new Date();
  // Allow admin to configure how many days in advance users can book (default 60)
  const bookingWindowDays = parseInt(localStorage.getItem("bookingWindowDays") || "60", 10);
  const maxDate = new Date(today.getTime() + bookingWindowDays * 24 * 60 * 60 * 1000); 

  /**
   * Convert military time (HH:MM) to 12-hour format with AM/PM
   * Examples: "09:00" → "9:00 AM", "14:00" → "2:00 PM"
   */
  const formatTimeToAMPM = (timeStr) => {
    if (!timeStr) return "";
    
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    if (hour > 12) {
      hour = hour - 12;
    } else if (hour === 0) {
      hour = 12;
    }
    
    return `${hour}:${minutes} ${ampm}`;
  };

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateAvailable = (date) => {
    if (date < today || date > maxDate) return false;
    
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert Sun=0 to Mon=0
    const dayConfig = clinicHours.find(h => h.dayOfWeek === dayOfWeek);
    
    return dayConfig?.isOperating ?? true;
  };

  const getSlotsForDate = (date) => {
    if (!date) return [];
    
    // Format date as YYYY-MM-DD in local timezone (not UTC)
    // This ensures consistent formatting with backend
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return timeSlots.filter(slot => {
      // Handle both string and date formats from backend
      const slotDate = typeof slot.date === 'string' ? slot.date : 
                       slot.date instanceof Date ? slot.date.toISOString().split('T')[0] :
                       String(slot.date);
      return slotDate === dateStr;
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
    setSelectedSlotId(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
    setSelectedSlotId(null);
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (isDateAvailable(newDate)) {
      setSelectedDate(newDate);
      setSelectedSlotId(null); // Reset slot selection
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: "8px" }}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isAvailable = isDateAvailable(date);
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={!isAvailable}
          style={{
            padding: "12px 8px",
            border: isSelected ? "2px solid var(--mint)" : "1px solid #ddd",
            borderRadius: "8px",
            background: isSelected ? "rgba(78, 203, 166, 0.1)" : isToday ? "#f9f9f9" : "white",
            color: isAvailable ? "var(--navy)" : "#ccc",
            fontWeight: isToday ? "700" : "500",
            cursor: isAvailable ? "pointer" : "not-allowed",
            fontSize: "13px",
            transition: "all 0.2s",
            opacity: isAvailable ? 1 : 0.5,
          }}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="booking-calendar" style={{ padding: "0" }}>
      {/* Month Navigation */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid #eee"
      }}>
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
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--navy)" }}>
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
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

      {/* Day Headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        marginBottom: "8px"
      }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div
            key={day}
            style={{
              textAlign: "center",
              fontWeight: "700",
              fontSize: "11px",
              color: "var(--gray)",
              padding: "8px 0"
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        marginBottom: "16px"
      }}>
        {renderCalendar()}
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div style={{
          background: "rgba(78, 203, 166, 0.05)",
          borderLeft: "3px solid var(--mint)",
          padding: "12px",
          borderRadius: "6px",
          marginBottom: "16px"
        }}>
          <div style={{ fontSize: "12px", color: "var(--gray)", marginBottom: "4px" }}>
            📅 Selected Date
          </div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--navy)" }}>
            {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      )}

      {/* Time Slots for Selected Date */}
      {selectedDate && getSlotsForDate(selectedDate).length > 0 ? (
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--gray)", marginBottom: "8px", textTransform: "uppercase" }}>
            Available Times
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
            gap: "8px"
          }}>
            {getSlotsForDate(selectedDate).map(slot => {
              const isAvailable = slot.status === 'AVAILABLE' || !slot.status; // Fallback in case status is null
              const isSelected = selectedSlotId === slot.id;
              
              return (
                <button
                  key={slot.id}
                  disabled={!isAvailable}
                  onClick={() => {
                    if (isAvailable) setSelectedSlotId(slot.id);
                  }}
                  style={{
                    padding: "10px",
                    border: isSelected ? "2px solid var(--mint)" : isAvailable ? "1px solid #ddd" : "1px solid #eee",
                    borderRadius: "6px",
                    background: isSelected ? "rgba(78, 203, 166, 0.1)" : isAvailable ? "white" : "#f1f5f9",
                    color: isAvailable ? "var(--navy)" : "#94a3b8",
                    fontWeight: isSelected ? "700" : "500",
                    cursor: isAvailable ? "pointer" : "not-allowed",
                    fontSize: "13px",
                    textDecoration: !isAvailable ? "line-through" : "none",
                    opacity: !isAvailable ? 0.7 : 1,
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px"
                  }}
                  title={!isAvailable ? "This time slot is no longer available" : "Click to select"}
                >
                  <span>🕐 {formatTimeToAMPM(slot.startTime)}</span>
                  {!isAvailable && (
                    <span style={{ fontSize: "9px", textDecoration: "none", color: "#ef4444", fontWeight: "600" }}>
                      {slot.status === 'LOCKED' ? 'RESERVED' : 'BOOKED'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : selectedDate ? (
        <div style={{
          background: "#fee",
          borderLeft: "3px solid #f66",
          padding: "12px",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#c00"
        }}>
          No available time slots for this date.
        </div>
      ) : null}
    </div>
  );
}
