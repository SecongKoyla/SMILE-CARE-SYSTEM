import { useState, useEffect } from "react";
import { getAllUsers } from "../api/api.js";

export default function AdminClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      // Filter out admins if you only want patients, or let's show all and badge them
      setClients(data || []);
    } catch (err) {
      console.error("[AdminClientsPage] Error fetching clients:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get initial for avatar fallback
  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const filteredClients = clients.filter(c => 
    (c.fullName && c.fullName.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="sc-main page-enter"><p>⏳ Loading registered clients...</p></div>;
  }

  if (error) {
    return (
      <div className="sc-main page-enter">
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h2>Unable to Load Clients</h2>
          <p style={{ color: "var(--gray)", marginBottom: "16px" }}>{error}</p>
          <button className="btn-primary" onClick={fetchClients} style={{ minWidth: "120px" }}>
            🔄 Retry Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="sc-main page-enter">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1>Registered Clients</h1>
          <p>View all accounts registered in the SmileCare system</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ position: "relative", width: "260px" }}>
             <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gray)", fontSize: "16px" }}>🔍</span>
             <input
               type="text"
               placeholder="Search names or emails..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               style={{
                 width: "100%",
                 padding: "10px 14px 10px 40px",
                 borderRadius: "12px",
                 border: "1px solid #cbd5e1",
                 background: "#ffffff",
                 outline: "none",
                 fontSize: "14px",
                 color: "var(--navy)",
                 boxShadow: "var(--shadow-sm)",
                 transition: "all 0.2s"
               }}
               onFocus={(e) => { e.target.style.borderColor = "var(--mint)"; e.target.style.boxShadow = "0 0 0 3px var(--mint-light)" }}
               onBlur={(e) => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "var(--shadow-sm)" }}
             />
          </div>
        </div>
      </div>

      <div className="stats" style={{ marginBottom: "24px" }}>
        <div className="stat">
            <div className="stat-icon">👥</div>
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{clients.length}</div>
            </div>
        </div>
        <div className="stat">
            <div className="stat-icon">✅</div>
            <div>
              <div className="stat-label">Active Patients</div>
              <div className="stat-value">{clients.filter(c => c.role === "PATIENT").length}</div>
            </div>
        </div>
        <div className="stat">
            <div className="stat-icon">🛠️</div>
            <div>
              <div className="stat-label">Admin Accounts</div>
              <div className="stat-value">{clients.filter(c => c.role === "ADMIN").length}</div>
            </div>
        </div>
      </div>

      <div className="card" style={{ padding: "0" }}>
        {filteredClients.length === 0 ? (
          <div className="empty-state" style={{ padding: "60px 20px" }}>
            <span className="empty-icon">👥</span>
            <p>No clients found matching your search.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th style={{ padding: "16px 24px", color: "var(--navy)", fontSize: "14px", fontWeight: "700" }}>Client Info</th>
                  <th style={{ padding: "16px 24px", color: "var(--navy)", fontSize: "14px", fontWeight: "700" }}>Email Address</th>
                  <th style={{ padding: "16px 24px", color: "var(--navy)", fontSize: "14px", fontWeight: "700" }}>Role</th>
                  <th style={{ padding: "16px 24px", color: "var(--navy)", fontSize: "14px", fontWeight: "700" }}>User ID</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: "1px solid #e2e8f0" }}>
                {filteredClients.map((client, idx) => (
                  <tr 
                    key={client.id} 
                    style={{ 
                      borderBottom: idx !== filteredClients.length - 1 ? "1px solid #e2e8f0" : "none",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        {client.profilePhotoUrl ? (
                          <img 
                            src={client.profilePhotoUrl} 
                            alt={client.fullName} 
                            style={{ 
                              width: "44px", 
                              height: "44px", 
                              borderRadius: "50%", 
                              objectFit: "cover",
                              border: client.role === "ADMIN" ? "2px solid var(--navy)" : "2px solid #e2e8f0"
                            }} 
                          />
                        ) : (
                          <div style={{ 
                            width: "44px", 
                            height: "44px", 
                            borderRadius: "50%", 
                            background: client.role === "ADMIN" ? "var(--navy)" : "var(--mint)", 
                            color: "#fff", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            fontSize: "16px",
                            fontWeight: "700",
                            border: client.role === "ADMIN" ? "none" : "2px solid var(--mint-light)"
                          }}>
                            {getInitial(client.fullName)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: "700", color: "var(--navy)", fontSize: "15px" }}>{client.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ color: "#475569", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>✉️</span> {client.email}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        background: client.role === "ADMIN" ? "#1e293b" : "var(--mint)",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        letterSpacing: "0.5px"
                      }}>
                        {client.role || "PATIENT"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", color: "var(--gray)", fontSize: "14px" }}>
                      #{client.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}