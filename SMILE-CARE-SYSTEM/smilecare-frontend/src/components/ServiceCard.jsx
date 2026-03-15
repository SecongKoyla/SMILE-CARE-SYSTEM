// components/ServiceCard.jsx
// Reusable card for the patient-facing Services page

export default function ServiceCard({ service, onBook }) {
  return (
    <div className="service-card">
      <div className="service-card-icon">{service.icon}</div>
      <div className="service-card-name">{service.name}</div>
      <div className="service-card-desc">{service.desc}</div>
      <div className="service-card-footer">
        <div className="service-card-meta">
          <div className="service-card-price">{service.price}</div>
          <div className="service-card-dur">⏱ {service.duration}</div>
        </div>
        <button className="service-book-btn" onClick={() => onBook(service)}>
          Book Now →
        </button>
      </div>
    </div>
  );
}