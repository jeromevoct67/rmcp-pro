import { useState, useCallback } from "react";

// STEP 1: BASIC STRUCTURE - Landing, Admin Login, Simple Assessment Form

function AdminDashboard({ clients, onLogout }) {
  const [viewClient, setViewClient] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const submittedClients = clients.filter(c => c.submitted);

  if (viewClient !== null && submittedClients[viewClient]) {
    const client = submittedClients[viewClient];

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "Arial, sans-serif", padding: "20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: "12px", padding: "24px" }}>
          <button onClick={() => setViewClient(null)} style={{ marginBottom: "20px", padding: "10px 20px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
            ← Back to List
          </button>

          <h2 style={{ marginBottom: "20px" }}>{client.company}</h2>

          <div style={{ marginBottom: "20px", padding: "15px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
            <strong>Contact:</strong> {client.contact}<br />
            <strong>Email:</strong> {client.email}<br />
            <strong>Phone:</strong> {client.phone || "N/A"}
          </div>

          <button
            onClick={async () => {
              setSendingEmail(true);
              try {
                const response = await fetch("https://rmcp-pro.vercel.app/api/send-rmcp", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    clientEmail: client.email,
                    clientName: client.company,
                    rmcpHtml: `<html><body><h1>RMCP for ${client.company}</h1><p>Test document</p></body></html>`,
                    coverLetter: `Dear ${client.contact},\n\nTest email.\n\nBest regards,\nBig Bay Administrators`,
                  }),
                });

                const result = await response.json();
                console.log("Email response:", result);

                if (response.ok) {
                  alert(`✅ Email sent to ${client.email}`);
                } else {
                  alert(`Error: ${result.error || "Failed to send"}`);
                }
              } catch (err) {
                console.error("Email error:", err);
                alert(`Error: ${err.message}`);
              } finally {
                setSendingEmail(false);
              }
            }}
            disabled={sendingEmail}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "8px", 
              border: "none", 
              background: sendingEmail ? "#ccc" : "#3b82f6", 
              color: "#fff", 
              fontWeight: "600", 
              cursor: sendingEmail ? "default" : "pointer", 
              fontSize: "14px" 
            }}
          >
            {sendingEmail ? "⏳ Sending..." : "📧 Send Test Email"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1>Big Bay Administrators - Admin</h1>
          <button onClick={onLogout} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
            Logout
          </button>
        </div>

        {submittedClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "8px" }}>
            <p style={{ color: "#999" }}>No submissions yet</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {submittedClients.map((client, i) => (
              <div
                key={i}
                onClick={() => setViewClient(i)}
                style={{ 
                  padding: "16px", 
                  background: "#fff", 
                  borderRadius: "8px", 
                  border: "1px solid #ddd", 
                  cursor: "pointer" 
                }}
              >
                <div style={{ fontWeight: "bold" }}>{client.company}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{client.contact} • {client.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RMCPManager() {
  const [view, setView] = useState("landing");
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem("rmcp_clients");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeClient, setActiveClient] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const saveClients = useCallback((updated) => {
    setClients(updated);
    localStorage.setItem("rmcp_clients", JSON.stringify(updated));
  }, []);

  console.log("Current view:", view, "showForm:", showForm, "activeClient:", activeClient);

  // LANDING PAGE
  if (view === "landing" && !showForm && !showPasswordPrompt) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #0d1f17 0%, #1a3a2a 40%, #0f2a1e 100%)", color: "#fff", fontFamily: "Arial, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 600, textAlign: "center" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "12px" }}>RMCP Assessment</h1>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", marginBottom: "32px" }}>
            Complete your Risk Management and Compliance Programme assessment
          </p>

          <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
            <button 
              onClick={() => {
                console.log("Start Assessment clicked");
                setShowForm(true);
              }}
              style={{ 
                padding: "14px 24px", 
                borderRadius: "8px", 
                border: "none", 
                background: "#1a9c54", 
                color: "#fff", 
                fontSize: "16px", 
                fontWeight: "600", 
                cursor: "pointer" 
              }}
            >
              Start Assessment →
            </button>
            <button 
              onClick={() => {
                console.log("Admin Login clicked");
                setShowPasswordPrompt(true);
              }}
              style={{ 
                padding: "12px 24px", 
                borderRadius: "8px", 
                border: "1.5px solid rgba(255,255,255,0.3)", 
                background: "transparent", 
                color: "#fff", 
                fontSize: "14px", 
                fontWeight: "600", 
                cursor: "pointer" 
              }}
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN LOGIN
  if (showPasswordPrompt) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxWidth: 400, width: "100%" }}>
          <h2 style={{ marginBottom: "24px" }}>Admin Login</h2>
          <input 
            type="password" 
            placeholder="Enter password" 
            value={adminPassword} 
            onChange={(e) => setAdminPassword(e.target.value)} 
            onKeyPress={(e) => {
              if (e.key === "Enter" && adminPassword === "BigBay2024") {
                setShowPasswordPrompt(false);
                setView("admin");
                setAdminPassword("");
              }
            }}
            style={{ 
              width: "100%", 
              padding: "12px", 
              marginBottom: "16px", 
              borderRadius: "6px", 
              border: "1px solid #ddd", 
              fontSize: "14px", 
              boxSizing: "border-box" 
            }} 
            autoFocus 
          />
          <button 
            onClick={() => {
              if (adminPassword === "BigBay2024") {
                setShowPasswordPrompt(false);
                setView("admin");
                setAdminPassword("");
              } else {
                alert("Incorrect password");
              }
            }}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "6px", 
              border: "none", 
              background: "#1a9c54", 
              color: "#fff", 
              fontWeight: "600", 
              cursor: "pointer", 
              marginBottom: "12px" 
            }}
          >
            Login
          </button>
          <button 
            onClick={() => setShowPasswordPrompt(false)}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "6px", 
              border: "1px solid #ddd", 
              background: "#fff", 
              color: "#666", 
              fontWeight: "600", 
              cursor: "pointer" 
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  if (view === "admin") {
    return <AdminDashboard clients={clients} onLogout={() => setView("landing")} />;
  }

  // CLIENT ENTRY FORM
  if (showForm && activeClient === null) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #0d1f17 0%, #1a3a2a 40%, #0f2a1e 100%)", color: "#fff", fontFamily: "Arial, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 500, width: "100%", background: "#fff", borderRadius: "12px", padding: "40px", color: "#333" }}>
          <h2 style={{ marginBottom: "24px" }}>Create Your Profile</h2>

          <input 
            type="text" 
            placeholder="Company/Firm Name" 
            value={companyName} 
            onChange={(e) => setCompanyName(e.target.value)} 
            style={{ width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", background: "#fff" }} 
          />
          <input 
            type="text" 
            placeholder="Contact Name" 
            value={contactName} 
            onChange={(e) => setContactName(e.target.value)} 
            style={{ width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", background: "#fff" }} 
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", background: "#fff" }} 
          />
          <input 
            type="tel" 
            placeholder="Phone Number" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            style={{ width: "100%", padding: "12px", marginBottom: "24px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", background: "#fff" }} 
          />

          <button 
            onClick={() => {
              if (!companyName || !email) {
                alert("Please enter company name and email");
                return;
              }
              const newClient = { 
                company: companyName, 
                contact: contactName, 
                email, 
                phone, 
                submitted: true,
                data: {} 
              };
              const newClients = [...clients, newClient];
              saveClients(newClients);
              
              // Reset form
              setCompanyName("");
              setContactName("");
              setEmail("");
              setPhone("");
              setShowForm(false);
              
              alert("✓ Submission complete! Jerome will be in touch.");
            }}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "6px", 
              border: "none", 
              background: "#1a9c54", 
              color: "#fff", 
              fontWeight: "600", 
              cursor: "pointer", 
              fontSize: "14px", 
              marginBottom: "12px" 
            }}
          >
            Submit
          </button>
          <button 
            onClick={() => setShowForm(false)}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "6px", 
              border: "1px solid #ddd", 
              background: "#fff", 
              color: "#666", 
              fontWeight: "600", 
              cursor: "pointer", 
              fontSize: "14px" 
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
