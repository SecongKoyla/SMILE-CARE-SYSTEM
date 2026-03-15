// App.jsx — Root: auth state, shared state, router
import { useState } from "react";

// Styles (import order matters)
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/navbar.css";
import "./styles/appointments.css";
import "./styles/services.css";
import "./styles/pages.css";

// Components
import Navbar from "./components/Navbar.jsx";

// Pages — patient
import LoginPage        from "./pages/Login.jsx";
import RegisterPage     from "./pages/Register.jsx";
import HomePage         from "./pages/HomePage.jsx";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import BookPage         from "./pages/BookPage.jsx";
import ServicesPage     from "./pages/ServicesPage.jsx";

// Pages — admin
import AdminServicesPage from "./pages/AdminServicePage.jsx";
import AdminApptsPage    from "./pages/AdminApptsPage.jsx";

// Seed data
import { INITIAL_SERVICES, INITIAL_APPOINTMENTS } from "./data/constants.js";

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user,    setUser]    = useState(null);
  const [page,    setPage]    = useState("home");
  const [showRegister, setShowRegister] = useState(false);

  // ── Shared state (lifted so admin + patient both see the same data) ───────
  const [services,     setServices]     = useState(INITIAL_SERVICES);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogin = (u) => {
    setUser(u);
    setPage(u.role === "ADMIN" ? "admin-services" : "home");
  };

  const handleRegister = (u) => {
    setUser(u);
    setPage(u.role === "ADMIN" ? "admin-services" : "home");
  };

  const handleLogout = () => {
    setUser(null);
    setPage("home");
  };

  const handleBook = ({ type, time }) => {
    const newAppt = {
      id: Date.now(),
      day: "20", month: "Mar",   // demo date
      type,
      doctor: "Dr. Rivera",
      time,
      status: "confirmed",
      patient: user?.fullName ?? "Patient",
    };
    setAppointments(prev => [newAppt, ...prev]);
  };

  // ── Login wall ────────────────────────────────────────────────────────────
  if (!user) {
    return showRegister 
      ? <RegisterPage 
          onRegister={handleRegister} 
          onSwitchToLogin={() => setShowRegister(false)} 
        />
      : <LoginPage 
          onLogin={handleLogin} 
          onSwitchToRegister={() => setShowRegister(true)} 
        />;
  }

  // ── Page router ───────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      // Patient routes
      case "home":
        return <HomePage user={user} appointments={appointments} setPage={setPage} />;
      case "appointments":
        return <AppointmentsPage appointments={appointments} setPage={setPage} />;
      case "book":
        return <BookPage services={services} setPage={setPage} onBook={handleBook} />;
      case "services":
        return <ServicesPage services={services} setPage={setPage} />;

      // Admin routes
      case "admin-services":
        return <AdminServicesPage services={services} setServices={setServices} />;
      case "admin-appts":
        return <AdminApptsPage appointments={appointments} />;

      default:
        return <HomePage user={user} appointments={appointments} setPage={setPage} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-light)" }}>
      <Navbar
        currentPage={page}
        setPage={setPage}
        user={user}
        onLogout={handleLogout}
      />
      {renderPage()}
    </div>
  );
}