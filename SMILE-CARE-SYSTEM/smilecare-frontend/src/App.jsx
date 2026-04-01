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
import ProfilePage      from "./pages/ProfilePage.jsx";

// Pages — admin
import AdminServicesPage from "./pages/AdminServicePage.jsx";
import AdminApptsPage    from "./pages/AdminApptsPage.jsx";
import AdminAvailabilityPage from "./pages/AdminAvailabilityPage.jsx";

// API
import { getServices, getUserAppointments } from "./api/api.js";

// Seed data
import { INITIAL_SERVICES, INITIAL_APPOINTMENTS } from "./data/constants.js";

function normalizeUserPayload(rawUser) {
  const candidate = rawUser?.user ?? rawUser;

  if (!candidate) return null;

  const resolvedName = (candidate.name ?? candidate.fullName ?? "").trim();
  const resolvedRole = String(candidate.role ?? "PATIENT").toUpperCase();
  const resolvedPhoto = candidate.profilePhotoUrl ?? candidate.profile_photo_url ?? null;

  return {
    ...candidate,
    name: resolvedName || "User",
    role: resolvedRole === "ADMIN" ? "ADMIN" : "PATIENT",
    profilePhotoUrl: resolvedPhoto,
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
  const [profileTab, setProfileTab] = useState("info");


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
  // FETCH SERVICES FROM BACKEND ON MOUNT
  // ─────────────────────────────────────────────
  useEffect(() => {
    const fetchServicesFromBackend = async () => {
      try {
        console.log("🔄 Fetching services from backend...");
        const backendServices = await getServices();
        console.log("✅ Services received:", backendServices);
        console.log("📊 Service count:", backendServices?.length || 0);
        
        if (backendServices && backendServices.length > 0) {
          console.log("✓ Setting services from backend");
          setServices(backendServices);
        } else {
          console.warn("⚠️ No services from backend, using defaults");
        }
      } catch (err) {
        console.error("❌ Failed to fetch services from backend:", err);
        // Keep using localStorage saved services or INITIAL_SERVICES
      }
    };
    
    fetchServicesFromBackend();
  }, []);


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

  const handleOpenProfileTab = (tab = "info") => {
    setProfileTab(tab);
  };


  // ─────────────────────────────────────────────
  // BOOK APPOINTMENT
  // ─────────────────────────────────────────────
  const handleBook = async ({ type, time }) => {
    // Fetch updated appointments for the user from backend
    if (user?.id) {
      try {
        const userAppts = await getUserAppointments(user.id);
        
        // Map backend appointments to display format
        const statusMap = {
          "APPROVED": "confirmed",
          "PENDING": "pending",
          "CANCELLED": "cancelled",
          "ARRIVED": "confirmed",
          "COMPLETED": "confirmed"
        };

        const transformed = userAppts.map(appt => ({
          id: appt.id,
          day: new Date(appt.timeSlot.date).getDate().toString().padStart(2, '0'),
          month: new Date(appt.timeSlot.date).toLocaleString('default', { month: 'short' }),
          type: appt.service.name,
          doctor: "Dr. Rivera",
          time: appt.timeSlot.startTime,
          status: statusMap[appt.status] || appt.status.toLowerCase(),
          patient: user.name
        }));

        setAppointments(transformed);
      } catch (err) {
        console.error("Error fetching appointments after booking:", err);
        // Fallback: add a local appointment
        const newAppt = {
          id: Date.now(),
          day: new Date().getDate().toString().padStart(2, '0'),
          month: new Date().toLocaleString('default', { month: 'short' }),
          type,
          doctor: "Dr. Rivera",
          time,
          status: "pending",
          patient: user?.name ?? "Patient",
        };
        setAppointments(prev => [newAppt, ...prev]);
      }
    }
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
                user={user}
                setPage={setPage}
            />
        );

      case "book":
        return (
            <BookPage
                services={services}
                user={user}
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

        case "profile":
        return (
          <ProfilePage
            user={user}
            setUser={setUser}
            initialTab={profileTab}
            onBack={() => setPage(user?.role === "ADMIN" ? "admin-services" : "home")}
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
            <AdminApptsPage />
        );

      case "admin-availability":
        return (
            <AdminAvailabilityPage />
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
          onOpenProfileTab={handleOpenProfileTab}
        />

        {renderPage()}

      </div>
  );
}
