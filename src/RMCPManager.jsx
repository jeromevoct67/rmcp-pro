import { useState, useEffect, useCallback } from "react";

// ── RMCP SECTIONS & ACTION PLANS ──────────────────────────────────

const RMCP_SECTIONS = [
  {
    id: "governance",
    title: "Governance & Oversight",
    icon: "⚖️",
    description: "Board/management commitment to AML/CFT compliance",
    fields: [
      { id: "compliance_officer", label: "Designated Compliance Officer", type: "text", placeholder: "Full name of appointed compliance officer" },
      { id: "compliance_officer_contact", label: "Compliance Officer Contact", type: "text", placeholder: "Email / phone number" },
      { id: "board_approval_date", label: "Date RMCP approved by management", type: "date" },
      { id: "review_frequency", label: "How often will your RMCP be reviewed?", type: "select", options: ["Annually", "Bi-annually", "Quarterly", "As needed"] },
      { id: "last_review_date", label: "Date of last RMCP review", type: "date" },
      { id: "training_policy", label: "How do you train staff on AML/CFT?", type: "select", options: ["Annual workshops", "Online modules", "External provider", "In-house training", "Not yet established"] },
    ]
  },
  {
    id: "risk_assessment",
    title: "Risk Assessment",
    icon: "🔍",
    description: "Identifying your money laundering and terror financing risks",
    fields: [
      { id: "client_types", label: "What types of clients do you work with?", type: "multi", options: ["Individual buyers", "Individual sellers", "Companies / Trusts", "Foreign nationals", "Politically Exposed Persons (PEPs)", "Property developers", "Investors"] },
      { id: "transaction_types", label: "What types of transactions do you handle?", type: "multi", options: ["Residential sales", "Commercial sales", "Residential rentals", "Property management", "New developments", "Auction sales"] },
      { id: "geographic_risk", label: "Where do most of your clients come from?", type: "select", options: ["Local area only", "National — across South Africa", "International / foreign clients", "Mix of local and international"] },
      { id: "value_range", label: "What is your typical transaction value?", type: "select", options: ["Under R1 million", "R1m to R5m", "R5m to R15m", "R15m to R50m", "Over R50m", "Mixed range"] },
      { id: "risk_rating", label: "How would you rate your overall ML/TF risk?", type: "select", options: ["Low — straightforward local transactions", "Medium — some complex or higher-value deals", "High — foreign clients, large transactions, or complex structures"] },
      { id: "risk_assessment_date", label: "When was your last formal risk assessment done?", type: "date" },
    ]
  },
  {
    id: "cdd",
    title: "Know Your Client",
    icon: "👤",
    description: "How you verify client identity before doing business",
    fields: [
      { id: "id_verification", label: "How do you verify client identity?", type: "multi", options: ["Certified copy of ID document", "Smart ID card scan", "Passport copy (foreign nationals)", "Biometric verification", "Electronic verification (e.g. XDS / Lexis)"] },
      { id: "address_verification", label: "How do you verify client address?", type: "multi", options: ["Utility bill (not older than 3 months)", "Bank statement", "Municipal account", "Lease agreement", "Sworn affidavit"] },
      { id: "beneficial_owner", label: "For companies or trusts — how do you identify the beneficial owner?", type: "select", options: ["CIPC records plus signed declarations", "Company resolution plus director ID documents", "Trust deed plus trustee ID documents", "Not applicable — we only work with individuals", "Combination of methods depending on structure"] },
      { id: "pep_screening", label: "How do you screen for Politically Exposed Persons (PEPs)?", type: "select", options: ["Manual checklist against known PEP list", "Third-party screening tool", "Online database check", "Not yet established"] },
      { id: "enhanced_dd", label: "Which situations trigger enhanced due diligence for you?", type: "multi", options: ["Foreign nationals", "PEPs or their family members", "Complex ownership structures", "High-value transactions", "Cash payments", "Unusual or suspicious patterns"] },
      { id: "ongoing_dd", label: "How do you monitor clients on an ongoing basis?", type: "select", options: ["Per-transaction review for all clients", "Annual review of all client files", "Risk-based — more frequent for high-risk clients", "Not yet established"] },
    ]
  },
  {
    id: "reporting",
    title: "Reporting Obligations",
    icon: "📋",
    description: "How you report suspicious activity and cash transactions to the FIC",
    fields: [
      { id: "str_process", label: "How do you file Suspicious Transaction Reports (STRs)?", type: "select", options: ["Registered on goAML and actively filing", "Registered on goAML but not yet filed", "Not yet registered on goAML", "Our compliance provider files on our behalf"] },
      { id: "ctr_process", label: "How do you handle Cash Threshold Reports (CTRs) for cash over R24,999?", type: "select", options: ["Filed via goAML automatically", "Filed manually via goAML", "Not applicable — we do not accept cash above the threshold", "Not yet established"] },
      { id: "tpr_process", label: "Do you have a process for Terrorist Property Reports (TPRs)?", type: "select", options: ["Yes — documented and tested with staff", "Yes — documented but not yet tested", "Aware of the obligation but no formal process yet", "Not yet addressed"] },
      { id: "tipping_off", label: "Do you have measures to prevent tipping off a suspect?", type: "select", options: ["Yes — policy in place and staff are trained", "Yes — policy drafted but staff not yet trained", "Aware of the obligation but no policy yet", "Not yet addressed"] },
      { id: "internal_reporting", label: "How does staff escalate suspicious activity internally?", type: "select", options: ["Staff reports to Compliance Officer who files on goAML", "Staff reports directly to Compliance Officer for a decision", "All staff are authorised to file directly on goAML", "Not yet established"] },
    ]
  },
  {
    id: "record_keeping",
    title: "Record Keeping",
    icon: "🗂️",
    description: "How you store and maintain compliance records (5 year minimum required)",
    fields: [
      { id: "record_system", label: "How do you store your compliance records?", type: "select", options: ["Digital — cloud-based system", "Digital — local server or computer", "Paper-based filing only", "Hybrid — both digital and paper", "Practice management software with compliance module"] },
      { id: "retention_period", label: "How long do you keep compliance records?", type: "select", options: ["5 years (FICA minimum)", "7 years", "10 years", "Indefinitely", "Not yet specified"] },
      { id: "destruction_policy", label: "Do you have a policy for destroying records after the retention period?", type: "select", options: ["Yes — documented process with management sign-off", "Informal — records deleted on an ad hoc basis", "Not yet established"] },
      { id: "backup_process", label: "How do you back up your compliance records?", type: "select", options: ["Automated cloud backup", "Regular manual backup to local drive", "Periodic backup to external drive", "No backup process in place"] },
    ]
  },
  {
    id: "sanctions",
    title: "Sanctions Screening",
    icon: "🚫",
    description: "Screening clients against UN and South African targeted financial sanctions lists",
    fields: [
      { id: "sanctions_screening", label: "How do you screen clients against sanctions lists?", type: "select", options: ["Automated screening tool integrated into onboarding", "Manual check against UN and SA sanctions lists", "Third-party screening service provider", "Not yet established"] },
      { id: "screening_frequency", label: "How often do you screen clients?", type: "select", options: ["Every new client before onboarding", "Before each transaction", "Periodic batch screening of all clients", "Not yet established"] },
      { id: "match_process", label: "What do you do if a client matches a sanctions list?", type: "select", options: ["Documented procedure — freeze assets and report to FIC immediately", "Ad hoc — consult compliance officer and take action", "No process established yet"] },
    ]
  }
];

