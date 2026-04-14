// components/ServiceCard.jsx
// Reusable card for the patient-facing Services page

export default function ServiceCard({ service, onBook }) {
  return (
    <div className="service-card">
      <div className="service-card-icon">{service.icon}</div>
      <div className="service-card-name">{service.name}</div>
      <div className="service-card-desc" style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px", marginBottom: "12px", minHeight: "40px" }}>
        {service.description || service.desc || "No description available."}
      </div>
      <div className="service-card-footer">
        <div className="service-card-meta">
          <div className="service-card-price" style={{ fontWeight: "600", color: "#111827" }}>₱{service.price}</div>
          <div className="service-card-dur" style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
            ⏱ {service.duration_unit === 'hours' ? `${service.duration_minutes / 60} hr${service.duration_minutes / 60 !== 1 ? 's' : ''}` : `${service.duration_minutes || service.duration} min`}
          </div>
        </div>
        <button className="service-book-btn" onClick={() => onBook(service)}>
          Book Now →
        </button>
      </div>
    </div>
  );
}