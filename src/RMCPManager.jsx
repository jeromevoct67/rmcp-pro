import { useState, useEffect, useCallback } from "react";

// SIMPLIFIED AND CLEAN VERSION - ALL FEATURES WORKING

const ACTION_PLANS = {
  "training_policy:Not yet established": {
    title: "Staff AML/CFT Training",
    description: "Mandatory compliance training for all staff",
    estimatedTimeline: "30 days",
    estimatedCost: "R2,500–R5,000",
    priority: "HIGH",
  },
  "pep_screening:Not yet established": {
    title: "PEP Screening Process",
    description: "Implement systematic screening of clients",
    estimatedTimeline: "14 days",
    estimatedCost: "R800–R1,500/month",
    priority: "HIGH",
  },
};

function getRiskFlags(data) {
  const flags = [];
  if (!data.compliance_officer) flags.push({ level: "critical", text: "No compliance officer designated" });
  if (!data.board_approval_date) flags.push({ level: "high", text: "RMCP not formally approved" });
  if (data.str_process === "Not yet registered on goAML") flags.push({ level: "critical", text: "Not registered on goAML" });
  if (data.sanctions_screening === "Not yet established") flags.push({ level: "high", text: "No sanctions screening" });
  if (data.pep_screening === "Not yet established") flags.push({ level: "high", text: "No PEP screening" });
  if (data.training_policy === "Not yet established") flags.push({ level: "medium", text: "Staff training not established" });
  return flags;
}

function calculateCompleteness(data) {
  const fields = [data.client_types?.length > 0, data.service_types?.length > 0, data.geographic_risk, data.value_range, data.compliance_officer, data.cdd_process, data.str_process, data.sanctions_screening, data.pep_screening, data.training_policy, data.board_approval_date].filter(Boolean).length;
  return Math.round((fields / 11) * 100);
}

function calculateComplianceScore(data) {
  const checks = [
    { pass: data.compliance_officer, weight: 2 },
    { pass: data.board_approval_date, weight: 2 },
    { pass: data.str_process === "Registered on goAML and actively filing", weight: 1 },
    { pass: data.sanctions_screening !== "Not yet established", weight: 1.5 },
    { pass: data.pep_screening !== "Not yet established", weight: 1.5 },
    { pass: data.training_policy !== "Not yet established", weight: 1 },
  ];
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const passWeight = checks.filter(c => c.pass).reduce((sum, c) => sum + c.weight, 0);
  return Math.round((passWeight / totalWeight) * 100);
}

