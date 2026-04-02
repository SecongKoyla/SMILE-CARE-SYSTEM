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
  const maxDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

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
    const dateStr = date.toISOString().split('T')[0];
    return timeSlots.filter(slot => slot.date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
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
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600"
          }}
        >
          ← Prev
        </button>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={handleNextMonth}
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600"
          }}
        >
          Next →
        </button>
      </div>

      {/* Day Headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        marginBottom: "8px"
      }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
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
            {getSlotsForDate(selectedDate).map(slot => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlotId(slot.id)}
                style={{
                  padding: "10px",
                  border: selectedSlotId === slot.id ? "2px solid var(--mint)" : "1px solid #ddd",
                  borderRadius: "6px",
                  background: selectedSlotId === slot.id ? "rgba(78, 203, 166, 0.1)" : "white",
                  color: "var(--navy)",
                  fontWeight: selectedSlotId === slot.id ? "700" : "500",
                  cursor: "pointer",
                  fontSize: "13px",
                  transition: "all 0.2s"
                }}
              >
                🕐 {slot.startTime}
              </button>
            ))}
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
