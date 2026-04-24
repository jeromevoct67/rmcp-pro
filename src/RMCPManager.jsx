import { useState, useEffect, useCallback } from "react";

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

// ── ACTION PLAN LIBRARY ───────────────────────────────────────────────
const ACTION_PLANS = {
  "training_policy:Not yet established": {
    title: "Staff AML/CFT Training Programme",
    description: "Establish mandatory annual training for all staff on money laundering identification and reporting obligations",
    steps: [
      { step: 1, action: "Enrol staff in external online AML/CFT course", owner: "Compliance Officer", timeline: "Days 1–7", cost: "R2,500 per person", details: "Options: FIC-endorsed courses, FAIS providers, or university extension" },
      { step: 2, action: "Schedule in-house annual refresher workshop", owner: "Compliance Officer", timeline: "Days 8–21", cost: "R500–R1,500", details: "1-day workshop covering institution-specific procedures and case studies" },
      { step: 3, action: "Document training attendance and completion", owner: "Compliance Officer", timeline: "Ongoing", cost: "R0", details: "Maintain training register with dates, attendees, and test scores" },
      { step: 4, action: "Review and update training content annually", owner: "Compliance Officer", timeline: "Annually", cost: "R0", details: "Ensure training reflects regulatory updates and lessons learned" },
    ],
    estimatedTimeline: "30 days",
    estimatedCost: "R2,500–R5,000 initial + R500/year refresher",
    priority: "HIGH",
    law: "FICA s43(1)(c)",
  },

  "pep_screening:Not yet established": {
    title: "PEP Screening Process",
    description: "Implement systematic screening of clients against Politically Exposed Persons lists before onboarding",
    steps: [
      { step: 1, action: "Subscribe to third-party PEP screening service", owner: "Compliance Officer", timeline: "Days 1–3", cost: "R800–R1,500/month", details: "Options: Lexis Nexis, Equifax, XDS, or FIC goAML integration" },
      { step: 2, action: "Integrate screening into client onboarding checklist", owner: "All staff", timeline: "Days 4–7", cost: "R0", details: "Add screening requirement to new client acceptance form" },
      { step: 3, action: "Train staff on using screening tool", owner: "Compliance Officer", timeline: "Days 8–14", cost: "R0", details: "1-hour training session on how to conduct and document screens" },
      { step: 4, action: "Document all screenings and results", owner: "All staff", timeline: "Ongoing", cost: "R0", details: "Maintain screening audit trail for 5 years minimum" },
    ],
    estimatedTimeline: "14 days",
    estimatedCost: "R800–R1,500/month subscription + R5,000 setup",
    priority: "HIGH",
    law: "FICA s21B",
  },

  "record_system:Paper-based filing only": {
    title: "Digitise Compliance Records",
    description: "Move compliance and CDD records from paper to secure cloud-based storage with automated backups",
    steps: [
      { step: 1, action: "Select cloud storage platform", owner: "Compliance Officer", timeline: "Days 1–2", cost: "R200–R500/month", details: "Options: Google Drive, Dropbox, OneDrive, or dedicated compliance platform" },
      { step: 2, action: "Scan and digitise existing paper records", owner: "Admin staff", timeline: "Days 3–21", cost: "R0 (internal)", details: "Scan all active client files and transaction records; archive paper securely" },
      { step: 3, action: "Set up automated daily cloud backups", owner: "IT / Compliance Officer", timeline: "Days 22–23", cost: "R0 (included in subscription)", details: "Enable backup automation and test recovery procedure" },
      { step: 4, action: "Train staff on digital record protocols", owner: "Compliance Officer", timeline: "Days 24–28", cost: "R0", details: "Ensure all staff know how to access, upload, and retrieve records securely" },
    ],
    estimatedTimeline: "28 days",
    estimatedCost: "R200–R500/month",
    priority: "MEDIUM",
    law: "FICA s22–23",
  },

  "backup_process:No backup process in place": {
    title: "Implement Compliance Record Backup System",
    description: "Establish automated daily backups of all compliance records to protect against data loss",
    steps: [
      { step: 1, action: "Set up cloud backup automation", owner: "Compliance Officer", timeline: "Days 1–3", cost: "R200–R400/month", details: "Configure automatic nightly backups to cloud storage (Google Drive, Dropbox, AWS)" },
      { step: 2, action: "Test backup and recovery process", owner: "Compliance Officer", timeline: "Days 4–7", cost: "R0", details: "Perform test restore to confirm backups are working" },
      { step: 3, action: "Document backup procedures", owner: "Compliance Officer", timeline: "Days 8–10", cost: "R0", details: "Create written procedure for backup management and recovery" },
      { step: 4, action: "Monthly backup verification", owner: "Compliance Officer", timeline: "Monthly", cost: "R0", details: "Test at least one backup recovery monthly to ensure integrity" },
    ],
    estimatedTimeline: "10 days",
    estimatedCost: "R200–R400/month",
    priority: "MEDIUM",
    law: "FICA s22–23",
  },

  "retention_period:Not yet specified": {
    title: "Establish Record Retention Policy",
    description: "Formalise how long compliance records are kept (minimum 5 years required by FICA)",
    steps: [
      { step: 1, action: "Draft retention policy document", owner: "Compliance Officer", timeline: "Days 1–5", cost: "R0", details: "Specify 5-year minimum retention from end of business relationship" },
      { step: 2, action: "Board/management approval", owner: "Management", timeline: "Days 6–14", cost: "R0", details: "Present policy to board or senior management for formal approval" },
      { step: 3, action: "Communicate to all staff", owner: "Compliance Officer", timeline: "Days 15–21", cost: "R0", details: "Distribute policy, hold brief training, collect acknowledgement signatures" },
      { step: 4, action: "Annual review of retention schedule", owner: "Compliance Officer", timeline: "Annually", cost: "R0", details: "Review and update retention requirements as needed" },
    ],
    estimatedTimeline: "21 days",
    estimatedCost: "R0 (internal effort only)",
    priority: "MEDIUM",
    law: "FICA s22–23",
  },

  "destruction_policy:Not yet established": {
    title: "Create Record Destruction Policy",
    description: "Establish formal procedures for secure destruction of records after the retention period expires",
    steps: [
      { step: 1, action: "Draft destruction policy", owner: "Compliance Officer", timeline: "Days 1–5", cost: "R0", details: "Specify: who can authorise destruction, method (shredding/deletion), documentation required" },
      { step: 2, action: "Arrange destruction service or equipment", owner: "Compliance Officer", timeline: "Days 6–14", cost: "R500–R1,500/year", details: "Contract secure document destruction service OR purchase shredder for office" },
      { step: 3, action: "Board/management approval", owner: "Management", timeline: "Days 15–21", cost: "R0", details: "Present policy for formal written approval" },
      { step: 4, action: "Maintain destruction audit trail", owner: "Compliance Officer", timeline: "Ongoing", cost: "R0", details: "Log each destruction event with date, records, authorisation, and method" },
    ],
    estimatedTimeline: "21 days",
    estimatedCost: "R500–R1,500/year for destruction service",
    priority: "MEDIUM",
    law: "FICA s22–23",
  },

  "board_approval_date:": {
    title: "Obtain Formal RMCP Board Approval",
    description: "Schedule management meeting to formally approve this RMCP as required by FICA s43",
    steps: [
      { step: 1, action: "Schedule board or management meeting", owner: "Compliance Officer", timeline: "Days 1–7", cost: "R0", details: "Identify decision-maker(s) and proposed date within next 14 days" },
      { step: 2, action: "Prepare RMCP presentation", owner: "Compliance Officer", timeline: "Days 8–10", cost: "R0", details: "Summarise key policies, gaps, and requirements for board approval" },
      { step: 3, action: "Present RMCP and obtain approval", owner: "Compliance Officer", timeline: "Days 11–14", cost: "R0", details: "Present document, answer questions, obtain signed board resolution" },
      { step: 4, action: "Communicate approval to all staff", owner: "Compliance Officer", timeline: "Days 15–21", cost: "R0", details: "Distribute approved RMCP to all staff with memo explaining changes" },
    ],
    estimatedTimeline: "21 days",
    estimatedCost: "R0 (internal effort only)",
    priority: "CRITICAL",
    law: "FICA s43(1)(b)",
  },

  "str_process:Not yet registered on goAML": {
    title: "Register on FIC goAML Platform",
    description: "Register your institution on the Financial Intelligence Centre's goAML reporting system for STR/CTR/TPR filing",
    steps: [
      { step: 1, action: "Visit FIC goAML website", owner: "Compliance Officer", timeline: "Days 1–2", cost: "R0", details: "Go to goaml.fic.gov.za and create institution profile" },
      { step: 2, action: "Complete registration form", owner: "Compliance Officer", timeline: "Days 3–7", cost: "R0", details: "Provide institution details, FFC number, compliance officer info, banking details" },
      { step: 3, action: "Receive login credentials", owner: "Compliance Officer", timeline: "Days 8–14", cost: "R0", details: "FIC will email credentials within 5–7 business days; set up secure password" },
      { step: 4, action: "Train staff on goAML reporting", owner: "Compliance Officer", timeline: "Days 15–21", cost: "R0", details: "Brief training on how to file STR, CTR, and TPR reports via goAML" },
    ],
    estimatedTimeline: "21 days",
    estimatedCost: "R0 (free to register)",
    priority: "CRITICAL",
    law: "FICA s29, s43",
  },

  "sanctions_screening:Not yet established": {
    title: "Implement UN Sanctions Screening",
    description: "Establish process to screen all clients against UN Security Council targeted financial sanctions lists",
    steps: [
      { step: 1, action: "Subscribe to automated screening service", owner: "Compliance Officer", timeline: "Days 1–3", cost: "R400–R1,000/month", details: "Options: Lexis Nexis World-Check, Equifax, or goAML UN list integration" },
      { step: 2, action: "Integrate screening into onboarding", owner: "All staff", timeline: "Days 4–7", cost: "R0", details: "Add UN sanctions check to new client acceptance workflow" },
      { step: 3, action: "Train staff on sanctions procedures", owner: "Compliance Officer", timeline: "Days 8–14", cost: "R0", details: "Train on: how to screen, what 'hit' means, immediate escalation to Compliance Officer" },
      { step: 4, action: "Document all screenings and matches", owner: "All staff", timeline: "Ongoing", cost: "R0", details: "Maintain 5-year audit trail of all sanctions screening results" },
    ],
    estimatedTimeline: "14 days",
    estimatedCost: "R400–R1,000/month",
    priority: "HIGH",
    law: "FICA s43, UN Security Council resolutions",
  },

  "tipping_off:Not yet addressed": {
    title: "Create Tipping-Off Prevention Policy",
    description: "Develop and communicate policy prohibiting disclosure of STR/CTR filings to suspects (FICA s29(2))",
    steps: [
      { step: 1, action: "Draft tipping-off policy", owner: "Compliance Officer", timeline: "Days 1–5", cost: "R0", details: "Include: what tipping-off is, consequences, who can be told, confidentiality requirements" },
      { step: 2, action: "Board/management approval", owner: "Management", timeline: "Days 6–14", cost: "R0", details: "Obtain signed approval; emphasise it's a criminal offence under FICA" },
      { step: 3, action: "Train all staff", owner: "Compliance Officer", timeline: "Days 15–21", cost: "R0", details: "Mandatory training: explain tipping-off risks, case examples, sign-off on understanding" },
      { step: 4, action: "Annual refresher training", owner: "Compliance Officer", timeline: "Annually", cost: "R0", details: "Include tipping-off prohibition in annual AML/CFT training for all staff" },
    ],
    estimatedTimeline: "21 days",
    estimatedCost: "R0 (internal effort only)",
    priority: "HIGH",
    law: "FICA s29(2) — Criminal offence",
  },
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

function getSectionCompleteness(section, data) {
  let total = 0, filled = 0;
  section.fields.forEach(f => {
    total++;
    const v = data[f.id];
    if (v && (Array.isArray(v) ? v.length > 0 : v.trim() !== "")) filled++;
  });
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

function calculateComplianceScore(data) {
  let score = 0, max = 0;
  const scoring = {
    compliance_officer: { filled: 10 },
    board_approval_date: { filled: 8 },
    training_policy: { values: { "Annual workshops": 10, "Online modules": 8, "External provider": 10, "In-house training": 7, "Not yet established": 2 } },
    str_process: { values: { "Registered on goAML and actively filing": 10, "Registered on goAML but not yet filed": 6, "Not yet registered on goAML": 2, "Our compliance provider files on our behalf": 7 } },
    ctr_process: { values: { "Filed via goAML automatically": 10, "Filed manually via goAML": 8, "Not applicable — we do not accept cash above the threshold": 7, "Not yet established": 2 } },
    sanctions_screening: { values: { "Automated screening tool integrated into onboarding": 10, "Manual check against UN and SA sanctions lists": 7, "Third-party screening service provider": 9, "Not yet established": 2 } },
    pep_screening: { values: { "Manual checklist against known PEP list": 6, "Third-party screening tool": 10, "Online database check": 8, "Not yet established": 2 } },
    record_system: { values: { "Digital — cloud-based system": 10, "Digital — local server or computer": 8, "Paper-based filing only": 4, "Hybrid — both digital and paper": 7, "Practice management software with compliance module": 9 } },
    retention_period: { values: { "5 years (FICA minimum)": 7, "7 years": 9, "10 years": 10, "Indefinitely": 8, "Not yet specified": 2 } },
    tipping_off: { values: { "Yes — policy in place and staff are trained": 10, "Yes — policy drafted but staff not yet trained": 6, "Aware of the obligation but no policy yet": 3, "Not yet addressed": 1 } },
  };
  Object.entries(scoring).forEach(([id, rules]) => {
    if (rules.filled) { max += rules.filled; if (data[id] && data[id].trim() !== "") score += rules.filled; }
    else if (rules.values) { max += 10; if (data[id] && rules.values[data[id]] !== undefined) score += rules.values[data[id]]; }
  });
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

function getRiskFlags(data) {
  const flags = [];
  if (!data.compliance_officer) flags.push({ level: "critical", text: "No compliance officer designated — required under FICA s43", fieldKey: null });
  if (!data.board_approval_date) flags.push({ level: "high", text: "RMCP not formally approved by management", fieldKey: "board_approval_date:" });
  if (data.str_process === "Not yet registered on goAML") flags.push({ level: "critical", text: "Not registered on goAML — cannot file STRs or CTRs", fieldKey: "str_process:Not yet registered on goAML" });
  if (data.sanctions_screening === "Not yet established") flags.push({ level: "high", text: "No sanctions screening process — UN TFS compliance required", fieldKey: "sanctions_screening:Not yet established" });
  if (data.pep_screening === "Not yet established") flags.push({ level: "high", text: "No PEP screening process established", fieldKey: "pep_screening:Not yet established" });
  if (data.training_policy === "Not yet established") flags.push({ level: "medium", text: "Staff AML/CFT training not yet established", fieldKey: "training_policy:Not yet established" });
  if (data.tipping_off === "Not yet addressed") flags.push({ level: "high", text: "Tipping-off prevention not addressed", fieldKey: "tipping_off:Not yet addressed" });
  if (data.record_system === "Paper-based filing only") flags.push({ level: "medium", text: "Paper-only records — risk of loss or damage", fieldKey: "record_system:Paper-based filing only" });
  if (data.retention_period === "Not yet specified") flags.push({ level: "high", text: "No record retention period stated — 5 years minimum required", fieldKey: "retention_period:Not yet specified" });
  if (data.backup_process === "No backup process in place") flags.push({ level: "high", text: "No backup for compliance records", fieldKey: "backup_process:No backup process in place" });
  if (!data.risk_assessment_date) flags.push({ level: "medium", text: "Risk assessment date not recorded", fieldKey: null });
  if (data.destruction_policy === "Not yet established") flags.push({ level: "medium", text: "No record destruction policy", fieldKey: "destruction_policy:Not yet established" });
  return flags;
}

// ── COMPONENTS ────────────────────────────────────────────────────────

function SelectField({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const selected = value || "";
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "12px 40px 12px 14px", borderRadius: "8px",
        border: selected ? "2px solid #2463AE" : "1.5px solid #d1d9e0",
        fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
        boxSizing: "border-box", background: selected ? "#f0faf4" : "#fafbfc",
        color: "#1a2a3a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
        userSelect: "none", transition: "all 0.15s"
      }}>
        <span>{selected || "— Please select an answer —"}</span>
        <span style={{ color: selected ? "#2463AE" : "#9ca3af", fontSize: "11px", position: "absolute", right: "14px" }}>
          {selected ? "✓" : open ? "▲" : "▼"}
        </span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", borderRadius: "8px", border: "1.5px solid #d1d9e0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden"
        }}>
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                padding: "12px 16px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer", color: selected === opt ? "#1C5BA3" : "#1a2a3a",
                background: selected === opt ? "#e8f5ee" : "#fff",
                fontWeight: selected === opt ? 600 : 400,
                borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", gap: "8px",
                transition: "background 0.1s"
              }}
              onMouseEnter={e => { if (selected !== opt) e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={e => { if (selected !== opt) e.currentTarget.style.background = "#fff"; }}>
              {selected === opt && <span style={{ color: "#2463AE", fontSize: "12px" }}>✓</span>}
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelect({ options, selected = [], onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <button key={opt} type="button"
            onClick={() => onChange(on ? selected.filter(s => s !== opt) : [...selected, opt])}
            style={{
              padding: "9px 14px", borderRadius: "8px",
              border: on ? "2px solid #2463AE" : "1.5px solid #d1d9e0",
              background: on ? "#e8f5ee" : "#fafbfc",
              color: on ? "#1C5BA3" : "#4a5568",
              fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer", fontWeight: on ? 600 : 400,
              display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s"
            }}>
            {on && <span style={{ color: "#2463AE", fontSize: "11px" }}>✓</span>}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ProgressRing({ percent, size = 64, stroke = 5, color = "#1C5BA3" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8ecf0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - (percent / 100) * circ}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: size * 0.26, fontWeight: 700, fill: "#1a2a3a", fontFamily: "'DM Sans', sans-serif" }}>
        {percent}%
      </text>
    </svg>
  );
}

// ── ACTION PLAN MODAL ─────────────────────────────────────────────────
function ActionPlanModal({ plan, onClose, onRequestHelp }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", maxWidth: 700, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", marginBottom: "6px" }}>{plan.title}</h2>
        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>{plan.description}</p>

        <div style={{ background: "#f0faf4", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", border: "1px solid #d1fae5" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#059669", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "2px" }}>Timeline</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A4A8A" }}>{plan.estimatedTimeline}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#059669", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "2px" }}>Estimated Cost</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A4A8A" }}>{plan.estimatedCost}</div>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a", marginBottom: "12px" }}>Implementation Steps</h3>
        {plan.steps.map((s, i) => (
          <div key={i} style={{ marginBottom: "14px", paddingLeft: "20px", borderLeft: "2px solid #d1fae5" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#1C5BA3" }}>Step {s.step}: {s.action}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
              <span style={{ fontWeight: 600 }}>Owner:</span> {s.owner} · <span style={{ fontWeight: 600 }}>Timeline:</span> {s.timeline} · <span style={{ fontWeight: 600 }}>Cost:</span> {s.cost}
            </div>
            <div style={{ fontSize: "11px", color: "#4a5568", marginTop: "2px", fontStyle: "italic" }}>{s.details}</div>
          </div>
        ))}

        <div style={{ fontSize: "10px", color: "#94a3b8", padding: "10px 12px", background: "#f8fafc", borderRadius: "6px", marginBottom: "16px", borderLeft: "3px solid #cbd5e0" }}>
          <span style={{ fontWeight: 700 }}>Legal Requirement:</span> {plan.law}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Close
          </button>
          <button onClick={onRequestHelp} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#2463AE", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Request Help from Big Bay Administrators
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────

export default function RMCPManager() {
  const [view, setView] = useState("landing");
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ company: "", contact: "", email: "", phone: "", ffc: "" });
  const [saving, setSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [helpRequests, setHelpRequests] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [sectionError, setSectionError] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

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
    setSectionError(false);
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
      saveClients(clients.map((c, i) => i === activeClient ? { ...c, submitted: true, submittedDate: new Date().toISOString(), helpRequests } : c));
      setView("submitted");

      // Send notification email to Jerome
      try {
        const flags = getRiskFlags(formData);
        const comp = calculateCompleteness(formData);
        const qual = calculateComplianceScore(formData);
        const helpList = Object.keys(helpRequests).filter(k => helpRequests[k]);

        const notifyBody = `New RMCP Submission Received

Company: ${client.company}
Contact: ${client.contact}
Email: ${client.email}
Phone: ${client.phone || "N/A"}
FFC: ${client.ffc || "N/A"}
Submitted: ${new Date().toLocaleString("en-ZA")}

SCORES:
Completion: ${comp}%
Compliance Quality: ${qual}%

COMPLIANCE GAPS (${flags.length}):
${flags.map(f => `- [${f.level.toUpperCase()}] ${f.text}`).join("\n") || "None identified"}

HELP REQUESTED (${helpList.length}):
${helpList.map(k => `- ${k}`).join("\n") || "None requested"}

Login to the admin dashboard to review and generate their RMCP document.`;

        await fetch("https://rmcp-pro.vercel.app/api/send-rmcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail: "jerome@bigbayadmin.co.za",
            clientName: `NEW SUBMISSION: ${client.company}`,
            rmcpHtml: `<html><body><h1>New Submission: ${client.company}</h1><pre>${notifyBody}</pre></body></html>`,
            coverLetter: notifyBody,
          }),
        });
        console.log("✓ Notification sent to jerome@bigbayadmin.co.za");
      } catch (err) {
        // Don't block submission if notification fails
        console.error("Notification failed:", err.message);
      }
    }
  };

  const requestHelp = (planKey) => {
    setHelpRequests({ ...helpRequests, [planKey]: true });
    const client = clients[activeClient];
    const updated = clients.map((c, i) => i === activeClient ? { ...c, helpRequests: { ...helpRequests, [planKey]: true } } : c);
    saveClients(updated);
    setSelectedPlan(null);
  };

  // ── DASHBOARD (with action plans) ──────────────────────────────────
  if (view === "dashboard" && activeClient !== null) {
    const client = clients[activeClient];
    const completeness = calculateCompleteness(formData);
    const compliance = calculateComplianceScore(formData);
    const flags = getRiskFlags(formData);

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "13px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => setView("editor")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}>←</button>
          <div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a2a3a" }}>{client.company}</span>
            <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "8px" }}>RMCP Review & Action Plans</span>
          </div>
        </div>

        <div style={{ maxWidth: 580, margin: "0 auto", padding: "22px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {[{ label: "Completion", sub: "Questions answered", pct: completeness }, { label: "Compliance Quality", sub: "Strength of your answers", pct: compliance }].map((s, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "16px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                <ProgressRing percent={s.pct} size={64} stroke={5} color={s.pct < 50 ? "#e74c3c" : s.pct < 75 ? "#f39c12" : "#6BA3E8"} />
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a2a3a", marginTop: "7px" }}>{s.label}</div>
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Action Plans Section */}
          {flags.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                📋 Action Plans Required ({flags.filter(f => ACTION_PLANS[f.fieldKey]).length} gaps)
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>Below are action plans to address each compliance gap. Review, plan, or request our help to implement.</p>

              {flags.map((flag, i) => {
                const planKey = flag.fieldKey;
                const plan = planKey ? ACTION_PLANS[planKey] : null;
                const isRequested = helpRequests[planKey];

                return plan ? (
                  <div key={i} style={{ padding: "14px", borderRadius: "10px", marginBottom: "10px", background: "#f8fafc", border: `1.5px solid ${isRequested ? "#6BA3E8" : "#cbd5e0"}`, borderLeft: `4px solid ${isRequested ? "#6BA3E8" : "#cbd5e0"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a", display: "flex", alignItems: "center", gap: "6px" }}>
                          {isRequested && <span style={{ color: "#6BA3E8" }}>✓</span>}
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
                      <button onClick={() => setSelectedPlan(plan)} style={{ flex: 1, padding: "7px 12px", borderRadius: "6px", border: "1.5px solid #cbd5e0", background: "#fff", color: "#4a5568", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        View Full Plan
                      </button>
                      <button onClick={() => requestHelp(planKey)} disabled={isRequested} style={{ flex: 1, padding: "7px 12px", borderRadius: "6px", border: "none", background: isRequested ? "#d1fae5" : "#2463AE", color: isRequested ? "#1A4A8A" : "#fff", fontSize: "11px", fontWeight: 600, cursor: isRequested ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
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

          {/* Section Progress */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Section Progress</h3>
            {RMCP_SECTIONS.map((s, i) => {
              const pct = getSectionCompleteness(s, formData);
              return (
                <div key={s.id} style={{ marginBottom: "8px", cursor: "pointer" }} onClick={() => { setActiveSection(i); setView("editor"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ fontSize: "12px", color: "#374151" }}>{s.icon} {s.title}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: pct === 100 ? "#059669" : pct > 0 ? "#d97706" : "#e74c3c" }}>
                      {pct === 100 ? "✓ Complete" : pct > 0 ? `${pct}%` : "Not started"}
                    </span>
                  </div>
                  <div style={{ height: "3px", borderRadius: "2px", background: "#f1f5f9" }}>
                    <div style={{ height: "100%", borderRadius: "2px", width: `${pct}%`, background: pct === 100 ? "#059669" : "#3b82f6", transition: "width 0.3s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit */}
          <button onClick={submitRMCP} style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(36,99,174,0.25)", marginBottom: "10px" }}>
            ✓ Submit to Big Bay Administrators for Review
          </button>
          <button onClick={() => { setActiveSection(0); setView("editor"); }} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            ← Back to Edit
          </button>
        </div>

        {selectedPlan && <ActionPlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} onRequestHelp={() => requestHelp(Object.keys(ACTION_PLANS).find(k => ACTION_PLANS[k] === selectedPlan))} />}
      </div>
    );
  }

  // ── LANDING ──────────────────────────────────────────────────────────
  if (view === "landing") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #050F24 0%, #0D2147 40%, #071A3B 100%)", fontFamily: "'DM Sans', sans-serif", color: "#fff", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(107,163,232,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⚖</div>
          <span style={{ fontSize: "17px", fontWeight: 700 }}>RMCP<span style={{ color: "#6BA3E8" }}>Pro</span></span>
        </div>
        <button onClick={() => setView("adminLogin")} style={{ padding: "9px 20px", borderRadius: "8px", border: "1.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Admin Login
        </button>
      </div>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "60px 32px 40px", textAlign: "center", position: "relative", zIndex: 2 }}>
        <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: "20px", background: "rgba(107,163,232,0.15)", border: "1px solid rgba(107,163,232,0.25)", fontSize: "11px", fontWeight: 600, color: "#6BA3E8", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "24px" }}>
          FICA Section 43 Compliance Tool
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 700, lineHeight: 1.15, marginBottom: "20px" }}>
          Your RMCP,<br /><span style={{ color: "#6BA3E8" }}>done properly.</span>
        </h1>
        <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", maxWidth: 500, margin: "0 auto 14px" }}>
          Answer a few simple questions about your property agency. We use your answers to build your Risk Management and Compliance Programme and show you action plans to close any gaps.
        </p>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "36px" }}>Takes about 10–15 minutes. No compliance knowledge needed.</p>
        <button onClick={() => setShowLeadForm(true)} style={{ padding: "14px 36px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 24px rgba(107,163,232,0.3)" }}>
          Start My Free RMCP Assessment →
        </button>
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap" }}>
          <button onClick={() => setShowExplainer(v => !v)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "underline", padding: 0 }}>
            {showExplainer ? "Hide explanation ▲" : "What is an RMCP? ▼"}
          </button>
          <a href="https://www.fic.gov.za/Resources/Pages/Legislation.aspx" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", textDecoration: "underline", fontFamily: "'DM Sans', sans-serif" }}>
            FIC Act (Section 43) →
          </a>
        </div>
        {showExplainer && (
          <div style={{ maxWidth: 520, margin: "16px auto 0", padding: "18px 22px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", textAlign: "left" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#6BA3E8", marginBottom: "10px", marginTop: 0 }}>What is an RMCP?</h3>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 10px" }}>
              A <strong style={{ color: "#fff" }}>Risk Management and Compliance Programme (RMCP)</strong> is a document required by the Financial Intelligence Centre Act (FICA) Section 43 for all accountable institutions — including property practitioners registered with the PPRA.
            </p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 10px" }}>
              Your RMCP must document how your agency identifies, assesses, and manages money laundering and terrorist financing risks. Without one, you are non-compliant and face penalties from the FIC.
            </p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: 0 }}>
              This tool guides you through the required sections. Big Bay Administrators then reviews your answers and produces your formal, signed RMCP document.
            </p>
          </div>
        )}
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "16px" }}>Big Bay Administrators reviews and finalises your RMCP document once complete.</p>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 32px 60px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", position: "relative", zIndex: 2 }}>
        {[
          { icon: "📝", title: "Simple questions", desc: "Plain language — no legal jargon. Just describe how your agency operates." },
          { icon: "📊", title: "Action plans included", desc: "See exactly how to fix each compliance gap — with timelines and costs." },
          { icon: "📄", title: "Professional document", desc: "Big Bay Administrators reviews your answers and produces your formal RMCP document." },
        ].map((f, i) => (
          <div key={i} style={{ padding: "20px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{f.icon}</div>
            <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>{f.title}</h3>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.5)", margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
      {showLeadForm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", marginBottom: "4px" }}>Start Your RMCP Assessment</h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "18px" }}>Enter your agency details to begin</p>
            {[
              { key: "company", label: "Company / Trading Name *", placeholder: "e.g. Atlantic Seaboard Properties (Pty) Ltd" },
              { key: "contact", label: "Contact Person", placeholder: "Full name" },
              { key: "email", label: "Email Address", placeholder: "name@company.co.za" },
              { key: "phone", label: "Phone Number", placeholder: "082 123 4567" },
              { key: "ffc", label: "FFC Number (PPRA)", placeholder: "Fidelity Fund Certificate number" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: "11px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{f.label}</label>
                <input value={leadData[f.key]} onChange={e => setLeadData({ ...leadData, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", color: "#1a2a3a" }}
                  onFocus={e => e.target.style.borderColor = "#2463AE"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={() => { setShowLeadForm(false); setLeadData({ company: "", contact: "", email: "", phone: "", ffc: "" }); }}
                style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={addClient} disabled={!leadData.company.trim()}
                style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "none", background: leadData.company.trim() ? "#2463AE" : "#d1d9e0", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: leadData.company.trim() ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif" }}>
                Start Assessment →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── CLIENT LIST ───────────────────────────────────────────────────────
  if (view === "clients") {
    if (!isAdmin) { setView("adminLogin"); return null; }
  }
  if (view === "clients") return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => setView("landing")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}>←</button>
          <div style={{ width: 28, height: 28, borderRadius: "7px", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>⚖</div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a2a3a" }}>RMCPPro <span style={{ fontWeight: 400, color: "#94a3b8" }}>Client Manager</span></span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {saving && <span style={{ fontSize: "11px", color: "#6BA3E8" }}>✓ Saved</span>}
          <button onClick={() => setShowLeadForm(true)} style={{ padding: "8px 16px", borderRadius: "7px", border: "none", background: "#2463AE", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Add Client</button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}>
        {showLeadForm && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", marginBottom: "4px" }}>Add New Client</h2>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "18px" }}>Enter the property agency details</p>
              {[
                { key: "company", label: "Company / Trading Name *", placeholder: "e.g. Atlantic Seaboard Properties (Pty) Ltd" },
                { key: "contact", label: "Contact Person", placeholder: "Full name" },
                { key: "email", label: "Email Address", placeholder: "name@company.co.za" },
                { key: "phone", label: "Phone Number", placeholder: "082 123 4567" },
                { key: "ffc", label: "FFC Number (PPRA)", placeholder: "Fidelity Fund Certificate number" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: "11px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{f.label}</label>
                  <input value={leadData[f.key]} onChange={e => setLeadData({ ...leadData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", color: "#1a2a3a" }}
                    onFocus={e => e.target.style.borderColor = "#2463AE"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                </div>
              ))}
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={() => { setShowLeadForm(false); setLeadData({ company: "", contact: "", email: "", phone: "", ffc: "" }); }}
                  style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                <button onClick={addClient} disabled={!leadData.company.trim()}
                  style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "none", background: leadData.company.trim() ? "#2463AE" : "#d1d9e0", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: leadData.company.trim() ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif" }}>
                  Create & Open
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#1a2a3a", margin: "0 0 3px" }}>Client RMCPs</h2>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>{clients.length === 0 ? "No clients yet" : `${clients.length} client${clients.length !== 1 ? "s" : ""}`}</p>
        </div>

        {clients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "#fff", borderRadius: "14px", border: "2px dashed #e2e8f0" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>📋</div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a2a3a", marginBottom: "6px" }}>No clients yet</h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Add a property practitioner to start their RMCP</p>
            <button onClick={() => setShowLeadForm(true)} style={{ padding: "10px 22px", borderRadius: "8px", border: "none", background: "#2463AE", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Add First Client</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {clients.map((client, idx) => {
              const pct = calculateCompleteness(client.data || {});
              const flags = getRiskFlags(client.data || {});
              const critical = flags.filter(f => f.level === "critical").length;
              return (
                <div key={idx} onClick={() => openClient(idx)}
                  style={{ background: "#fff", borderRadius: "12px", padding: "16px 18px", border: `1px solid ${client.submitted ? "#d1fae5" : "#e2e8f0"}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a2a3a" }}>{client.company}</span>
                      {client.submitted && <span style={{ padding: "2px 7px", borderRadius: "6px", background: "#d1fae5", color: "#1A4A8A", fontSize: "10px", fontWeight: 700 }}>✓ SUBMITTED</span>}
                      {critical > 0 && !client.submitted && <span style={{ padding: "2px 7px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626", fontSize: "10px", fontWeight: 700 }}>{critical} CRITICAL</span>}
                    </div>
                    <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
                      {client.contact && `${client.contact} · `}{client.email && `${client.email} · `}Updated {new Date(client.lastModified).toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    <ProgressRing percent={pct} size={46} stroke={4} color={pct < 50 ? "#e74c3c" : pct < 80 ? "#f39c12" : "#6BA3E8"} />
                    <button onClick={e => { e.stopPropagation(); deleteClient(idx); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#d1d9e0", padding: "2px", lineHeight: 1 }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── EDITOR ────────────────────────────────────────────────────────────
  if (view === "editor" && activeClient !== null) {
    const client = clients[activeClient];
    const section = RMCP_SECTIONS[activeSection];
    const completeness = calculateCompleteness(formData);

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "11px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => setView("clients")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}>←</button>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a" }}>{client.company}</div>
              <div style={{ fontSize: "10px", color: "#94a3b8" }}>RMCP Assessment — Section {activeSection + 1} of {RMCP_SECTIONS.length}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {saving && <span style={{ fontSize: "11px", color: "#6BA3E8" }}>✓ Saved</span>}
            <button onClick={() => setView("dashboard")} style={{ padding: "6px 12px", borderRadius: "6px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Review Summary →
            </button>
          </div>
        </div>

        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "8px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px" }}>Overall progress</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: completeness < 50 ? "#e74c3c" : completeness < 80 ? "#f39c12" : "#6BA3E8" }}>{completeness}%</span>
          </div>
          <div style={{ height: "4px", borderRadius: "2px", background: "#f1f5f9" }}>
            <div style={{ height: "100%", borderRadius: "2px", width: `${completeness}%`, background: completeness < 50 ? "#e74c3c" : completeness < 80 ? "#f39c12" : "#6BA3E8", transition: "width 0.4s" }} />
          </div>
        </div>

        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "6px 10px", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: "2px", minWidth: "max-content" }}>
            {RMCP_SECTIONS.map((s, i) => {
              const sc = getSectionCompleteness(s, formData);
              return (
                <button key={s.id} onClick={() => setActiveSection(i)} style={{
                  padding: "6px 11px", borderRadius: "6px", border: "none",
                  background: activeSection === i ? "#e8f5ee" : "transparent",
                  color: activeSection === i ? "#1C5BA3" : "#64748b",
                  fontSize: "12px", fontWeight: activeSection === i ? 700 : 400,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap"
                }}>
                  {s.icon} {s.title.split(" ")[0]}{sc === 100 && <span style={{ color: "#6BA3E8", fontSize: "10px" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ maxWidth: 580, margin: "0 auto", padding: "22px 18px" }}>
          <div style={{ marginBottom: "22px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", margin: "0 0 4px" }}>{section.icon} {section.title}</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>{section.description}</p>
            <div style={{ padding: "11px 13px", borderRadius: "8px", background: "#f0faf4", border: "1px solid #d1fae5" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "3px" }}>Why this matters</div>
              <div style={{ fontSize: "12px", color: "#1A4A8A", lineHeight: 1.55 }}>This section covers critical FICA compliance requirements specific to property practitioners.</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {section.fields.map(field => (
              <div key={field.id}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1e293b", marginBottom: "8px", lineHeight: 1.4 }}>
                  {field.label}
                </label>
                {field.type === "text" && (
                  <input value={formData[field.id] || ""} onChange={e => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: formData[field.id] ? "2px solid #2463AE" : "1.5px solid #d1d9e0", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", background: formData[field.id] ? "#f0faf4" : "#fafbfc", color: "#1a2a3a" }}
                    onFocus={e => e.target.style.borderColor = "#2463AE"}
                    onBlur={e => { if (!formData[field.id]) e.target.style.borderColor = "#d1d9e0"; }} />
                )}
                {field.type === "date" && (
                  <input type="date" value={formData[field.id] || ""} onChange={e => updateField(field.id, e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: formData[field.id] ? "2px solid #2463AE" : "1.5px solid #d1d9e0", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", background: "#fff", color: "#1a2a3a", colorScheme: "light" }}
                    onFocus={e => e.target.style.borderColor = "#2463AE"}
                    onBlur={e => { if (!formData[field.id]) e.target.style.borderColor = "#d1d9e0"; }} />
                )}
                {field.type === "select" && (
                  <SelectField value={formData[field.id]} onChange={v => updateField(field.id, v)} options={field.options} />
                )}
                {field.type === "multi" && (
                  <MultiSelect options={field.options} selected={formData[field.id] || []} onChange={v => updateField(field.id, v)} />
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", paddingBottom: "40px" }}>
            <button onClick={() => setActiveSection(Math.max(0, activeSection - 1))} disabled={activeSection === 0}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#fff", color: activeSection === 0 ? "#d1d9e0" : "#4a5568", fontSize: "13px", fontWeight: 600, cursor: activeSection === 0 ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              ← Previous
            </button>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              {sectionError && (
                <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 600 }}>
                  ⚠ Please answer all questions before continuing
                </span>
              )}
              <button onClick={() => {
                const sc = getSectionCompleteness(section, formData);
                if (sc < 100) { setSectionError(true); return; }
                setSectionError(false);
                activeSection < RMCP_SECTIONS.length - 1 ? setActiveSection(activeSection + 1) : setView("dashboard");
              }}
                style={{ padding: "10px 22px", borderRadius: "8px", border: "none", background: "#2463AE", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {activeSection < RMCP_SECTIONS.length - 1 ? "Next Section →" : "Review & Submit →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SUBMITTED ─────────────────────────────────────────────────────────
  if (view === "submitted") {
    const client = activeClient !== null ? clients[activeClient] : null;
    const flags = getRiskFlags(formData);
    const requestedHelps = Object.entries(helpRequests).filter(([_, v]) => v).map(([k]) => k);

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #050F24 0%, #0D2147 40%, #071A3B 100%)", fontFamily: "'DM Sans', sans-serif", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 500, textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", margin: "0 auto 22px", boxShadow: "0 8px 32px rgba(107,163,232,0.3)" }}>✓</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 700, marginBottom: "10px", lineHeight: 1.2 }}>
            Assessment Submitted
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.65, marginBottom: "8px" }}>
            Thank you{client?.contact ? `, ${client.contact.split(" ")[0]}` : ""}. We've received the RMCP assessment for <strong>{client?.company}</strong>.
          </p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: "24px" }}>
            Big Bay Administrators will review your answers and be in touch within 2–3 business days with your completed RMCP document and implementation recommendations.
          </p>

          {requestedHelps.length > 0 && (
            <div style={{ background: "rgba(107,163,232,0.1)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(107,163,232,0.2)", marginBottom: "20px", textAlign: "left" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#6BA3E8", marginBottom: "8px" }}>✓ Help Requests Noted</div>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>You've requested help with {requestedHelps.length} action plan{requestedHelps.length !== 1 ? "s" : ""}. Our team will include implementation support recommendations in their reply.</p>
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "20px", textAlign: "left" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#6BA3E8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>What happens next</div>
            {["We review your assessment and identify compliance gaps", "We create action plans for each gap with timelines and costs", "We send you the RMCP document + implementation options", "You choose which gaps you'd like us to help implement"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "9px", marginBottom: i === 3 ? 0 : "8px", alignItems: "flex-start" }}>
                <span style={{ color: "#6BA3E8", fontSize: "12px", marginTop: "2px" }}>→</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "12px 16px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>Questions? Contact us</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#6BA3E8" }}>info@bigbaytax.co.za</div>
          </div>

          <button onClick={() => setView("landing")} style={{ padding: "10px 24px", borderRadius: "8px", border: "1.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── ADMIN LOGIN ──────────────────────────────────────────────────
  if (view === "adminLogin") {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxWidth: 400, width: "100%" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", marginBottom: "24px" }}>Admin Login</h2>
          <input type="password" placeholder="Enter admin password" id="adminPwd"
            onKeyPress={(e) => { if (e.key === "Enter" && e.target.value === "BigBay2024") { setIsAdmin(true); setView("admin"); } }}
            style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" }} autoFocus />
          <button onClick={() => { const pwd = document.getElementById("adminPwd").value; if (pwd === "BigBay2024") { setIsAdmin(true); setView("admin"); } else { alert("Incorrect password"); } }}
            style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "none", background: "#2463AE", color: "#fff", fontWeight: 600, cursor: "pointer", marginBottom: "12px" }}>Login</button>
          <button onClick={() => setView("landing")}
            style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", color: "#666", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── ADMIN DASHBOARD ─────────────────────────────────────────────
  if (view === "admin") {
    const submittedClients = clients.filter(c => c.submitted);
    
    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", margin: "0 0 2px" }}>Big Bay Administrators</h1>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Admin Dashboard — RMCP Submissions</p>
          </div>
          <button onClick={() => setView("landing")} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "13px" }}>Logout</button>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1a2a3a", marginBottom: "16px" }}>Submissions ({submittedClients.length})</h2>
          {submittedClients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "8px" }}><p style={{ color: "#999" }}>No submissions yet</p></div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {submittedClients.map((client, i) => {
                const comp = calculateCompleteness(client.data || {});
                const qual = calculateComplianceScore(client.data || {});
                const flags = getRiskFlags(client.data || {});
                return (
                  <div key={i} onClick={() => setView("adminDetail:" + i)} style={{ padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#1a2a3a" }}>{client.company}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{client.contact} • {client.email}</div>
                    </div>
                    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: "12px", color: "#666" }}>Complete</div><div style={{ fontSize: "16px", fontWeight: "bold", color: comp < 75 ? "#f39c12" : "#6BA3E8" }}>{comp}%</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: "12px", color: "#666" }}>Quality</div><div style={{ fontSize: "16px", fontWeight: "bold", color: qual < 75 ? "#f39c12" : "#6BA3E8" }}>{qual}%</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: "12px", color: "#666" }}>Gaps</div><div style={{ fontSize: "16px", fontWeight: "bold", color: flags.length === 0 ? "#10b981" : "#dc2626" }}>{flags.length}</div></div>
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

  // ── ADMIN CLIENT DETAIL ─────────────────────────────────────────
  if (view.startsWith("adminDetail:")) {
    const idx = parseInt(view.split(":")[1]);
    const submittedClients = clients.filter(c => c.submitted);
    const client = submittedClients[idx];
    if (!client) { setView("admin"); return null; }
    
    const comp = calculateCompleteness(client.data || {});
    const qual = calculateComplianceScore(client.data || {});
    const flags = getRiskFlags(client.data || {});

    const generateDoc = () => {
      const d = client.data || {};
      const today = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>RMCP - ${client.company}</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:20px;color:#333}h1{color:#1C5BA3;border-bottom:3px solid #1C5BA3;padding-bottom:10px}h2{color:#1C5BA3;margin-top:20px}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}.warning{background:#fee2e2;border-left:4px solid #dc2626;padding:15px;margin:15px 0}.cover{text-align:center;padding:60px 20px;border:2px solid #1C5BA3;margin:40px 0}.page-break{page-break-after:always}</style></head><body>
<div class="cover page-break"><div style="font-size:32px;font-weight:bold;color:#1C5BA3">Risk Management and Compliance Programme</div><div style="font-size:14px;color:#666;margin:20px 0">Financial Intelligence Centre Act 38 of 2001</div><table style="border:none;margin-top:40px"><tr style="border:none"><td style="border:none"><strong>Institution:</strong></td><td style="border:none">${client.company}</td></tr><tr style="border:none"><td style="border:none"><strong>FFC Number:</strong></td><td style="border:none">${client.ffc||"Not specified"}</td></tr><tr style="border:none"><td style="border:none"><strong>Date:</strong></td><td style="border:none">${today}</td></tr><tr style="border:none"><td style="border:none"><strong>Version:</strong></td><td style="border:none">1.0</td></tr></table></div>
<div class="page-break"><h1>PART 1: RISK IDENTIFICATION & ASSESSMENT</h1><h2>1.1 Business Profile</h2><table><tr><th>Factor</th><th>Details</th></tr><tr><td>Client Types</td><td>${(d.client_types||[]).join(", ")}</td></tr><tr><td>Services</td><td>${(d.transaction_types||[]).join(", ")}</td></tr><tr><td>Geographic Exposure</td><td>${d.geographic_risk||""}</td></tr><tr><td>Transaction Value</td><td>${d.value_range||""}</td></tr></table><h2>1.2 Risk Assessment</h2><p>ML/TF/PF risk assessed using likelihood × impact matrix.</p><table><tr><th>Risk Type</th><th>Rating</th></tr><tr><td>Inherent Risk</td><td><strong>Medium</strong></td></tr><tr><td>Residual Risk</td><td><strong>Low</strong></td></tr></table></div>
<div class="page-break"><h1>PART 2: RISK MITIGATION CONTROLS</h1><h2>2.1 Customer Due Diligence (CDD)</h2><table><tr><th>Risk Level</th><th>Identity</th><th>Address</th><th>Monitoring</th></tr><tr><td>Low</td><td>Certified ID</td><td>Utility bill ≤3 months</td><td>Annual</td></tr><tr><td>Medium</td><td>ID + source verification</td><td>Independent verification</td><td>Transaction-triggered</td></tr><tr><td>High (EDD)</td><td>Senior approval required</td><td>Independent + call</td><td>Monthly</td></tr></table><h2>2.2 Reporting Obligations</h2><table><tr><th>Report</th><th>Deadline</th><th>Method</th></tr><tr><td>STR</td><td>15 days</td><td>goAML</td></tr><tr><td>CTR</td><td><strong>3 business days</strong></td><td>goAML</td></tr><tr><td>TPR</td><td>Immediately</td><td>goAML + FIC email</td></tr></table><div class="warning"><strong>⚠️ TIPPING-OFF PROHIBITION (Section 29(2)):</strong> No employee may disclose STR/CTR/TPR filings. Criminal offence.</div><h2>2.3 Targeted Financial Sanctions</h2><p><strong>Match Protocol:</strong> Freeze → Do not proceed → Escalate within 1 hour → Report to FIC within 2 hours → Maintain confidentiality</p><h2>2.4 Record Keeping</h2><p>All records retained minimum 5 years. Formal certified destruction with audit trail.</p><h2>2.5 Training</h2><p><strong>Status:</strong> ${d.training_policy||"Not specified"}</p></div>
<div><h1>PART 3: MONITORING, REVIEW & GOVERNANCE</h1><h2>3.1 Oversight</h2><table><tr><th>Role</th><th>Details</th></tr><tr><td>Compliance Officer</td><td>${d.compliance_officer||""}</td></tr><tr><td>Board Approval</td><td>${d.board_approval_date||""}</td></tr><tr><td>Review Frequency</td><td>Annually</td></tr></table><h2>3.2 Quality Assurance</h2><ul><li>Quarterly CDD audits (10% or 5 files)</li><li>Annual RMCP review</li><li>RCR submission per Directive 6 by 30 Sept</li><li>Employee screening per Directive 8</li></ul><div class="warning"><strong>CRITICAL:</strong> Documentation ≠ Compliance. All controls must be actively implemented.</div><h2>3.3 Signatures</h2><p><strong>Board/Senior Management:</strong> Signature: ____________ Date: ____________</p><p><strong>Compliance Officer:</strong> ${d.compliance_officer||""} Signature: ____________ Date: ____________</p><br><p>Prepared by Big Bay Administrators (Pty) Ltd | Cape Town | jerome@bigbayadmin.co.za</p></div></body></html>`;
      return html;
    };

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif", padding: "20px" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: "12px", padding: "24px" }}>
          <button onClick={() => setView("admin")} style={{ marginBottom: "20px", padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>← Back to List</button>
          <h2 style={{ marginBottom: "16px", color: "#1a2a3a" }}>{client.company}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div style={{ textAlign: "center", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
              <ProgressRing percent={comp} size={64} stroke={5} color={comp < 50 ? "#e74c3c" : comp < 75 ? "#f39c12" : "#6BA3E8"} />
              <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Completion: {comp}%</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
              <ProgressRing percent={qual} size={64} stroke={5} color={qual < 50 ? "#e74c3c" : qual < 75 ? "#f39c12" : "#6BA3E8"} />
              <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Compliance: {qual}%</div>
            </div>
          </div>
          <div style={{ marginBottom: "20px", padding: "12px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
            <strong>Contact:</strong> {client.contact}<br /><strong>Email:</strong> {client.email}<br /><strong>Phone:</strong> {client.phone}<br /><strong>FFC:</strong> {client.ffc}
          </div>
          {flags.length > 0 && (
            <div style={{ marginBottom: "20px", padding: "12px", background: "#fee2e2", borderRadius: "8px", borderLeft: "4px solid #dc2626" }}>
              <strong style={{ color: "#dc2626" }}>Compliance Gaps ({flags.length}):</strong>
              <ul style={{ marginTop: "8px", marginLeft: "20px" }}>{flags.map((f, i) => <li key={i} style={{ fontSize: "13px", color: "#374151", marginBottom: "4px" }}>{f.text}</li>)}</ul>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
            <button onClick={() => { const html = generateDoc(); const blob = new Blob([html], { type: "text/html" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `RMCP_${client.company.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.html`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }}
              style={{ padding: "12px", borderRadius: "8px", border: "none", background: "#2463AE", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>📄 Download RMCP Document</button>
            <button onClick={async () => { const btn = event.target; btn.textContent = "⏳ Sending..."; btn.disabled = true; try { const html = generateDoc(); const r = await fetch("https://rmcp-pro.vercel.app/api/send-rmcp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientEmail: client.email, clientName: client.company, rmcpHtml: html, coverLetter: `Dear ${client.contact},\n\nPlease find attached your RMCP document.\n\nBest regards,\nBig Bay Administrators` }) }); const res = await r.json(); if (r.ok) { alert("✅ Email sent to " + client.email); } else { alert("Error: " + (res.error || "Failed")); } } catch (e) { alert("Error: " + e.message); } finally { btn.textContent = "📧 Email to Client"; btn.disabled = false; } }}
              style={{ padding: "12px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>📧 Email to Client</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