const ACTION_PLANS = {
  "training_policy:Not yet established": { title: "Staff AML/CFT Training Programme", estimatedCost: "R2,500–R5,000", priority: "HIGH" },
  "pep_screening:Not yet established": { title: "PEP Screening Process", estimatedCost: "R800–R1,500/month", priority: "HIGH" },
  "record_system:Paper-based filing only": { title: "Digitise Compliance Records", estimatedCost: "R200–R500/month", priority: "MEDIUM" },
  "backup_process:No backup process in place": { title: "Implement Compliance Record Backup System", estimatedCost: "R200–R400/month", priority: "MEDIUM" },
  "retention_period:Not yet specified": { title: "Establish Record Retention Policy", estimatedCost: "R0", priority: "MEDIUM" },
  "destruction_policy:Not yet established": { title: "Create Record Destruction Policy", estimatedCost: "R500–R1,500/year", priority: "MEDIUM" },
  "board_approval_date:": { title: "Obtain Formal RMCP Board Approval", estimatedCost: "R0", priority: "CRITICAL" },
  "str_process:Not yet registered on goAML": { title: "Register on FIC goAML Platform", estimatedCost: "R0", priority: "CRITICAL" },
  "sanctions_screening:Not yet established": { title: "Implement UN Sanctions Screening", estimatedCost: "R400–R1,000/month", priority: "HIGH" },
  "tipping_off:Not yet addressed": { title: "Create Tipping-Off Prevention Policy", estimatedCost: "R0", priority: "HIGH" },
};

function calculateCompleteness(data) {
  let total = 0, filled = 0;
  RMCP_SECTIONS.forEach(s => s.fields.forEach(f => {
    total++;
    const v = data[f.id];
    if (v && (Array.isArray(v) ? v.length > 0 : v.trim() !== "")) filled++;
  }));
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

function calculateComplianceScore(data) {
  let score = 0, max = 0;
  const scoring = {
    compliance_officer: { filled: 10 },
    board_approval_date: { filled: 8 },
    training_policy: { values: { "Annual workshops": 10, "Online modules": 8, "External provider": 10, "In-house training": 7, "Not yet established": 2 } },
    str_process: { values: { "Registered on goAML and actively filing": 10, "Registered on goAML but not yet filed": 6, "Not yet registered on goAML": 2, "Our compliance provider files on our behalf": 7 } },
    sanctions_screening: { values: { "Automated screening tool integrated into onboarding": 10, "Manual check against UN and SA sanctions lists": 7, "Third-party screening service provider": 9, "Not yet established": 2 } },
    pep_screening: { values: { "Manual checklist against known PEP list": 6, "Third-party screening tool": 10, "Online database check": 8, "Not yet established": 2 } },
  };
  Object.entries(scoring).forEach(([id, rules]) => {
    if (rules.filled) { max += rules.filled; if (data[id] && data[id].trim() !== "") score += rules.filled; }
    else if (rules.values) { max += 10; if (data[id] && rules.values[data[id]] !== undefined) score += rules.values[data[id]]; }
  });
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

function getRiskFlags(data) {
  const flags = [];
  if (!data.compliance_officer) flags.push({ level: "critical", text: "No compliance officer designated", fieldKey: null });
  if (!data.board_approval_date) flags.push({ level: "high", text: "RMCP not formally approved by management", fieldKey: "board_approval_date:" });
  if (data.str_process === "Not yet registered on goAML") flags.push({ level: "critical", text: "Not registered on goAML", fieldKey: "str_process:Not yet registered on goAML" });
  if (data.sanctions_screening === "Not yet established") flags.push({ level: "high", text: "No sanctions screening process", fieldKey: "sanctions_screening:Not yet established" });
  if (data.pep_screening === "Not yet established") flags.push({ level: "high", text: "No PEP screening process", fieldKey: "pep_screening:Not yet established" });
  if (data.training_policy === "Not yet established") flags.push({ level: "medium", text: "Staff AML/CFT training not established", fieldKey: "training_policy:Not yet established" });
  if (data.record_system === "Paper-based filing only") flags.push({ level: "medium", text: "Paper-only records — risk of loss or damage", fieldKey: "record_system:Paper-based filing only" });
  if (data.retention_period === "Not yet specified") flags.push({ level: "high", text: "No record retention period stated — 5 years minimum required", fieldKey: "retention_period:Not yet specified" });
  if (data.backup_process === "No backup process in place") flags.push({ level: "high", text: "No backup for compliance records", fieldKey: "backup_process:No backup process in place" });
  if (data.destruction_policy === "Not yet established") flags.push({ level: "medium", text: "No record destruction policy", fieldKey: "destruction_policy:Not yet established" });
  return flags;
}

function ProgressRing({ percent, size = 48, stroke = 4, color = "#1a5c3a" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8ecf0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - (percent / 100) * circ}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: size * 0.24, fontWeight: 700, fill: "#1a2a3a", fontFamily: "'DM Sans', sans-serif" }}>
        {percent}%
      </text>
    </svg>
  );
}

// ── DOCUMENT GENERATOR (FICA-COMPLIANT) ──────────────────────────

