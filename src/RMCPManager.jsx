import { useState } from "react";

export default function RMCPManager() {
  const [view, setView] = useState("landing");

  console.log("App loaded, current view:", view);

  if (view === "landing") {
    return (
      <div style={{ minHeight: "100vh", background: "#1a3a2a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 600, padding: "40px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>RMCP Assessment Tool</h1>
          <p style={{ marginBottom: "30px" }}>Test Version - Checking Deployment</p>
          
          <button 
            onClick={() => {
              console.log("Start button clicked!");
              alert("Button works! View changing to test...");
              setView("test");
            }}
            style={{ 
              padding: "15px 30px", 
              fontSize: "16px", 
              background: "#2ecc71", 
              color: "#fff", 
              border: "none", 
              borderRadius: "8px", 
              cursor: "pointer",
              marginBottom: "10px"
            }}
          >
            🟢 Test Button - Click Me
          </button>
          
          <div style={{ marginTop: "20px", fontSize: "12px", color: "#aaa" }}>
            If this button works, the app is deployed correctly.
          </div>
        </div>
      </div>
    );
  }

  if (view === "test") {
    return (
      <div style={{ minHeight: "100vh", background: "#2ecc71", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>✅ SUCCESS!</h1>
          <p style={{ fontSize: "20px", marginBottom: "30px" }}>The button worked and state changed.</p>
          <button 
            onClick={() => setView("landing")}
            style={{ 
              padding: "15px 30px", 
              fontSize: "16px", 
              background: "#fff", 
              color: "#2ecc71", 
              border: "none", 
              borderRadius: "8px", 
              cursor: "pointer" 
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
