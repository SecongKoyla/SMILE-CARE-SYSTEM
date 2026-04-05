// ─── Navigation items per role ───────────────────────────────────────────────
export const PATIENT_NAV = [
  { id: "home",         label: "Home",             icon: "🏠" },
  { id: "appointments", label: "My Appointments",  icon: "📅" },
  { id: "book",         label: "Book Appointment", icon: "➕" },
  { id: "services",     label: "Services",         icon: "✨" },
];

export const ADMIN_NAV = [
  { id: "admin-appts",        label: "All Appointments",     icon: "📋" },
  { id: "admin-services",     label: "Manage Services",      icon: "🛠️" },
  { id: "admin-availability", label: "Clinic Availability",  icon: "📅" },
  { id: "admin-clients",      label: "Registered Clients",   icon: "👥" },
];

// ─── Demo users ──────────────────────────────────────────────────────────────
export const USERS = {
  patient: { name: "Jane Smith",  initials: "J",  role: "patient", email: "jane@email.com" },
  admin:   { name: "Dr. Rivera",  initials: "R",  role: "admin",   email: "admin@smilecare.com" },
};

// ─── Appointments seed data ───────────────────────────────────────────────────
export const INITIAL_APPOINTMENTS = [
  { id: 1, day: "14", month: "Mar", type: "Teeth Cleaning",   doctor: "Dr. Rivera", time: "9:00 AM",  status: "confirmed", patient: "Jane Smith" },
  { id: 2, day: "28", month: "Mar", type: "Orthodontic Check",doctor: "Dr. Santos", time: "2:30 PM",  status: "confirmed", patient: "Jane Smith" },
  { id: 3, day: "02", month: "Feb", type: "Cavity Filling",   doctor: "Dr. Rivera", time: "11:00 AM", status: "cancelled", patient: "Jane Smith" },
  { id: 4, day: "10", month: "Jan", type: "Routine Checkup",  doctor: "Dr. Cruz",   time: "3:00 PM",  status: "confirmed", patient: "Mark Lee"   },
  { id: 5, day: "05", month: "Mar", type: "Teeth Whitening",  doctor: "Dr. Rivera", time: "10:00 AM", status: "pending",   patient: "Ana Torres"  },
];

// ─── Services seed data ───────────────────────────────────────────────────────
export const INITIAL_SERVICES = [
  { id: 1, icon: "🪥", name: "Teeth Cleaning",   desc: "Professional cleaning to remove plaque, tartar, and surface stains for a healthy, bright smile.", price: "₱800",    duration: "45 min" },
  { id: 2, icon: "🦷", name: "Cavity Filling",   desc: "Restore decayed teeth with tooth-colored composite fillings for a natural look and feel.",        price: "₱1,500",  duration: "60 min" },
  { id: 3, icon: "🦴", name: "Orthodontics",      desc: "Straighten teeth and correct bite issues with braces or clear aligner treatments.",               price: "₱35,000", duration: "Ongoing"},
  { id: 4, icon: "💎", name: "Teeth Whitening",  desc: "Professional-grade whitening for a noticeably brighter smile in just one session.",               price: "₱3,000",  duration: "90 min" },
  { id: 5, icon: "🔬", name: "Dental X-Ray",     desc: "Digital X-ray imaging for accurate diagnosis of cavities, bone loss, and hidden dental issues.",   price: "₱400",    duration: "20 min" },
  { id: 6, icon: "🛡️", name: "Root Canal",       desc: "Remove infected pulp and save your natural tooth with our gentle root canal treatment.",          price: "₱8,000",  duration: "90 min" },
];

// ─── Icon options for the service form ───────────────────────────────────────
export const ICON_OPTIONS = ["🪥","🦷","🦴","💎","🔬","🛡️","💊","🩺","🧴","🏥","✨","❤️"];

// ─── Time slots ───────────────────────────────────────────────────────────────
export const TIME_SLOTS = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"];