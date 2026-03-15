// pages/HomePage.jsx
import AppointmentCard from "../components/AppointmentCard.jsx";

export default function HomePage({ user, appointments, setPage }) {
  const upcoming = appointments
    .filter(a => a.status === "confirmed")
    .slice(0, 2);

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
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 500,
            color: "white",
            marginBottom: 6,
          }}>
            Good morning, <em style={{ fontStyle: "italic", color: "var(--mint)" }}>{user.fullName?.split(" ")[0] || "User"}!</em>
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            You have {upcoming.length} upcoming appointment{upcoming.length !== 1 ? "s" : ""} this month.
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ whiteSpace: "nowrap", position: "relative", zIndex: 1 }}
          onClick={() => setPage("book")}
        >
          + Book Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="stats">
        {[
          { icon: "📅", label: "Next Visit",       value: upcoming[0] ? `${upcoming[0].month} ${upcoming[0].day}` : "—" },
          { icon: "✅", label: "Visits This Year",  value: appointments.filter(a => a.status === "confirmed").length },
          { icon: "🌟", label: "Smile Score",       value: "98%" },
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
                <p>No upcoming appointments.<br />Book one to get started!</p>
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
          <div className="card">
            <div className="card-title"><span>Quick Actions</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "📅", label: "Book Appointment", sub: "Schedule a new visit",   page: "book" },
                { icon: "📋", label: "My Appointments",  sub: "View dental history",    page: "appointments" },
                { icon: "✨", label: "Services",          sub: "Browse treatments",      page: "services" },
                { icon: "💬", label: "Message Doctor",   sub: "Send a quick note",      page: null },
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