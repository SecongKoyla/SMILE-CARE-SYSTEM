// App.jsx — Root: auth state, shared state, simple router
import { useState, useEffect } from "react";

// Styles
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

function normalizeUserPayload(rawUser) {
  const candidate = rawUser?.user ?? rawUser;

  if (!candidate) return null;

  const resolvedName = (candidate.name ?? candidate.fullName ?? "").trim();
  const resolvedRole = String(candidate.role ?? "PATIENT").toUpperCase();

  return {
    ...candidate,
    name: resolvedName || "User",
    role: resolvedRole === "ADMIN" ? "ADMIN" : "PATIENT",
  };
}

function getPersistedUser() {
  const savedUser = localStorage.getItem("user");
  if (!savedUser) return null;

  try {
    return normalizeUserPayload(JSON.parse(savedUser));
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export default function App() {

  // ─────────────────────────────────────────────
  // AUTH STATE
  // ─────────────────────────────────────────────
  const [user, setUser] = useState(() => getPersistedUser());

  // Router page
  const [page, setPage] = useState(() => {
    const persistedUser = getPersistedUser();
    return persistedUser?.role === "ADMIN" ? "admin-services" : "home";
  });

  const [showRegister, setShowRegister] = useState(false);


  // ─────────────────────────────────────────────
  // PERSISTED STATE (services + appointments)
  // ─────────────────────────────────────────────
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem("services");
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem("appointments");
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  // ─────────────────────────────────────────────
  // SAVE DATA TO LOCAL STORAGE
  // ─────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("services", JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem("appointments", JSON.stringify(appointments));
  }, [appointments]);


  // ─────────────────────────────────────────────
  // AUTH HANDLERS
  // ─────────────────────────────────────────────
  const handleLogin = (u) => {
    const normalizedUser = normalizeUserPayload(u);

    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setPage(
        normalizedUser?.role === "ADMIN"
            ? "admin-services"
            : "home"
    );
  };


  const handleRegister = (u) => {
    const normalizedUser = normalizeUserPayload(u);

    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setPage(
        normalizedUser?.role === "ADMIN"
            ? "admin-services"
            : "home"
    );
  };


  const handleLogout = () => {

    setUser(null);

    localStorage.removeItem("user");

    setPage("home");
  };


  // ─────────────────────────────────────────────
  // BOOK APPOINTMENT
  // ─────────────────────────────────────────────
  const handleBook = ({ type, time }) => {

    const newAppt = {

      id: Date.now(),

      day: "20",
      month: "Mar",

      type,
      doctor: "Dr. Rivera",
      time,

      status: "confirmed",

      patient: user?.name ?? "Patient",

    };

    setAppointments(prev => [newAppt, ...prev]);
  };


  // ─────────────────────────────────────────────
  // LOGIN WALL
  // ─────────────────────────────────────────────
  if (!user) {

    return showRegister
        ? (
            <RegisterPage
                onRegister={handleRegister}
                onSwitchToLogin={() => setShowRegister(false)}
            />
        )
        : (
            <LoginPage
                onLogin={handleLogin}
                onSwitchToRegister={() => setShowRegister(true)}
            />
        );
  }


  // ─────────────────────────────────────────────
  // PAGE ROUTER
  // ─────────────────────────────────────────────
  const renderPage = () => {

    switch (page) {

        // PATIENT
      case "home":
        return (
            <HomePage
                user={user}
                appointments={appointments}
                setPage={setPage}
            />
        );

      case "appointments":
        return (
            <AppointmentsPage
                appointments={appointments}
                setPage={setPage}
            />
        );

      case "book":
        return (
            <BookPage
                services={services}
                setPage={setPage}
                onBook={handleBook}
            />
        );

      case "services":
        return (
            <ServicesPage
                services={services}
                setPage={setPage}
            />
        );


        // ADMIN
      case "admin-services":
        return (
            <AdminServicesPage
                services={services}
                setServices={setServices}
            />
        );

      case "admin-appts":
        return (
            <AdminApptsPage
                appointments={appointments}
            />
        );


      default:
        return (
            <HomePage
                user={user}
                appointments={appointments}
                setPage={setPage}
            />
        );
    }
  };


  // ─────────────────────────────────────────────
  // APP LAYOUT
  // ─────────────────────────────────────────────
  return (

      <div style={{
        minHeight: "100vh",
        background: "var(--gray-light)"
      }}>

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