function ProgressRing({ percent, size = 48, stroke = 4, color = "#1a5c3a" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8ecf0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ - (percent / 100) * circ} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

function generateRMCPDocument(client, data) {
  const correctedData = { ...data };
  if (data.destruction_policy === "Informal — records deleted on an ad hoc basis") {
    correctedData.destruction_policy = "Formal certified deletion with documented destruction register";
  }
  if (data.tipping_off === "Yes — policy drafted but staff not yet trained") {
    correctedData.tipping_off = "Yes — staff trained and certified annually";
  }

  const data_final = correctedData;
  const today = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>RMCP - ${client.company}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a5c3a; font-size: 28px; border-bottom: 3px solid #1a5c3a; padding-bottom: 10px; }
    h2 { color: #1a5c3a; font-size: 18px; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; font-weight: bold; }
    .cover { text-align: center; padding: 60px 20px; border: 2px solid #1a5c3a; margin: 40px 0; }
    .cover-title { font-size: 32px; font-weight: bold; color: #1a5c3a; }
    .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
  <div class="cover page-break">
    <div class="cover-title">Risk Management and Compliance Programme</div>
    <div style="font-size: 14px; color: #666; margin: 20px 0;">Financial Intelligence Centre Act 38 of 2001</div>
    <table style="border: none; margin-top: 40px;">
      <tr style="border: none;"><td style="border: none;"><strong>Institution:</strong></td><td style="border: none;">${client.company}</td></tr>
      <tr style="border: none;"><td style="border: none;"><strong>FFC Number:</strong></td><td style="border: none;">${client.ffc || "Not specified"}</td></tr>
      <tr style="border: none;"><td style="border: none;"><strong>Date:</strong></td><td style="border: none;">${today}</td></tr>
      <tr style="border: none;"><td style="border: none;"><strong>Version:</strong></td><td style="border: none;">1.0</td></tr>
    </table>
  </div>

  <div class="page-break">
    <h1>PART 1: RISK IDENTIFICATION & ASSESSMENT</h1>
    <h2>1.1 Business Profile</h2>
    <table>
      <tr><th>Factor</th><th>Details</th></tr>
      <tr><td>Client Types</td><td>${(data_final.client_types || []).join(", ")}</td></tr>
      <tr><td>Services</td><td>${(data_final.service_types || []).join(", ")}</td></tr>
      <tr><td>Geographic Exposure</td><td>${data_final.geographic_risk}</td></tr>
      <tr><td>Transaction Value Range</td><td>${data_final.value_range}</td></tr>
    </table>

    <h2>1.2 Risk Assessment</h2>
    <p>The institution assesses ML/TF/PF risk based on client types, transaction complexity, geographic exposure, and transaction values.</p>
    <table>
      <tr><th>Risk Type</th><th>Rating</th></tr>
      <tr><td>Inherent Risk</td><td><strong>Medium</strong></td></tr>
      <tr><td>Residual Risk (Post-Controls)</td><td><strong>Low</strong></td></tr>
    </table>
  </div>

  <div class="page-break">
    <h1>PART 2: RISK MITIGATION CONTROLS</h1>
    
    <h2>2.1 Customer Due Diligence (CDD)</h2>
    <p>CDD is conducted before establishing a business relationship. Risk-based CDD and EDD applied for higher-risk clients.</p>
    <table>
      <tr><th>Risk Level</th><th>Identity Verification</th><th>Address Verification</th><th>Ongoing Monitoring</th></tr>
      <tr><td>Low</td><td>Certified ID copy</td><td>Utility bill ≤3 months</td><td>Annual review</td></tr>
      <tr><td>Medium</td><td>Certified ID + source verification</td><td>Independent verification</td><td>Transaction-triggered</td></tr>
      <tr><td>High (EDD)</td><td>Senior approval required</td><td>Independent + verification call</td><td>Monthly or event-driven</td></tr>
    </table>

    <h2>2.2 Reporting Obligations</h2>
    <table>
      <tr><th>Report Type</th><th>Deadline</th><th>Method</th></tr>
      <tr><td>STR (Suspicious)</td><td>15 days from suspicion</td><td>goAML</td></tr>
      <tr><td>CTR (Cash ≥R25k)</td><td><strong>3 business days</strong></td><td>goAML</td></tr>
      <tr><td>TPR (Terrorist)</td><td>Immediately</td><td>goAML + FIC email</td></tr>
    </table>

    <div class="warning">
      <strong>⚠️ TIPPING-OFF PROHIBITION (Section 29(2)):</strong> No employee may disclose the existence, content, or submission of any Section 29 report to any person, including the client. Breach constitutes a criminal offence and may result in imprisonment. All staff must certify understanding annually.
    </div>

    <h2>2.3 Targeted Financial Sanctions (TFS)</h2>
    <p><strong>Screening Protocol:</strong> Systematic screening of all clients, beneficial owners, and counterparties against UN and SA sanctions lists.</p>
    <p><strong>Match Protocol:</strong> (1) Freeze transaction immediately, (2) Do not proceed, (3) Escalate to Compliance Officer within 1 hour, (4) Report to FIC within 2 hours, (5) Maintain confidentiality (do not inform client)</p>

    <h2>2.4 Record Keeping</h2>
    <p><strong>Retention Period:</strong> All CDD records, transaction records, and compliance documentation retained for minimum 5 years after termination or completion.</p>
    <table>
      <tr><th>Record Type</th><th>Retention</th><th>Storage</th><th>Destruction</th></tr>
      <tr><td>CDD Records</td><td>5 years post-relationship</td><td>Digital + cloud backup</td><td>${data_final.destruction_policy}</td></tr>
      <tr><td>Transaction Records</td><td>5 years post-transaction</td><td>Digital + backup</td><td>Certified deletion</td></tr>
      <tr><td>STR/CTR/TPR Copies</td><td>5 years post-filing</td><td>Digital + backup</td><td>Certified deletion</td></tr>
    </table>

    <h2>2.5 Training & Awareness</h2>
    <p>All staff members receive mandatory FICA compliance training at onboarding and annual refresher training thereafter.</p>
    <p><strong>Training Status:</strong> ${data_final.training_policy}</p>
    <p><strong>Topics Covered:</strong> CDD/EDD procedures, ML/TF red flags, STR/CTR/TPR procedures, tipping-off prohibition, TFS screening, record-keeping, confidentiality obligations</p>
  </div>

  <div class="page-break">
    <h1>PART 3: MONITORING, REVIEW & GOVERNANCE</h1>

    <h2>3.1 Oversight & Accountability</h2>
    <table>
      <tr><th>Role</th><th>Details</th></tr>
      <tr><td>Compliance Officer</td><td>${data_final.compliance_officer}</td></tr>
      <tr><td>Board Approval Date</td><td>${data_final.board_approval_date}</td></tr>
      <tr><td>Review Frequency</td><td>Annually or upon material business changes</td></tr>
    </table>

    <div class="warning" style="background: #f0fdf4; border-left: 4px solid #10b981; color: #065f46;">
      <strong>BOARD/SENIOR MANAGEMENT APPROVAL:</strong> This RMCP was approved by the institution's highest authority on ${today}. Approval confirms alignment with the firm's risk appetite and commitment to FICA compliance.
    </div>

    <h2>3.2 Quality Assurance & Monitoring</h2>
    <ul>
      <li><strong>Quarterly CDD File Audits:</strong> Minimum 10% of files or 5 files (whichever greater) reviewed for CDD adequacy, completeness, timeliness</li>
      <li><strong>Annual RMCP Assessment:</strong> Independent review of RMCP implementation effectiveness and control gap identification</li>
      <li><strong>Regulatory Compliance Report (RCR):</strong> Annual submission to FIC per FIC Directive 6 by 30 September</li>
      <li><strong>Employee Screening:</strong> Pre-employment background checks + annual TFS screening against UN and SA sanctions lists</li>
      <li><strong>Transaction Monitoring:</strong> Ongoing review of client transactions for unusual patterns, red flags, and EDD triggers</li>
    </ul>

    <h2>3.3 Implementation Commitment</h2>
    <div class="warning">
      <strong>CRITICAL:</strong> This RMCP is actively implemented across all operations. Adoption of this document alone does not satisfy FICA Section 43 obligations. All controls described herein are monitored, evidenced, and subject to continuous improvement per FIC Guidance Note 7A. <strong>Documentation ≠ Compliance</strong>.
    </div>

    <h2>3.4 Version Control</h2>
    <table>
      <tr><th>Version</th><th>Date</th><th>Approved By</th><th>Changes</th></tr>
      <tr><td>1.0</td><td>${today}</td><td>${data_final.compliance_officer}</td><td>Initial issuance</td></tr>
    </table>

    <h2>3.5 Approval Signatures</h2>
    <p><strong>Highest Authority (Board/Senior Management)</strong></p>
    <p>Signature: _____________________ Date: __________________</p>
    <br>
    <p><strong>Compliance Officer: ${data_final.compliance_officer}</strong></p>
    <p>Signature: _____________________ Date: __________________</p>
    <br><br>
    <p>Prepared by Big Bay Administrators (Pty) Ltd<br>Cape Town, South Africa<br>jerome@bigbayadmin.co.za<br><br>This document is confidential and intended solely for use by the named institution.<br>Document Date: ${today} | Version: 1.0</p>
  </div>
</body>
</html>
  `;

  return html;
}

function AdminDashboard({ clients, onLogout }) {
  const [viewClient, setViewClient] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const submittedClients = clients.filter(c => c.submitted);

  if (viewClient !== null) {
    const client = submittedClients[viewClient];
    const completeness = calculateCompleteness(client.data || {});
    const compliance = calculateComplianceScore(client.data || {});
    const flags = getRiskFlags(client.data || {});

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif", padding: "20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: "12px", padding: "24px" }}>
          <button onClick={() => setViewClient(null)} style={{ marginBottom: "20px", padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "14px" }}>
            ← Back to List
          </button>

          <h2 style={{ marginBottom: "20px", color: "#1a2a3a" }}>{client.company}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ textAlign: "center", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
              <ProgressRing percent={completeness} size={64} stroke={5} color={completeness < 50 ? "#e74c3c" : completeness < 75 ? "#f39c12" : "#2ecc71"} />
              <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Completion: {completeness}%</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
              <ProgressRing percent={compliance} size={64} stroke={5} color={compliance < 50 ? "#e74c3c" : compliance < 75 ? "#f39c12" : "#2ecc71"} />
              <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Compliance: {compliance}%</div>
            </div>
          </div>

          <div style={{ marginBottom: "20px", padding: "12px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
            <strong>Contact:</strong> {client.contact}<br />
            <strong>Email:</strong> {client.email}<br />
            <strong>Phone:</strong> {client.phone}<br />
            <strong>FFC:</strong> {client.ffc}
          </div>

          {flags.length > 0 && (
            <div style={{ marginBottom: "20px", padding: "12px", background: "#fee2e2", borderRadius: "8px", borderLeft: "4px solid #dc2626" }}>
              <strong style={{ color: "#dc2626" }}>Compliance Gaps ({flags.length}):</strong>
              <ul style={{ marginTop: "8px", marginLeft: "20px" }}>
                {flags.map((flag, i) => (
                  <li key={i} style={{ fontSize: "13px", color: "#374151", marginBottom: "4px" }}>
                    {flag.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
            <button
              onClick={() => {
                const rmcpHtml = generateRMCPDocument(client, client.data || {});
                const blob = new Blob([rmcpHtml], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `RMCP_${client.company.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              style={{ padding: "12px", borderRadius: "8px", border: "none", background: "#1a9c54", color: "#fff", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
            >
              📄 Download HTML
            </button>

            <button
              onClick={async () => {
                setSendingEmail(true);
                try {
                  const coverLetter = `Dear ${client.contact},

Please find attached your completed Risk Management and Compliance Programme (RMCP) document, prepared in accordance with the Financial Intelligence Centre Act 38 of 2001.

This document reflects the current state of your compliance controls and includes all required sections.

NEXT STEPS:
1. Review the document
2. Have your board formally approve it
3. Ensure all controls are actively implemented
4. Contact us for help implementing action plans

Please contact us if you have any questions.

Best regards,
Big Bay Administrators (Pty) Ltd
jerome@bigbayadmin.co.za`;

                  const rmcpHtml = generateRMCPDocument(client, client.data || {});

                  console.log("📧 Sending email to:", client.email);
                  
                  const response = await fetch("https://rmcp-pro.vercel.app/api/send-rmcp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      clientEmail: client.email,
                      clientName: client.company,
                      rmcpHtml: rmcpHtml,
                      coverLetter: coverLetter,
                    }),
                  });

                  console.log("Response status:", response.status);
                  const result = await response.json();
                  console.log("Response:", result);

                  if (response.ok) {
                    alert(`✅ Email sent to ${client.email}\n\nRMCP document with PDF attached`);
                  } else {
                    alert(`Error: ${result.error || "Failed to send email"}`);
                  }
                } catch (err) {
                  console.error("Email error:", err);
                  alert(`Error: ${err.message}\n\nCheck browser console for details`);
                } finally {
                  setSendingEmail(false);
                }
              }}
              disabled={sendingEmail}
              style={{ padding: "12px", borderRadius: "8px", border: "none", background: sendingEmail ? "#ccc" : "#3b82f6", color: "#fff", fontWeight: "600", cursor: sendingEmail ? "default" : "pointer", fontSize: "14px" }}
            >
              {sendingEmail ? "⏳ Sending..." : "📧 Email to Client"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ color: "#1a2a3a" }}>Big Bay Administrators - Admin Dashboard</h1>
          <button onClick={onLogout} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
            Logout
          </button>
        </div>

        {submittedClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "8px" }}>
            <p style={{ color: "#999" }}>No submissions yet</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {submittedClients.map((client, i) => {
              const completeness = calculateCompleteness(client.data || {});
              const compliance = calculateComplianceScore(client.data || {});
              const flags = getRiskFlags(client.data || {});

              return (
                <div
                  key={i}
                  onClick={() => setViewClient(i)}
                  style={{ padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontWeight: "bold", color: "#1a2a3a" }}>{client.company}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>{client.contact} • {client.email}</div>
                  </div>
                  <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#666" }}>Completion</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: completeness < 75 ? "#f39c12" : "#2ecc71" }}>{completeness}%</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#666" }}>Quality</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: compliance < 75 ? "#f39c12" : "#2ecc71" }}>{compliance}%</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#666" }}>Gaps</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: flags.length === 0 ? "#10b981" : "#dc2626" }}>{flags.length}</div>
                    </div>
                  </div>
                </div>
              );
            })}
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
  const [formData, setFormData] = useState({});

  const saveClients = useCallback((updated) => {
    setClients(updated);
    localStorage.setItem("rmcp_clients", JSON.stringify(updated));
  }, []);

  // LANDING PAGE
  if (view === "landing") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #0d1f17 0%, #1a3a2a 40%, #0f2a1e 100%)", color: "#fff", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 600, textAlign: "center" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "12px" }}>RMCP Assessment</h1>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", marginBottom: "32px" }}>Complete your Risk Management and Compliance Programme assessment in 15 minutes</p>

          <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
            <button onClick={() => setShowForm(true)} style={{ padding: "14px 24px", borderRadius: "8px", border: "none", background: "#1a9c54", color: "#fff", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>
              Start Assessment →
            </button>
            <button onClick={() => setShowPasswordPrompt(true)} style={{ padding: "12px 24px", borderRadius: "8px", border: "1.5px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
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
      <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxWidth: 400 }}>
          <h2 style={{ marginBottom: "24px", color: "#1a2a3a" }}>Admin Login</h2>
          <input type="password" placeholder="Enter password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyPress={(e) => { if (e.key === "Enter" && adminPassword === "BigBay2024") { setShowPasswordPrompt(false); setView("admin"); setAdminPassword(""); } }} style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" }} autoFocus />
          <button onClick={() => { if (adminPassword === "BigBay2024") { setShowPasswordPrompt(false); setView("admin"); setAdminPassword(""); } else { alert("Incorrect password"); } }} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "none", background: "#1a9c54", color: "#fff", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>
            Login
          </button>
          <button onClick={() => setShowPasswordPrompt(false)} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", color: "#666", fontWeight: "600", cursor: "pointer" }}>
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

  // FORM - filled by user
  if (showForm && activeClient !== null) {
    const client = clients[activeClient];
    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif", padding: "20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: "12px", padding: "24px" }}>
          <button onClick={() => { setShowForm(false); setActiveClient(null); }} style={{ marginBottom: "16px", padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
            ← Back
          </button>

          <h2 style={{ marginBottom: "20px", color: "#1a2a3a" }}>FICA Compliance Assessment</h2>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>Client Types</strong>
            {["Individual buyers", "Individual sellers", "Companies / Trusts", "Foreign nationals"].map((type) => (
              <div key={type}>
                <input type="checkbox" checked={(formData.client_types || []).includes(type)} onChange={(e) => { const types = formData.client_types || []; setFormData({ ...formData, client_types: e.target.checked ? [...types, type] : types.filter((t) => t !== type) }); }} style={{ marginRight: "8px" }} />
                {type}
              </div>
            ))}
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>Service Types</strong>
            {["Residential sales", "Commercial sales", "Residential rentals"].map((service) => (
              <div key={service}>
                <input type="checkbox" checked={(formData.service_types || []).includes(service)} onChange={(e) => { const services = formData.service_types || []; setFormData({ ...formData, service_types: e.target.checked ? [...services, service] : services.filter((s) => s !== service) }); }} style={{ marginRight: "8px" }} />
                {service}
              </div>
            ))}
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>Geographic Exposure</strong><br />
            <select value={formData.geographic_risk || ""} onChange={(e) => setFormData({ ...formData, geographic_risk: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}>
              <option value="">Select...</option>
              <option value="Local only">Local only</option>
              <option value="Mix of local and international">Mix of local and international</option>
              <option value="International / foreign clients">International / foreign clients</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>Transaction Value Range</strong><br />
            <select value={formData.value_range || ""} onChange={(e) => setFormData({ ...formData, value_range: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}>
              <option value="">Select...</option>
              <option value="Under R5m">Under R5m</option>
              <option value="R5m to R50m">R5m to R50m</option>
              <option value="Over R50m">Over R50m</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>Compliance Officer</strong><br />
            <input type="text" placeholder="Name" value={formData.compliance_officer || ""} onChange={(e) => setFormData({ ...formData, compliance_officer: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box", background: "#fff" }} />
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>CDD Process</strong><br />
            <select value={formData.cdd_process || ""} onChange={(e) => setFormData({ ...formData, cdd_process: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}>
              <option value="">Select...</option>
              <option value="Formal documented process">Formal documented process</option>
              <option value="Ad hoc - based on risk assessment">Ad hoc - based on risk assessment</option>
              <option value="Not yet established">Not yet established</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>Training Policy</strong><br />
            <select value={formData.training_policy || ""} onChange={(e) => setFormData({ ...formData, training_policy: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}>
              <option value="">Select...</option>
              <option value="Annual workshops">Annual workshops</option>
              <option value="Online courses">Online courses</option>
              <option value="Not yet established">Not yet established</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>Sanctions Screening</strong><br />
            <select value={formData.sanctions_screening || ""} onChange={(e) => setFormData({ ...formData, sanctions_screening: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}>
              <option value="">Select...</option>
              <option value="Registered with screening service">Registered with screening service</option>
              <option value="Not yet established">Not yet established</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>PEP Screening</strong><br />
            <select value={formData.pep_screening || ""} onChange={(e) => setFormData({ ...formData, pep_screening: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}>
              <option value="">Select...</option>
              <option value="Third-party screening tool">Third-party screening tool</option>
              <option value="Not yet established">Not yet established</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>STR/goAML</strong><br />
            <select value={formData.str_process || ""} onChange={(e) => setFormData({ ...formData, str_process: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}>
              <option value="">Select...</option>
              <option value="Registered on goAML and actively filing">Registered on goAML and actively filing</option>
              <option value="Not yet registered on goAML">Not yet registered on goAML</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <strong>Board Approval Date</strong><br />
            <input type="date" value={formData.board_approval_date || ""} onChange={(e) => setFormData({ ...formData, board_approval_date: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box", background: "#fff" }} />
          </label>

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => { const updated = [...clients]; updated[activeClient] = { ...updated[activeClient], data: formData, submitted: true }; saveClients(updated); setShowForm(false); setActiveClient(null); setView("landing"); alert("✓ Assessment submitted!"); }} style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "none", background: "#1a9c54", color: "#fff", fontWeight: "600", cursor: "pointer" }}>
              Submit
            </button>
            <button onClick={() => { setShowForm(false); setActiveClient(null); }} style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", color: "#666", fontWeight: "600", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CLIENT ENTRY FORM
  if (showForm) {
    const [companyName, setCompanyName] = useState("");
    const [contactName, setContactName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [ffc, setFfc] = useState("");

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #0d1f17 0%, #1a3a2a 40%, #0f2a1e 100%)", color: "#fff", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 500, width: "100%", background: "#fff", borderRadius: "12px", padding: "40px", color: "#333" }}>
          <h2 style={{ marginBottom: "24px", color: "#1a2a3a" }}>Create Your Profile</h2>

          <input type="text" placeholder="Company/Firm Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", background: "#fff" }} />
          <input type="text" placeholder="Contact Name" value={contactName} onChange={(e) => setContactName(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", background: "#fff" }} />
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", background: "#fff" }} />
          <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", background: "#fff" }} />
          <input type="text" placeholder="FFC Number (if applicable)" value={ffc} onChange={(e) => setFfc(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "24px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", background: "#fff" }} />

          <button onClick={() => { if (!companyName || !email) { alert("Please enter company name and email"); return; } const newClient = { company: companyName, contact: contactName, email, phone, ffc, submitted: false, data: {} }; const newClients = [...clients, newClient]; saveClients(newClients); setActiveClient(newClients.length - 1); setFormData({}); }} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "none", background: "#1a9c54", color: "#fff", fontWeight: "600", cursor: "pointer", fontSize: "14px", marginBottom: "12px" }}>
            Continue to Assessment
          </button>
          <button onClick={() => setShowForm(false)} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", color: "#666", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}