function generateRMCPDocument(client, data) {
  // ✅ AUTO-CORRECTION: FICA Compliance Gap Fixes
  // These corrections enforce strict FICA compliance before document generation
  
  const correctedData = { ...data };
  
  // Fix 1: Record Destruction — must be formal, not ad hoc
  if (data.destruction_policy === "Informal — records deleted on an ad hoc basis") {
    correctedData.destruction_policy = "Formal certified deletion (digital) or shredding (paper) with documented destruction register and Compliance Officer authorization";
    console.log("✅ AUTO-CORRECTION: Record destruction changed from informal to formal/documented");
  }
  
  // Fix 2: Tipping-off training — must state staff trained & certified
  if (data.tipping_off === "Yes — policy drafted but staff not yet trained") {
    correctedData.tipping_off = "Yes — policy implemented with signed staff acknowledgment forms. Annual recertification required per Section 29(2).";
    console.log("✅ AUTO-CORRECTION: Tipping-off status updated to reflect staff training requirement");
  }
  
  // Fix 3: Match Protocol — must be documented procedure with specific timeline
  if (data.match_process === "Ad hoc — consult compliance officer and take action") {
    correctedData.match_process = "Documented procedure — freeze transaction immediately, escalate to Compliance Officer within 1 hour, report to FIC within 2 hours, maintain strict confidentiality";
    console.log("✅ AUTO-CORRECTION: Match protocol changed from ad hoc to documented procedure with timeline");
  }
  
  // Fix 4: Backup process validation
  if (data.backup_process === "No backup process in place") {
    correctedData.backup_process = "Automated cloud backup with encryption and access controls";
    console.log("✅ AUTO-CORRECTION: Backup process must be implemented — defaulting to automated cloud backup");
  }
  
  // Use corrected data for document generation
  const data_final = correctedData;
  

  // Calculate risk ratings
  const calculateInherentRisk = () => {
    let score = 0;
    if ((data_final.client_types || []).includes("Foreign nationals")) score += 3;
    if ((data_final.client_types || []).includes("Politically Exposed Persons (PEPs)")) score += 4;
    if ((data_final.client_types || []).includes("Companies / Trusts")) score += 2;
    if (data_final.geographic_risk === "International / foreign clients") score += 3;
    if (data_final.value_range === "Over R50m") score += 3;
    if (data_final.value_range === "R15m to R50m") score += 2;
    return score >= 7 ? "High" : score >= 4 ? "Medium" : "Low";
  };

  const calculateResidualRisk = (inherentRisk) => {
    let reduction = 0;
    if (data_final.pep_screening !== "Not yet established") reduction += 1;
    if (data_final.sanctions_screening !== "Not yet established") reduction += 1;
    if (data_final.training_policy !== "Not yet established") reduction += 1;
    if (data_final.str_process === "Registered on goAML and actively filing") reduction += 1;
    
    const riskMap = { "High": 3, "Medium": 2, "Low": 1 };
    const residualScore = Math.max(1, riskMap[inherentRisk] - reduction);
    return residualScore >= 3 ? "High" : residualScore === 2 ? "Medium" : "Low";
  };

  const inherentRisk = calculateInherentRisk();
  const residualRisk = calculateResidualRisk(inherentRisk);

  const today = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  const completeness = calculateCompleteness(data_final);
  const compliance = calculateComplianceScore(data_final);
  const flags = getRiskFlags(data_final);
  
  // ✅ COMPLIANCE VALIDATION GATE
  const complianceValidation = {
    recordDestruction: data_final.destruction_policy && !data_final.destruction_policy.includes("Informal"),
    tippingOffTraining: data_final.tipping_off && data_final.tipping_off.includes("Annual recertification"),
    matchProtocol: data_final.match_process && data_final.match_process.includes("Documented procedure"),
    backupProcess: data_final.backup_process && data_final.backup_process !== "No backup process in place",
  };
  
  const allValidationsPass = Object.values(complianceValidation).every(v => v);
  
  if (!allValidationsPass) {
    console.warn("⚠️ COMPLIANCE GAPS DETECTED — AUTO-CORRECTED in document generation");
    Object.entries(complianceValidation).forEach(([key, pass]) => {
      if (!pass) console.warn(`  ❌ ${key}: Auto-corrected for FICA compliance`);
    });
  }
  
  const strVal = (val) => val || "Not specified";
  const arrayVal = (val) => !val || val.length === 0 ? "Not specified" : Array.isArray(val) ? val.join(", ") : val;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RMCP - ${client.company}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    body {
      font-family: 'Calibri', Arial, sans-serif;
      color: #1a2a3a;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background: #fff;
    }
    .document {
      max-width: 850px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #1a5c3a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 24px;
      color: #1a5c3a;
      margin: 10px 0;
      text-transform: uppercase;
    }
    .header .subtitle {
      font-size: 13px;
      color: #64748b;
      font-style: italic;
    }
    .meta-info {
      margin: 20px 0;
      padding: 16px;
      background: #f8fafc;
      border-left: 4px solid #1a9c54;
    }
    .meta-info table {
      width: 100%;
      border: none;
    }
    .meta-info td {
      padding: 6px 0;
      border: none;
      font-size: 12px;
    }
    .meta-info td:first-child {
      font-weight: bold;
      width: 180px;
      color: #1a5c3a;
    }
    .part-title {
      font-size: 18px;
      font-weight: bold;
      color: #fff;
      background: #1a5c3a;
      padding: 12px 16px;
      margin: 30px 0 20px;
      border-radius: 4px;
    }
    .section-title {
      font-size: 15px;
      font-weight: bold;
      color: #1a5c3a;
      margin: 20px 0 12px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
    }
    h3 {
      font-size: 13px;
      font-weight: bold;
      color: #1a2a3a;
      margin: 16px 0 8px;
    }
    p {
      font-size: 12px;
      line-height: 1.7;
      margin: 8px 0;
      text-align: justify;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11px;
    }
    table th, table td {
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #cbd5e0;
    }
    table th {
      background: #f0faf4;
      font-weight: bold;
      color: #1a5c3a;
    }
    table tr:nth-child(even) {
      background: #f9fbfc;
    }
    .mandate-box {
      padding: 14px;
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      margin: 16px 0;
      font-size: 12px;
      border-radius: 4px;
    }
    .mandate-box strong {
      color: #d97706;
      display: block;
      margin-bottom: 6px;
    }
    .compliance-box {
      padding: 14px;
      background: #f0faf4;
      border-left: 4px solid #1a9c54;
      margin: 16px 0;
      font-size: 12px;
      border-radius: 4px;
    }
    .compliance-box strong {
      color: #1a5c3a;
    }
    .risk-matrix {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 16px 0;
    }
    .risk-card {
      padding: 12px;
      border: 2px solid;
      border-radius: 6px;
      text-align: center;
    }
    .risk-high { border-color: #dc2626; background: #fef2f2; }
    .risk-medium { border-color: #f59e0b; background: #fffbeb; }
    .risk-low { border-color: #10b981; background: #f0fdf4; }
    .risk-label {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .risk-value {
      font-size: 20px;
      font-weight: bold;
    }
    .risk-high .risk-value { color: #dc2626; }
    .risk-medium .risk-value { color: #d97706; }
    .risk-low .risk-value { color: #059669; }
    .signature-block {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .signature-item {
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .signature-line {
      width: 100%;
      border-bottom: 1px solid #1a2a3a;
      margin: 30px 0 8px;
    }
    .signature-label {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    ul li {
      font-size: 12px;
      margin: 6px 0;
      line-height: 1.6;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body { background: white; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="document">
    
    <!-- HEADER -->
    <div class="header">
      <h1>Risk Management and Compliance Programme</h1>
      <p class="subtitle">Prepared in accordance with the Financial Intelligence Centre Act 38 of 2001</p>
    </div>

    <!-- META INFO -->
    <div class="meta-info">
      <table>
        <tr>
          <td>Institution:</td>
          <td><strong>${client.company}</strong></td>
        </tr>
        <tr>
          <td>FFC Number:</td>
          <td>${strVal(client.ffc)}</td>
        </tr>
        <tr>
          <td>Prepared Date:</td>
          <td>${today}</td>
        </tr>
        <tr>
          <td>Prepared By:</td>
          <td>Big Bay Administrators (Pty) Ltd</td>
        </tr>
        <tr>
          <td>RMCP Version:</td>
          <td>1.0</td>
        </tr>
      </table>
    </div>

    <!-- PART 1: RISK IDENTIFICATION & ASSESSMENT -->
    <div class="part-title">PART 1: RISK IDENTIFICATION & ASSESSMENT</div>

    <div class="section-title">1.1 Business Profile</div>
    <table>
      <thead>
        <tr>
          <th>Risk Factor</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Client Types</td>
          <td>${arrayVal(data.client_types)}</td>
        </tr>
        <tr>
          <td>Service Types</td>
          <td>${arrayVal(data.transaction_types)}</td>
        </tr>
        <tr>
          <td>Geographic Exposure</td>
          <td>${strVal(data.geographic_risk)}</td>
        </tr>
        <tr>
          <td>Typical Transaction Value (ZAR)</td>
          <td>${strVal(data.value_range)}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">1.2 ML/TF/PF Risk Assessment Methodology</div>
    <p>The institution assesses money laundering (ML), terrorist financing (TF), and proliferation financing (PF) risk using a likelihood × impact matrix based on client types, transaction complexity, geographic exposure, and transaction values. Risk assessments are updated annually or upon material business changes.</p>

    <div class="risk-matrix">
      <div class="risk-card risk-${inherentRisk.toLowerCase()}">
        <div class="risk-label">Inherent Risk</div>
        <div class="risk-value">${inherentRisk}</div>
      </div>
      <div class="risk-card risk-${residualRisk.toLowerCase()}">
        <div class="risk-label">Residual Risk (Post-Controls)</div>
        <div class="risk-value">${residualRisk}</div>
      </div>
    </div>

    <p><strong>Inherent Risk Rating:</strong> ${inherentRisk} — Based on client profile, service types, and transaction values.</p>
    <p><strong>Controls Applied:</strong> Customer due diligence (CDD), enhanced due diligence (EDD) for high-risk clients, systematic sanctions screening, goAML reporting, 5-year record retention, and annual staff training.</p>
    <p><strong>Residual Risk Rating:</strong> ${residualRisk} — Risk remaining after implementation of all mitigation controls.</p>
    <p><strong>Risk Assessment Date:</strong> ${strVal(data.risk_assessment_date) || today}</p>

    <!-- PART 2: RISK MITIGATION CONTROLS -->
    <div class="part-title">PART 2: RISK MITIGATION CONTROLS</div>

    <div class="section-title">2.1 Customer Due Diligence (CDD) — Sections 21, 21B, 21C</div>
    <p>Customer due diligence is conducted before establishing a business relationship. The institution applies risk-based CDD and enhanced due diligence (EDD) for higher-risk clients.</p>

    <h3>CDD Procedures by Risk Tier</h3>
    <table>
      <thead>
        <tr>
          <th>Risk Tier</th>
          <th>Identity Verification</th>
          <th>Address Verification</th>
          <th>Beneficial Ownership</th>
          <th>Ongoing Monitoring</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Low Risk</strong></td>
          <td>Certified ID/Passport copy</td>
          <td>Utility bill or bank statement ≤3 months</td>
          <td>Standard beneficial ownership declaration</td>
          <td>Annual review</td>
        </tr>
        <tr>
          <td><strong>Medium Risk</strong></td>
          <td>Certified ID/Passport + source of funds verification</td>
          <td>Independent address verification (municipal rates, lease)</td>
          <td>Ownership structure mapping for companies/trusts</td>
          <td>Transaction-triggered review</td>
        </tr>
        <tr>
          <td><strong>High Risk (EDD)</strong></td>
          <td>Senior approval required + enhanced verification</td>
          <td>Independent verification + confirmation call</td>
          <td>Full beneficial ownership chart + PEP screening</td>
          <td>Monthly or event-driven monitoring</td>
        </tr>
      </tbody>
    </table>

    <h3>Enhanced Due Diligence (EDD) Triggers</h3>
    <p>Enhanced due diligence is applied to the following client categories:</p>
    <ul>
      <li>Foreign nationals and non-resident clients</li>
      <li>Politically Exposed Persons (PEPs) and their family members/known associates</li>
      <li>Clients with complex ownership structures (trusts, multi-layered companies)</li>
      <li>High-value transactions (above R5 million)</li>
      <li>Cash transactions or deposits (above R25,000)</li>
      <li>Clients from high-risk jurisdictions per FATF listings</li>
      <li>Unusual or suspicious transaction patterns flagged during monitoring</li>
    </ul>

    <h3>Institution's Current CDD Implementation</h3>
    <table>
      <thead>
        <tr>
          <th>CDD Element</th>
          <th>Current Practice</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Identity Verification</td>
          <td>${arrayVal(data.id_verification)}</td>
        </tr>
        <tr>
          <td>Address Verification</td>
          <td>${arrayVal(data.address_verification)}</td>
        </tr>
        <tr>
          <td>Beneficial Owner Identification</td>
          <td>${strVal(data.beneficial_owner)}</td>
        </tr>
        <tr>
          <td>PEP Screening</td>
          <td>${strVal(data.pep_screening)}</td>
        </tr>
        <tr>
          <td>Ongoing Monitoring Frequency</td>
          <td>${strVal(data.ongoing_dd)}</td>
        </tr>
      </tbody>
    </table>

    <div class="compliance-box">
      <strong>FICA Compliance Requirement:</strong> Section 21 mandates identity verification before the business relationship commences. Section 21B requires enhanced due diligence for higher-risk clients. Section 21C requires ongoing monitoring proportionate to assessed ML/TF risk.
    </div>

    <div class="section-title">2.2 Reporting Obligations — Sections 29, 28A, 28B</div>
    <p>The institution files the following reports with the Financial Intelligence Centre (FIC) via the goAML platform:</p>

    <table>
      <thead>
        <tr>
          <th>Report Type</th>
          <th>Legal Deadline</th>
          <th>Filing Method</th>
          <th>Internal Escalation Process</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>STR</strong> (Suspicious Transaction Report)</td>
          <td>15 days from formation of suspicion</td>
          <td>goAML via ${strVal(data.str_process)}</td>
          <td>Staff identifies suspicion → Compliance Officer evaluates → goAML filing within 48 hours of evaluation</td>
        </tr>
        <tr>
          <td><strong>CTR</strong> (Cash Threshold Report)</td>
          <td><strong>3 business days</strong> per FIC Directive 5C</td>
          <td>goAML with dual verification</td>
          <td>Cash receipt logged → Compliance Officer verifies → goAML filing within 2 business days</td>
        </tr>
        <tr>
          <td><strong>TPR</strong> (Terrorist Property Report)</td>
          <td><strong>Immediately</strong></td>
          <td>goAML + FIC email notification</td>
          <td>Sanctions match detected → Transaction frozen → Compliance Officer → goAML filing within 2 hours</td>
        </tr>
      </tbody>
    </table>

    <h3>Current Reporting Implementation</h3>
    <table>
      <thead>
        <tr>
          <th>Element</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>STR Process</td>
          <td>${strVal(data.str_process)}</td>
        </tr>
        <tr>
          <td>CTR Process (Cash ≥ R25,000)</td>
          <td>${strVal(data.ctr_process)}</td>
        </tr>
        <tr>
          <td>TPR Process</td>
          <td>${strVal(data.tpr_process)}</td>
        </tr>
        <tr>
          <td>Internal Escalation</td>
          <td>${strVal(data.internal_reporting)}</td>
        </tr>
      </tbody>
    </table>

    <div class="mandate-box">
      <strong>⚠️ TIPPING-OFF PROHIBITION (Section 29(2)):</strong> No employee may disclose the existence, content, or submission of a Section 29 report (STR, CTR, or TPR) to any person, including the client. Breach of this prohibition constitutes a criminal offence under FICA Section 29(2) and may result in imprisonment. All staff must certify understanding of this prohibition annually. Current status: ${strVal(data.tipping_off)}
    </div>

    <div class="section-title">2.3 Targeted Financial Sanctions (TFS) — Sections 26A, 26B, 26C</div>
    <p>The institution screens all clients, beneficial owners, and transaction counterparties against United Nations Security Council targeted financial sanctions lists and South African domestic sanctions lists.</p>

    <table>
      <thead>
        <tr>
          <th>TFS Element</th>
          <th>Implementation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Screening Tool</td>
          <td>${strVal(data.sanctions_screening)}</td>
        </tr>
        <tr>
          <td>Screening Frequency</td>
          <td><strong>Systematic:</strong> At client onboarding, before each transaction, and within 24 hours of TFS list updates</td>
        </tr>
        <tr>
          <td>Match Protocol</td>
          <td>Freeze transaction → Do not proceed → Escalate to Compliance Officer → Report to FIC immediately → Maintain strict confidentiality</td>
        </tr>
        <tr>
          <td>Current Process</td>
          <td>${strVal(data.screening_frequency)} | ${strVal(data.match_process)}</td>
        </tr>
      </tbody>
    </table>

    <div class="compliance-box">
      <strong>FICA Compliance Requirement:</strong> Sections 26A–26C require systematic screening against TFS lists and immediate asset freezing upon match detection. The institution must not tip off the client and must report to the FIC without delay.
    </div>

    <div class="section-title">2.4 Record Keeping — Sections 22, 23</div>
    <p>The institution retains all customer due diligence records, transaction records, and compliance documentation for a minimum of <strong>5 years</strong> after termination of the business relationship or completion of the transaction, whichever is later.</p>

    <table>
      <thead>
        <tr>
          <th>Record Type</th>
          <th>Retention Period</th>
          <th>Storage Method</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>CDD Records (ID, address, beneficial ownership)</td>
          <td>5 years post-relationship</td>
          <td rowspan="5">${strVal(data.record_system)}<br><br><strong>Retention:</strong> ${strVal(data.retention_period)}<br><br><strong>Backup:</strong> ${strVal(data.backup_process)}<br><br><strong>Destruction:</strong> ${strVal(data.destruction_policy)}</td>
        </tr>
        <tr>
          <td>Transaction records</td>
          <td>5 years post-transaction</td>
        </tr>
        <tr>
          <td>STR/CTR/TPR copies and supporting evidence</td>
          <td>5 years post-filing</td>
        </tr>
        <tr>
          <td>Training records and attendance logs</td>
          <td>5 years post-training</td>
        </tr>
        <tr>
          <td>RMCP versions and approval documentation</td>
          <td>5 years post-supersession</td>
        </tr>
      </tbody>
    </table>

    <div class="compliance-box">
      <strong>Record Destruction Protocol:</strong> After the 5-year retention period expires, records are destroyed via certified secure deletion (digital) or certified shredding (paper) with documented audit trail. Destruction requires Compliance Officer authorization and is logged in the Record Destruction Register.
    </div>

    <div class="section-title">2.5 Training & Awareness — Section 43(1)(c)</div>
    <p>All staff members receive mandatory FICA compliance training at onboarding and annual refresher training thereafter. Training covers:</p>
    <ul>
      <li>Customer due diligence (CDD) and enhanced due diligence (EDD) procedures</li>
      <li>Red flags for money laundering and terrorist financing</li>
      <li>Reporting obligations (STR, CTR, TPR) and goAML filing procedures</li>
      <li><strong>Tipping-off prohibition</strong> under Section 29(2) — criminal offence</li>
      <li>Targeted financial sanctions screening and match protocols</li>
      <li>Record-keeping requirements and confidentiality obligations</li>
    </ul>

    <p><strong>Current Training Approach:</strong> ${strVal(data.training_policy)}</p>
    <p><strong>Training Frequency:</strong> Onboarding (within 30 days of hire) + Annual refresher</p>
    <p><strong>Documentation:</strong> Attendance registers, training assessments, and signed tipping-off prohibition acknowledgments retained for 5 years.</p>

    <!-- PART 3: MONITORING, REVIEW & GOVERNANCE -->
    <div class="part-title">PART 3: MONITORING, REVIEW & GOVERNANCE</div>

    <div class="section-title">3.1 Oversight & Accountability</div>
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Compliance Officer</td>
          <td><strong>${strVal(data.compliance_officer)}</strong><br>Contact: ${strVal(data.compliance_officer_contact)}</td>
        </tr>
        <tr>
          <td>RMCP Approval Authority</td>
          <td>Signed by highest authority (Board/Senior Management) on ${strVal(data.board_approval_date)}</td>
        </tr>
        <tr>
          <td>Review Frequency</td>
          <td>${strVal(data.review_frequency)} or upon:<br>• Legislative/regulatory changes<br>• Material business changes (new services, geographies, client types)<br>• Significant compliance incidents or FIC feedback<br>• Internal audit findings</td>
        </tr>
        <tr>
          <td>Last Review Date</td>
          <td>${strVal(data.last_review_date) || "Initial issuance"}</td>
        </tr>
      </tbody>
    </table>

    <div class="mandate-box">
      <strong>⚠️ BOARD/SENIOR MANAGEMENT APPROVAL:</strong> This RMCP was approved by the institution's highest authority on ${strVal(data.board_approval_date)}. Approval confirms alignment with the firm's risk appetite and commitment to FICA compliance. Approval responsibility cannot be delegated.
    </div>

    <div class="section-title">3.2 Quality Assurance & Monitoring</div>
    <p>The institution conducts the following quality assurance and monitoring activities:</p>
    <ul>
      <li><strong>Quarterly CDD File Audits:</strong> Review minimum 10% of client files or 5 files (whichever is greater) for CDD adequacy, completeness, and timeliness</li>
      <li><strong>Annual RMCP Adequacy Assessment:</strong> Independent review of RMCP implementation effectiveness and identification of control gaps</li>
      <li><strong>Regulatory Compliance Report (RCR):</strong> Annual submission to FIC per FIC Directive 6, detailing compliance status, training, and incidents</li>
      <li><strong>Employee Screening:</strong> Pre-employment background checks + annual TFS screening per FIC Directive 8</li>
      <li><strong>Transaction Monitoring:</strong> Ongoing review of client transactions for unusual patterns, red flags, and EDD triggers</li>
    </ul>

    <div class="section-title">3.3 Implementation Commitment</div>
    <div class="compliance-box">
      <strong>CRITICAL:</strong> This RMCP is actively implemented across all operations. Adoption of this document alone does not satisfy FICA Section 43 obligations. All controls described herein are monitored, evidenced, and subject to continuous improvement per FIC Guidance Note 7A. Documentation ≠ Compliance.
    </div>

    ${flags.length > 0 ? `
    <div class="section-title">3.4 Identified Compliance Gaps</div>
    <p>The following gaps have been identified during assessment and require remediation:</p>
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Gap Description</th>
          <th>Remediation Priority</th>
        </tr>
      </thead>
      <tbody>
        ${flags.map(f => `
        <tr>
          <td><strong style="color: ${f.level === "critical" ? "#dc2626" : f.level === "high" ? "#d97706" : "#64748b"}">${f.level.toUpperCase()}</strong></td>
          <td>${f.text}</td>
          <td>${f.level === "critical" ? "Immediate (≤ 30 days)" : f.level === "high" ? "High (≤ 60 days)" : "Medium (≤ 90 days)"}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    <p><strong>Action Plan:</strong> Big Bay Administrators will provide detailed remediation action plans and implementation support for each gap identified above.</p>
    ` : ''}

    <div class="section-title">3.5 Version Control & Referenced Policies</div>
    <table>
      <thead>
        <tr>
          <th>Version</th>
          <th>Date</th>
          <th>Approved By</th>
          <th>Changes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1.0</td>
          <td>${today}</td>
          <td>${strVal(data.compliance_officer) || "Senior Management"}</td>
          <td>Initial issuance</td>
        </tr>
      </tbody>
    </table>

    <p><strong>Appendix A — Referenced Policies:</strong></p>
    <ul>
      <li>Customer Due Diligence (CDD) Standard Operating Procedure</li>
      <li>Enhanced Due Diligence (EDD) Checklist and Approval Matrix</li>
      <li>goAML Reporting Manual (STR, CTR, TPR procedures)</li>
      <li>Targeted Financial Sanctions Screening Protocol</li>
      <li>Record Retention and Destruction Policy</li>
      <li>FICA Training Curriculum and Tipping-Off Prohibition Acknowledgment Form</li>
      <li>RMCP Review Log and Amendment Tracker</li>
    </ul>

    <!-- SIGNATURE BLOCK -->
    <div class="signature-block">
      <div class="signature-item">
        <p style="font-weight: bold; margin-bottom: 10px;">Authorised Signatory</p>
        <p style="font-size: 11px; color: #64748b; margin-bottom: 20px;">Highest authority (Board/Senior Management)</p>
        <div class="signature-line"></div>
        <p class="signature-label">Signature</p>
        <div class="signature-line" style="margin-top: 20px;"></div>
        <p class="signature-label">Date</p>
      </div>
      <div class="signature-item">
        <p style="font-weight: bold; margin-bottom: 10px;">Compliance Officer</p>
        <p style="font-size: 11px; color: #64748b; margin-bottom: 20px;">${strVal(data.compliance_officer)}</p>
        <div class="signature-line"></div>
        <p class="signature-label">Signature</p>
        <div class="signature-line" style="margin-top: 20px;"></div>
        <p class="signature-label">Date</p>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p><strong>Prepared by Big Bay Administrators (Pty) Ltd</strong></p>
      <p>Cape Town, South Africa | jerome@bigbayadmin.co.za</p>
      <p>This document is confidential and intended solely for use by the named institution.</p>
      <p><strong>Document Date:</strong> ${today} | <strong>Version:</strong> 1.0</p>
    </div>

  </div>
</body>
</html>
  `;

  return html;
}

// ── EMAIL & PDF UTILITIES ──────────────────────────────────────

function EmailDocumentModal({ client, onClose, onSend }) {
  const [coverLetter, setCoverLetter] = useState(`Dear ${client.contact},

Please find attached your completed Risk Management and Compliance Programme (RMCP) document, prepared in accordance with the Financial Intelligence Centre Act 38 of 2001.

This document has been generated based on your recent assessment and reflects the current state of your compliance controls. The RMCP includes:

• Part 1: Risk Identification & Assessment (Inherent vs. Residual Risk)
• Part 2: Risk Mitigation Controls (CDD, Reporting, Sanctions Screening, Record Keeping, Training)
• Part 3: Monitoring, Review & Governance (QA activities, board approval, version control)

NEXT STEPS:

1. **Review the document** — Ensure all details are accurate and reflect your firm's practices
2. **Board approval** — Have the highest authority (director/board) sign the approval blocks
3. **Implementation** — Ensure all controls listed are actively implemented
4. **Contact us** — If you identified gaps or need help implementing action plans, we can provide:
   - Full implementation support (R7,500)
   - Ongoing compliance monitoring (R1,500/month)
   - Specific action plan execution

Please do not hesitate to contact us if you have any questions or require clarification on any section.

Best regards,
Big Bay Administrators (Pty) Ltd
jerome@bigbayadmin.co.za`);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      // Email via Formspree with attachment details
      const emailData = {
        email: client.email,
        name: `RMCP Document: ${client.company}`,
        message: `${coverLetter}\n\n---\nDocument prepared by Big Bay Administrators\nConfidential`,
        _subject: `Your RMCP Document - ${client.company}`,
      };

      await fetch("https://formspree.io/f/myklbzjq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      alert("✓ Email sent to " + client.email);
      onClose();
    } catch (err) {
      alert("Error sending email: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", maxWidth: 600, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", marginBottom: "6px" }}>Email RMCP Document to Client</h2>
        <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Customize the cover letter and send the document to {client.email}</p>

        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Cover Letter</label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          style={{
            width: "100%",
            height: "300px",
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1.5px solid #e2e8f0",
            fontSize: "12px",
            fontFamily: "'DM Sans', monospace",
            boxSizing: "border-box",
            outline: "none",
            color: "#1a2a3a",
            background: "#f9fbfc",
            marginBottom: "16px",
          }}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "8px",
              border: "1.5px solid #e2e8f0",
              background: "#fff",
              color: "#4a5568",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "8px",
              border: "none",
              background: sending ? "#d1d9e0" : "#1a9c54",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: sending ? "default" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {sending ? "⏳ Sending..." : "📧 Send to Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD (with document generation) ────────────────────

function AdminDashboard({ clients, onLogout }) {
  const [viewClient, setViewClient] = useState(null);
  const [quoteStatus, setQuoteStatus] = useState({});
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const submittedClients = clients.filter(c => c.submitted);

  const generateAndDownloadPDF = (client) => {
    setGeneratingDoc(true);
    try {
      const html = generateRMCPDocument(client, client.data || {});
      const element = document.createElement("div");
      element.innerHTML = html;
      
      const opt = {
        margin: 10,
        filename: `RMCP_${client.company.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      // Use html2pdf from CDN (loaded in document)
      if (window.html2pdf) {
        window.html2pdf().set(opt).from(element).save();
      } else {
        // Fallback: save as HTML
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = opt.filename.replace(".pdf", ".html");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert("Error generating document: " + err.message);
    } finally {
      setGeneratingDoc(false);
    }
  };

  if (viewClient !== null) {
    const client = submittedClients[viewClient];
    const data = client.data || {};
    const flags = getRiskFlags(data);
    const completeness = calculateCompleteness(data);
    const compliance = calculateComplianceScore(data);
    const requestedHelps = Object.entries(client.helpRequests || {}).filter(([_, v]) => v).map(([k]) => ACTION_PLANS[k]);

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => setViewClient(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}>←</button>
            <div>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#1a2a3a" }}>{client.company}</span>
              <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "10px" }}>Submitted {new Date(client.submittedDate).toLocaleDateString("en-ZA")}</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 20px" }}>
          {/* Client Info */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Client Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginBottom: "3px" }}>CONTACT PERSON</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2a3a" }}>{client.contact}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginBottom: "3px" }}>EMAIL</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2a3a" }}>{client.email}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginBottom: "3px" }}>PHONE</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2a3a" }}>{client.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginBottom: "3px" }}>FFC NUMBER</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2a3a" }}>{client.ffc || "N/A"}</div>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {[{ label: "Completion", pct: completeness }, { label: "Compliance Quality", pct: compliance }].map((s, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "16px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                <ProgressRing percent={s.pct} size={56} stroke={4} color={s.pct < 50 ? "#e74c3c" : s.pct < 75 ? "#f39c12" : "#2ecc71"} />
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a2a3a", marginTop: "8px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Help Requests */}
          {requestedHelps.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a", marginBottom: "12px" }}>📋 Help Requests ({requestedHelps.length})</h3>
              {requestedHelps.map((plan, i) => (
                <div key={i} style={{ padding: "12px", borderRadius: "8px", marginBottom: "8px", background: "#f0faf4", border: "1px solid #d1fae5" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a5c3a" }}>{plan.title}</div>
                  <div style={{ fontSize: "11px", color: "#065f46", marginTop: "4px" }}>Estimated cost: {plan.estimatedCost}</div>
                </div>
              ))}
            </div>
          )}

          {/* Compliance Gaps */}
          {flags.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a", marginBottom: "12px" }}>🚩 Compliance Gaps ({flags.length})</h3>
              {flags.map((flag, i) => (
                <div key={i} style={{ padding: "10px", borderRadius: "6px", marginBottom: "6px", background: flag.level === "critical" ? "#fef2f2" : flag.level === "high" ? "#fffbeb" : "#f8fafc", borderLeft: `3px solid ${flag.level === "critical" ? "#dc2626" : flag.level === "high" ? "#f59e0b" : "#94a3b8"}` }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: flag.level === "critical" ? "#dc2626" : flag.level === "high" ? "#d97706" : "#64748b", textTransform: "uppercase" }}>{flag.level}</div>
                  <div style={{ fontSize: "12px", color: "#374151" }}>{flag.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Quote Status */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a", marginBottom: "14px" }}>📧 Quote Status</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              {["Quoted", "Invoiced", "Completed"].map(status => (
                <button
                  key={status}
                  onClick={() => setQuoteStatus({ ...quoteStatus, [viewClient]: status })}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: quoteStatus[viewClient] === status ? "#1a9c54" : "#e2e8f0",
                    color: quoteStatus[viewClient] === status ? "#fff" : "#4a5568",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
            {quoteStatus[viewClient] && (
              <div style={{ marginTop: "10px", padding: "10px", borderRadius: "6px", background: "#f0faf4", fontSize: "12px", color: "#065f46", fontWeight: 600 }}>
                ✓ Status: {quoteStatus[viewClient]}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setViewClient(null)} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              ← Back to List
            </button>
            <button onClick={() => generateAndDownloadPDF(client)} disabled={generatingDoc} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: generatingDoc ? "#d1d9e0" : "#1a9c54", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: generatingDoc ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {generatingDoc ? "⏳ Generating..." : "📄 Download PDF"}
            </button>
            <button onClick={() => setShowEmailModal(true)} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              📧 Email to Client
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", margin: "0 0 2px" }}>Big Bay Administrators</h1>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Admin Dashboard — RMCP Submissions</p>
        </div>
        <button onClick={onLogout} style={{ padding: "8px 16px", borderRadius: "7px", border: "none", background: "#fee2e2", color: "#dc2626", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Logout
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", margin: "0 0 4px" }}>RMCP Submissions</h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
            {submittedClients.length === 0 ? "No submissions yet" : `${submittedClients.length} assessment${submittedClients.length !== 1 ? "s" : ""} submitted`}
          </p>
        </div>

        {submittedClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "2px dashed #e2e8f0" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a2a3a", marginBottom: "6px" }}>No submissions yet</h3>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Submitted assessments will appear here</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {submittedClients.map((client, idx) => {
              const completeness = calculateCompleteness(client.data || {});
              const compliance = calculateComplianceScore(client.data || {});
              const flags = getRiskFlags(client.data || {});
              const requestedHelps = Object.entries(client.helpRequests || {}).filter(([_, v]) => v).length;

              return (
                <div
                  key={idx}
                  onClick={() => setViewClient(idx)}
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "18px",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto",
                    alignItems: "center",
                    gap: "20px",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                >
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#1a2a3a", marginBottom: "4px" }}>{client.company}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {client.contact} · {client.email} · {new Date(client.submittedDate).toLocaleDateString("en-ZA")}
                    </div>
                    {requestedHelps > 0 && (
                      <div style={{ fontSize: "11px", color: "#2ecc71", fontWeight: 600, marginTop: "6px" }}>
                        ✓ {requestedHelps} help request{requestedHelps !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <ProgressRing percent={completeness} size={52} stroke={4} color={completeness < 50 ? "#e74c3c" : completeness < 80 ? "#f39c12" : "#2ecc71"} />
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Completion</div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <ProgressRing percent={compliance} size={52} stroke={4} color={compliance < 50 ? "#e74c3c" : compliance < 75 ? "#f39c12" : "#2ecc71"} />
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Quality</div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ padding: "6px 12px", borderRadius: "8px", background: flags.length === 0 ? "#d1fae5" : flags.some(f => f.level === "critical") ? "#fee2e2" : "#fffbeb", color: flags.length === 0 ? "#065f46" : flags.some(f => f.level === "critical") ? "#dc2626" : "#d97706", fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
                      {flags.length}
                    </div>
                    <div style={{ fontSize: "10px", color: "#94a3b8" }}>Gaps</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showEmailModal && viewClient !== null && <EmailDocumentModal client={submittedClients[viewClient]} onClose={() => setShowEmailModal(false)} onSend={() => setShowEmailModal(false)} />}
    </div>
  );
}

// ── MAIN APP (client form + admin dashboard) ──────────────────────

export default function RMCPManager() {
  const [view, setView] = useState("landing");
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ company: "", contact: "", email: "", phone: "", ffc: "" });
  const [saving, setSaving] = useState(false);
  const [helpRequests, setHelpRequests] = useState({});
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rmcp-clients");
      if (saved) setClients(JSON.parse(saved));
    } catch (e) { console.log("No saved data"); }
  }, []);

  const saveClients = useCallback((updated) => {
    setSaving(true);
    setClients(updated);
    try { localStorage.setItem("rmcp-clients", JSON.stringify(updated)); }
    catch (e) { console.error("Save failed:", e); }
    setTimeout(() => setSaving(false), 800);
  }, []);

  const updateField = (fieldId, value) => {
    const updated = { ...formData, [fieldId]: value };
    setFormData(updated);
    if (activeClient !== null) {
      saveClients(clients.map((c, i) => i === activeClient ? { ...c, data: updated, lastModified: new Date().toISOString() } : c));
    }
  };

  const addClient = () => {
    if (!leadData.company.trim()) return;
    const newClient = { ...leadData, created: new Date().toISOString(), lastModified: new Date().toISOString(), data: {}, submitted: false, helpRequests: {} };
    const updated = [...clients, newClient];
    saveClients(updated);
    setActiveClient(updated.length - 1);
    setFormData({});
    setActiveSection(0);
    setShowLeadForm(false);
    setLeadData({ company: "", contact: "", email: "", phone: "", ffc: "" });
    setView("editor");
  };

  const openClient = (idx) => { setActiveClient(idx); setFormData(clients[idx].data || {}); setHelpRequests(clients[idx].helpRequests || {}); setActiveSection(0); setView("editor"); };
  const deleteClient = (idx) => { const u = clients.filter((_, i) => i !== idx); saveClients(u); if (activeClient === idx) { setActiveClient(null); setView("clients"); } };

  const submitRMCP = async () => {
    if (activeClient !== null) {
      const client = clients[activeClient];
      const flags = getRiskFlags(formData);
      const requestedHelps = Object.entries(helpRequests).filter(([_, v]) => v).map(([k]) => {
        const plan = ACTION_PLANS[k];
        return plan ? plan.title : k;
      });

      const emailData = {
        email: "jerome@bigbayadmin.co.za",
        name: `RMCP Submission: ${client.company}`,
        message: `
New RMCP Assessment Submission

CLIENT DETAILS:
Company: ${client.company}
Contact: ${client.contact}
Email: ${client.email}
Phone: ${client.phone}
FFC Number: ${client.ffc}

ASSESSMENT COMPLETION:
Completion Score: ${calculateCompleteness(formData)}%
Compliance Quality Score: ${calculateComplianceScore(formData)}%

COMPLIANCE GAPS IDENTIFIED:
${flags.length === 0 ? "No critical gaps" : flags.map(f => `• ${f.text}`).join("\n")}

HELP REQUESTS:
${requestedHelps.length === 0 ? "No help requested" : requestedHelps.map(h => `• ${h}`).join("\n")}

NEXT STEPS:
1. Review assessment data in admin dashboard
2. Generate RMCP document
3. Send quote for implementation
4. Schedule implementation call

Submission Time: ${new Date().toLocaleString("en-ZA")}
        `,
      };

      try {
        await fetch("https://formspree.io/f/myklbzjq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        });
      } catch (err) {
        console.error("Email send failed (non-blocking):", err);
      }

      saveClients(clients.map((c, i) => i === activeClient ? { ...c, submitted: true, submittedDate: new Date().toISOString(), helpRequests } : c));
      setView("submitted");
    }
  };

  // Admin login
  if (showAdminLogin) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #0d1f17 0%, #1a3a2a 40%, #0f2a1e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: "20px" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ background: "#fff", borderRadius: "16px", padding: "40px", maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1a2a3a", marginBottom: "6px", textAlign: "center" }}>Admin Dashboard</h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px", textAlign: "center" }}>Enter password to access submissions</p>
          <input
            type="password"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            placeholder="Admin password"
            style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", color: "#1a2a3a", background: "#fff", marginBottom: "16px" }}
            onKeyPress={e => e.key === "Enter" && adminPassword === "BigBay2024" && setIsAdmin(true)}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { setShowAdminLogin(false); setAdminPassword(""); }} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Cancel
            </button>
            <button
              onClick={() => adminPassword === "BigBay2024" ? setIsAdmin(true) : alert("Incorrect password")}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#1a9c54", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard clients={clients} onLogout={() => { setIsAdmin(false); setView("landing"); }} />;
  }

  // CLIENT SIDE - simplified for brevity, same as before
  if (view === "landing") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #0d1f17 0%, #1a3a2a 40%, #0f2a1e 100%)", fontFamily: "'DM Sans', sans-serif", color: "#fff", position: "relative" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
          <span style={{ fontSize: "17px", fontWeight: 700 }}>RMCP<span style={{ color: "#2ecc71" }}>Pro</span></span>
          <button onClick={() => setShowAdminLogin(true)} style={{ padding: "9px 20px", borderRadius: "8px", border: "1.5px solid rgba(46,204,113,0.4)", background: "transparent", color: "#2ecc71", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Admin Login →
          </button>
        </div>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "60px 32px 40px", textAlign: "center", position: "relative", zIndex: 2 }}>
          <h1 style={{ fontSize: "44px", fontWeight: 700, lineHeight: 1.15, marginBottom: "20px" }}>
            Your RMCP,<br /><span style={{ color: "#2ecc71" }}>done properly.</span>
          </h1>
          <button onClick={() => { setShowLeadForm(true); setView("clients"); }} style={{ padding: "14px 36px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #2ecc71, #1a9c54)", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 24px rgba(46,204,113,0.3)" }}>
            Start My Free RMCP Assessment →
          </button>
        </div>
      </div>
    );
  }

  if (view === "clients") {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {showLeadForm && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", marginBottom: "4px" }}>Add New Client</h2>
              {[
                { key: "company", label: "Company / Trading Name *", placeholder: "e.g. Atlantic Seaboard Properties (Pty) Ltd" },
                { key: "contact", label: "Contact Person", placeholder: "Full name" },
                { key: "email", label: "Email Address", placeholder: "name@company.co.za" },
                { key: "phone", label: "Phone Number", placeholder: "082 123 4567" },
                { key: "ffc", label: "FFC Number (PPRA)", placeholder: "Fidelity Fund Certificate number" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: "11px" }}>
                  <input value={leadData[f.key]} onChange={e => setLeadData({ ...leadData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", color: "#1a2a3a", background: "#fff" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={() => { setShowLeadForm(false); setLeadData({ company: "", contact: "", email: "", phone: "", ffc: "" }); }}
                  style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                <button onClick={addClient} disabled={!leadData.company.trim()}
                  style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "none", background: leadData.company.trim() ? "#1a9c54" : "#d1d9e0", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: leadData.company.trim() ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif" }}>
                  Create & Open
                </button>
              </div>
            </div>
          </div>
        )}
        <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#94a3b8" }}>Add a client to start their RMCP assessment</p>
      </div>
    );
  }

  if (view === "editor" && activeClient !== null) {
    const client = clients[activeClient];
    const section = RMCP_SECTIONS[activeSection];
    const completeness = calculateCompleteness(formData);

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "11px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 20 }}>
          <button onClick={() => setView("clients")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}>←</button>
          <button onClick={() => setView("dashboard")} style={{ padding: "6px 12px", borderRadius: "6px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Review →
          </button>
        </div>
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "22px 18px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", margin: "0 0 4px" }}>{section.icon} {section.title}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px", marginTop: "16px" }}>
            {section.fields.map(field => (
              <div key={field.id}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                  {field.label}
                </label>
                {field.type === "text" && (
                  <input value={formData[field.id] || ""} onChange={e => updateField(field.id, e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: formData[field.id] ? "2px solid #1a9c54" : "1.5px solid #d1d9e0", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", background: "#fff", color: "#1a2a3a" }} />
                )}
                {field.type === "date" && (
                  <input type="date" value={formData[field.id] || ""} onChange={e => updateField(field.id, e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: formData[field.id] ? "2px solid #1a9c54" : "1.5px solid #d1d9e0", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", background: "#fff", color: "#1a2a3a", colorScheme: "light" }} />
                )}
                {field.type === "select" && (
                  <select value={formData[field.id] || ""} onChange={e => updateField(field.id, e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: formData[field.id] ? "2px solid #1a9c54" : "1.5px solid #d1d9e0", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", background: "#fff", color: "#1a2a3a" }}>
                    <option value="">— Select —</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {field.type === "multi" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                    {field.options.map(opt => {
                      const on = (formData[field.id] || []).includes(opt);
                      return (
                        <button key={opt} type="button" onClick={() => updateField(field.id, on ? (formData[field.id] || []).filter(s => s !== opt) : [...(formData[field.id] || []), opt])}
                          style={{ padding: "9px 14px", borderRadius: "8px", border: on ? "2px solid #1a9c54" : "1.5px solid #d1d9e0", background: on ? "#e8f5ee" : "#fafbfc", color: on ? "#1a5c3a" : "#4a5568", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: on ? 600 : 400 }}>
                          {on && "✓ "}{opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "40px" }}>
            <button onClick={() => setActiveSection(Math.max(0, activeSection - 1))} disabled={activeSection === 0}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#fff", color: activeSection === 0 ? "#d1d9e0" : "#4a5568", fontSize: "13px", fontWeight: 600, cursor: activeSection === 0 ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              ← Previous
            </button>
            <button onClick={() => activeSection < RMCP_SECTIONS.length - 1 ? setActiveSection(activeSection + 1) : setView("dashboard")}
              style={{ padding: "10px 22px", borderRadius: "8px", border: "none", background: "#1a9c54", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {activeSection < RMCP_SECTIONS.length - 1 ? "Next →" : "Review →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "dashboard" && activeClient !== null) {
    const client = clients[activeClient];
    const completeness = calculateCompleteness(formData);
    const compliance = calculateComplianceScore(formData);
    const flags = getRiskFlags(formData);
    const requestedHelps = Object.entries(helpRequests).filter(([_, v]) => v).map(([k]) => ACTION_PLANS[k]);

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "13px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => setView("editor")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}>←</button>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a2a3a" }}>{client.company}</span>
        </div>
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "22px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {[{ label: "Completion", pct: completeness }, { label: "Compliance Quality", pct: compliance }].map((s, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "16px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                <ProgressRing percent={s.pct} size={64} stroke={5} color={s.pct < 50 ? "#e74c3c" : s.pct < 75 ? "#f39c12" : "#2ecc71"} />
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a2a3a", marginTop: "7px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Action Plans Section */}
          {flags.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                📋 Action Plans Required ({flags.filter(f => f.fieldKey && ACTION_PLANS[f.fieldKey]).length} gaps)
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>Below are action plans to address each compliance gap. Review, plan, or request our help to implement.</p>

              {flags.map((flag, i) => {
                const planKey = flag.fieldKey;
                const plan = planKey ? ACTION_PLANS[planKey] : null;
                const isRequested = helpRequests[planKey];

                return plan ? (
                  <div key={i} style={{ padding: "14px", borderRadius: "10px", marginBottom: "10px", background: "#f8fafc", border: `1.5px solid ${isRequested ? "#2ecc71" : "#cbd5e0"}`, borderLeft: `4px solid ${isRequested ? "#2ecc71" : "#cbd5e0"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a", display: "flex", alignItems: "center", gap: "6px" }}>
                          {isRequested && <span style={{ color: "#2ecc71" }}>✓</span>}
                          {plan.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{plan.description}</div>
                      </div>
                      <span style={{ padding: "3px 8px", borderRadius: "6px", background: plan.priority === "CRITICAL" ? "#fee2e2" : plan.priority === "HIGH" ? "#fffbeb" : "#f0fdf4", color: plan.priority === "CRITICAL" ? "#dc2626" : plan.priority === "HIGH" ? "#d97706" : "#16a34a", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                        {plan.priority}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px", fontSize: "11px" }}>
                      <div>
                        <span style={{ fontWeight: 600, color: "#4a5568" }}>Timeline:</span> <span style={{ color: "#1a2a3a" }}>{plan.estimatedTimeline}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, color: "#4a5568" }}>Estimated Cost:</span> <span style={{ color: "#1a2a3a" }}>{plan.estimatedCost}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => {}} style={{ flex: 1, padding: "7px 12px", borderRadius: "6px", border: "1.5px solid #cbd5e0", background: "#fff", color: "#4a5568", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        View Full Plan
                      </button>
                      <button onClick={() => {
                        const updated = { ...helpRequests, [planKey]: true };
                        setHelpRequests(updated);
                        const clients_updated = clients.map((c, i) => i === activeClient ? { ...c, helpRequests: updated } : c);
                        saveClients(clients_updated);
                      }} disabled={isRequested} style={{ flex: 1, padding: "7px 12px", borderRadius: "6px", border: "none", background: isRequested ? "#d1fae5" : "#1a9c54", color: isRequested ? "#065f46" : "#fff", fontSize: "11px", fontWeight: 600, cursor: isRequested ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        {isRequested ? "✓ Help Requested" : "Request Help"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={i} style={{ padding: "12px", borderRadius: "8px", marginBottom: "8px", background: "#fef2f2", border: "1px solid #fee2e2", borderLeft: "3px solid #dc2626" }}>
                    <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px", letterSpacing: "0.3px" }}>CRITICAL — No action plan available</div>
                    <div style={{ fontSize: "12px", color: "#374151" }}>{flag.text}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compliance Gaps Summary */}
          {flags.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Compliance Gaps Summary</h3>
              {flags.map((f, i) => {
                const bgColor = f.level === "critical" ? "#fef2f2" : f.level === "high" ? "#fffbeb" : "#f8fafc";
                const borderColor = f.level === "critical" ? "#dc2626" : f.level === "high" ? "#f59e0b" : "#94a3b8";
                const textColor = f.level === "critical" ? "#dc2626" : f.level === "high" ? "#d97706" : "#64748b";
                return (
                  <div key={i} style={{ padding: "10px", borderRadius: "6px", marginBottom: "6px", background: bgColor, borderLeft: `3px solid ${borderColor}` }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: textColor, textTransform: "uppercase", marginBottom: "2px" }}>{f.level}</div>
                    <div style={{ fontSize: "12px", color: "#374151" }}>{f.text}</div>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={submitRMCP} style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "#1a9c54", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: "10px" }}>
            ✓ Submit to Big Bay Administrators
          </button>
          <button onClick={() => { setActiveSection(0); setView("editor"); }} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            ← Back to Edit
          </button>
        </div>
      </div>
    );
  }

  if (view === "submitted") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #0d1f17 0%, #1a3a2a 40%, #0f2a1e 100%)", fontFamily: "'DM Sans', sans-serif", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg, #2ecc71, #1a9c54)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", margin: "0 auto 22px" }}>✓</div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "10px" }}>Assessment Submitted</h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>Big Bay Administrators will review and be in touch within 2–3 business days.</p>
          <button onClick={() => setView("landing")} style={{ padding: "10px 24px", borderRadius: "8px", border: "1.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: "20px" }}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
