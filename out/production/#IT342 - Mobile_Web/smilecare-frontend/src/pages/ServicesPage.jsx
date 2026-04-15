// pages/ServicesPage.jsx
import ServiceCard from "../components/ServiceCard.jsx";

export default function ServicesPage({ services, setPage }) {
  const handleBook = () => {
    setPage("book");
  };

  return (
    <main className="sc-main page-enter">
      <div className="page-header">
        <h1>Our Services</h1>
        <p>Comprehensive dental care for the whole family</p>
      </div>

      {services.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">✨</span>
            <p>No services available yet.<br />Please check back soon.</p>
          </div>
        </div>
      ) : (
        <div className="services-grid">
          {services.map(s => (
            <ServiceCard key={s.id} service={s} onBook={handleBook} />
          ))}
        </div>
      )}
    </main>
  );
}