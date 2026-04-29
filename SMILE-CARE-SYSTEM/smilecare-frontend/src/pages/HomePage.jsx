import { useState, useEffect } from "react";
import AppointmentCard from "../components/AppointmentCard.jsx";
import { getUserAppointments } from "../api/api.js";

export default function HomePage({ user, appointments, setPage }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [localAppointments, setLocalAppointments] = useState(appointments || []);
  const [clearedNotifyIds, setClearedNotifyIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`cleared_notifications_${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleClearNotifications = (e) => {
    e.stopPropagation();
    const newCleared = [...clearedNotifyIds, ...notifications.map(n => n.id)];
    setClearedNotifyIds(newCleared);
    try {
      localStorage.setItem(`cleared_notifications_${user?.id || 'guest'}`, JSON.stringify(newCleared));
    } catch (err) {
      console.error("Failed to save cleared notifications:", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      getUserAppointments(user.id)
        .then(data => {
          const statusMap = {
            "APPROVED": "approved",
            "PENDING": "pending",
            "CANCELLED": "cancelled",
            "COMPLETED": "completed"
          };
          const transformed = data.map(appt => {
            const dateObj = new Date(appt.timeSlot.date);
            // Default 00:00:00 to avoid invalid formats if time is just "10:00 AM"
            const timeParts = appt.timeSlot.startTime.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
            let hours = 0, mins = 0;
            let formattedTime = appt.timeSlot.startTime;
            if (timeParts) {
              hours = parseInt(timeParts[1], 10);
              mins = parseInt(timeParts[2], 10);
              if (timeParts[3] && timeParts[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
              if (timeParts[3] && timeParts[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
              
              // Format as 12-hour AM/PM
              let displayHours = hours % 12 || 12;
              let displayMins = mins.toString().padStart(2, '0');
              let ampm = hours >= 12 ? 'PM' : 'AM';
              formattedTime = `${displayHours.toString().padStart(2, '0')}:${displayMins} ${ampm}`;
            }
            dateObj.setHours(hours, mins, 0, 0);

            return {
              id: appt.id,
              day: new Date(appt.timeSlot.date).getDate().toString().padStart(2, '0'),
              month: new Date(appt.timeSlot.date).toLocaleString('default', { month: 'short' }),
              timestamp: dateObj.getTime(), // Used for numeric sorting
              type: appt.service.name,
              time: formattedTime,
              status: statusMap[appt.status] || appt.status.toLowerCase(),
              patient: user.name
            };
          });
          setLocalAppointments(transformed);
        })
        .catch(err => console.error("Failed to fetch latest appointments for Home:", err));
    }
  }, [user]);

  const displayName = (user?.firstName && user?.lastName) 
      ? `${user.firstName} ${user.lastName}` 
      : (user?.name ?? user?.fullName ?? "").trim();
  const firstName = displayName ? displayName.split(/\s+/)[0] : "User";

  const upcoming = [...localAppointments]
    .filter(a => a.status === "approved")
    .sort((a, b) => a.timestamp - b.timestamp); // Ascending (soonest first)

  // Generate notifications based on appointment data
  const notifications = [...localAppointments]
    .filter(a => (a.status === "cancelled" || a.status === "approved" || a.status === "completed") && !clearedNotifyIds.includes(a.id))
    .sort((a, b) => b.id - a.id) // Simplistic chronological using IDs if higher ID means newer, or use another metric
    .slice(0, 5) // Take 5 most recent
    .map(a => ({
      id: a.id,
      title: `Appointment ${a.status.charAt(0).toUpperCase() + a.status.slice(1)}`,
      msg: `Your ${a.type} appointment on ${a.month} ${a.day} at ${a.time} is ${a.status}.`,
      type: a.status // used for coloring
    }));

  return (
    <main className="sc-main page-enter">

      {/* Hero */}
      <div style={{
        background: "linear-gradient(120deg, #1A2E3B 0%, #234358 100%)",
        borderRadius: 20,
        padding: "36px 40px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{ position: "absolute", right: 160, fontSize: 80, opacity: 0.06, top: "50%", transform: "translateY(-50%) rotate(-20deg)" }}>
          🦷
        </div>
        <div>
          <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 500,
                color: "white",
                marginBottom: 6,
              }}
          >
            Good morning,{" "}
            <em style={{fontStyle: "italic", color: "var(--mint)"}}>
              {firstName}
            </em>
            !
          </h2>

          <p style={{fontSize: 13, color: "rgba(255,255,255,0.5)"}}>
            You have {upcoming.length} upcoming appointment{upcoming.length !== 1 ? "s" : ""} this month.
          </p>
        </div>
        <button
            className="btn-primary"
            style={{whiteSpace: "nowrap", position: "relative", zIndex: 1}}
            onClick={() => setPage("book")}
        >
          + Book Appointment
        </button>
      </div>

      {/* Stats - Consolidated to just Next Visit */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "20px 24px",
        marginBottom: "28px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        border: "1px solid #f1f5f9"
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "var(--mint-light)",
          color: "var(--mint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          flexShrink: 0
        }}>
          📅
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--gray)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Next Scheduled Visit</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--navy)" }}>
            {upcoming[0] ? `${upcoming[0].month} ${upcoming[0].day}` : "No upcoming visits approved"}
          </div>
        </div>
        {upcoming[0] && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", color: "var(--gray)", fontWeight: "600", marginBottom: "4px" }}>{upcoming[0].time}</div>
            <div style={{ fontSize: "13px", color: "var(--mint)", fontWeight: "700", background: "var(--mint-light)", padding: "4px 12px", borderRadius: "20px" }}>{upcoming[0].type}</div>
          </div>
        )}
      </div>

      {/* Two-col */}
      <div className="cols">
        {/* Upcoming appointments */}
        <div className="card">
          <div className="card-title">
            <span>Upcoming Appointments</span>
            <button onClick={() => setPage("appointments")}>View all →</button>
          </div>
          <div className="appt-list">
            {upcoming.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <p>
                    {localAppointments.length > 0
                    ? "You don't have any approved upcoming appointments, but you do have unapproved ones pending. Please check 'My Appointments' or wait for admin approval."
                    : "No upcoming appointments. Book one to get started!"}
                </p>
                <button className="btn-primary" onClick={() => setPage("book")}>
                  Book Now
                </button>
              </div>
            ) : upcoming.map(a => (
              <AppointmentCard key={a.id} appt={a} />
            ))}
          </div>
        </div>

        {/* Quick actions + tip */}
        <div>
          <div className="card" style={{ position: "relative" }}>
            <div className="card-title"><span>Quick Actions</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "📅", label: "Book Appointment", sub: "Schedule a new visit",   page: "book" },
                { icon: "📋", label: "My Appointments",  sub: "View dental history",    page: "appointments" },
                { icon: "✨", label: "Services",          sub: "Browse treatments",      page: "services" }
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => a.page && setPage(a.page)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    background: "var(--gray-light)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s, transform 0.12s",
                    width: "100%",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--mint-light)"; e.currentTarget.style.transform = "translateX(3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--gray-light)"; e.currentTarget.style.transform = "translateX(0)"; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: "var(--white)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, flexShrink: 0,
                    boxShadow: "0 1px 6px rgba(30,60,80,0.06)",
                  }}>
                    {a.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: "var(--gray)" }}>{a.sub}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "var(--gray)", opacity: 0.4, fontSize: 16 }}>›</span>
                </button>
              ))}

              <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    background: "var(--gray-light)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s, transform 0.12s",
                    width: "100%",
                    fontFamily: "'Nunito', sans-serif",
                    position: "relative"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--mint-light)"; e.currentTarget.style.transform = "translateX(3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--gray-light)"; e.currentTarget.style.transform = "translateX(0)"; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: "var(--white)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, flexShrink: 0,
                    boxShadow: "0 1px 6px rgba(30,60,80,0.06)",
                    position: "relative"
                  }}>
                    🔔
                    {notifications.length > 0 && (
                      <div style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 8,
                        height: 8,
                        background: "var(--coral, #ff6b6b)",
                        borderRadius: "50%",
                        border: "2px solid var(--white)"
                      }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Notifications</div>
                    <div style={{ fontSize: 11, color: "var(--gray)" }}>System updates</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "white", background: "var(--blue)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold" }}>
                    {notifications.length}
                  </span>
                </button>
                {/* Notifications Popup Dropdown */}
                {showNotifications && (
                    <div style={{
                        position: "absolute",
                        top: "100%",
                        marginTop: 8,
                        right: 0,
                        width: "100%",
                        background: "white",
                        borderRadius: 12,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                        border: "1px solid #f1f5f9",
                        zIndex: 100,
                        maxHeight: 300,
                        overflowY: "auto"
                    }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: "bold", fontSize: 14, color: "var(--navy)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Recent Activity</span>
                            {notifications.length > 0 && (
                                <button 
                                    onClick={handleClearNotifications}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: 16,
                                        color: "var(--gray)",
                                        padding: 4,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "color 0.2s"
                                    }}
                                    title="Clear all notifications"
                                    onMouseEnter={e => e.currentTarget.style.color = "var(--coral, #ff6b6b)"}
                                    onMouseLeave={e => e.currentTarget.style.color = "var(--gray)"}
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{ padding: 24, textAlign: "center", color: "var(--gray)", fontSize: 13 }}>
                                No recent notifications.
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {notifications.map(n => (
                                    <div key={n.id} style={{
                                        padding: "12px 16px",
                                        borderBottom: "1px solid #f1f5f9",
                                        display: "flex",
                                        gap: 12
                                    }}>
                                        <div style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: n.type === "cancelled" ? "var(--coral)" : n.type === "completed" ? "var(--blue)" : "var(--mint)",
                                            marginTop: 6,
                                            flexShrink: 0
                                        }} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 2 }}>{n.title}</div>
                                            <div style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.4 }}>{n.msg}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
          </div>

          <div className="tip">
            <span style={{ fontSize: 22 }}>💡</span>
            <p>
              Brush for 2 minutes, twice a day.
              <small>Your next cleaning is in 9 days.</small>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
