import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, mapFromDb, mapToDb } from "./lib/supabase";

// Typography tokens — Superdesign system
const FONT_BODY = "'Inter', system-ui, -apple-system, sans-serif";       // UI, body, form labels, buttons
const FONT_HEAD = "'Lora', Georgia, serif";                               // Landing/modal headlines only
const FONT_BRAND = "'Space Grotesk', 'Inter', sans-serif";                // 'Big Bay Administrators' wordmark, badges

const RMCP_SECTIONS = [
  {
    id: "governance",
    title: "Governance & Oversight",
    icon: "⚖️",
    description: "Board/management commitment to AML/CFT compliance",
    fields: [
      { id: "compliance_officer", label: "Designated Compliance Officer", hint: "Required by FICA s43. Must be a senior employee with authority to implement and enforce your compliance controls.", type: "text", placeholder: "Full name of appointed compliance officer" },
      { id: "compliance_officer_contact", label: "Compliance Officer Contact", type: "text", placeholder: "Email / phone number" },
      { id: "board_approval_date", label: "Date RMCP approved by management", hint: "Your RMCP is only legally valid once formally approved by your board or senior management. Without this sign-off it is not enforceable.", type: "date" },
      { id: "review_frequency", label: "How often will your RMCP be reviewed?", hint: "FICA requires your RMCP to stay current as your business evolves. Annual review is the minimum — more often if your risk profile changes.", type: "select", options: ["Annually", "Bi-annually", "Quarterly", "As needed"] },
      { id: "last_review_date", label: "Date of last RMCP review", type: "date" },
      { id: "training_policy", label: "How do you train staff on AML/CFT?", hint: "All staff who interact with clients must receive AML/CFT training — not just the Compliance Officer. Untrained staff is a common FIC inspection finding.", type: "select", options: ["Annual workshops", "Online modules", "External provider", "In-house training", "Not yet established"] },
    ]
  },
  {
    id: "risk_assessment",
    title: "Risk Assessment",
    icon: "🔍",
    description: "Identifying your money laundering and terror financing risks",
    fields: [
      { id: "client_types", label: "What types of clients do you work with?", hint: "Select all that apply. A more diverse client base generally means a higher ML/TF risk profile and more rigorous due diligence requirements.", type: "multi", options: ["Individual buyers", "Individual sellers", "Companies / Trusts", "Foreign nationals", "Politically Exposed Persons (PEPs)", "Property developers", "Investors"] },
      { id: "transaction_types", label: "What types of transactions do you handle?", hint: "Select all transaction types your agency is involved in. Each type carries different risk characteristics under FICA.", type: "multi", options: ["Residential sales", "Commercial sales", "Residential rentals", "Property management", "New developments", "Auction sales"] },
      { id: "geographic_risk", label: "Where do most of your clients come from?", hint: "Foreign clients and cross-border transactions carry elevated money laundering risk and trigger enhanced due diligence requirements.", type: "select", options: ["Local area only", "National — across South Africa", "International / foreign clients", "Mix of local and international"] },
      { id: "value_range", label: "What is your typical transaction value?", hint: "Transactions above R5 million are generally considered higher risk. Properties over R15m typically require enhanced due diligence and source-of-funds verification.", type: "select", options: ["Under R1 million", "R1m to R5m", "R5m to R15m", "R15m to R50m", "Over R50m", "Mixed range"] },
      { id: "risk_rating", label: "How would you rate your overall ML/TF risk?", hint: "Be honest — your risk rating determines the level of due diligence required. Under-rating your risk is itself a compliance issue if challenged by the FIC.", type: "select", options: ["Low — straightforward local transactions", "Medium — some complex or higher-value deals", "High — foreign clients, large transactions, or complex structures"] },
      { id: "risk_assessment_date", label: "When was your last formal risk assessment done?", hint: "A documented risk assessment must be on file. If you have never done one formally, Big Bay Admin can assist.", type: "date" },
    ]
  },
  {
    id: "cdd",
    title: "Know Your Client",
    icon: "👤",
    description: "How you verify client identity before doing business",
    fields: [
      { id: "id_verification", label: "How do you verify client identity?", hint: "You must verify identity before entering into any business relationship. Select all methods your agency currently uses in practice.", type: "multi", options: ["Certified copy of ID document", "Smart ID card scan", "Passport copy (foreign nationals)", "Biometric verification", "Electronic verification (e.g. XDS / Lexis)"] },
      { id: "address_verification", label: "How do you verify client address?", hint: "Proof of address documents must not be older than 3 months at the time of verification. Bank statements and utility bills are most commonly accepted.", type: "multi", options: ["Utility bill (not older than 3 months)", "Bank statement", "Municipal account", "Lease agreement", "Sworn affidavit"] },
      { id: "beneficial_owner", label: "For companies or trusts — how do you identify the beneficial owner?", hint: "A beneficial owner is the natural person who ultimately owns or controls the entity — typically anyone holding 25% or more. FICA requires you to identify and verify them, not just the company itself.", type: "select", options: ["CIPC records plus signed declarations", "Company resolution plus director ID documents", "Trust deed plus trustee ID documents", "Not applicable — we only work with individuals", "Combination of methods depending on structure"] },
      { id: "pep_screening", label: "How do you screen for Politically Exposed Persons (PEPs)?", hint: "A PEP is anyone who holds or has held a prominent public position — politicians, judges, senior military officers, SOE executives — plus their immediate family and known close associates. PEPs carry higher corruption and bribery risk.", type: "select", options: ["Manual checklist against known PEP list", "Third-party screening tool", "Online database check", "Not yet established"] },
      { id: "enhanced_dd", label: "Which situations trigger enhanced due diligence for you?", hint: "Enhanced due diligence (EDD) means additional steps beyond standard checks: senior management approval, source-of-funds verification, and more frequent ongoing monitoring. Select all that apply to your agency.", type: "multi", options: ["Foreign nationals", "PEPs or their family members", "Complex ownership structures", "High-value transactions", "Cash payments", "Unusual or suspicious patterns"] },
      { id: "ongoing_dd", label: "How do you monitor clients on an ongoing basis?", hint: "Client screening is not a once-off exercise. FICA requires ongoing monitoring — especially if a client's circumstances or risk profile change after onboarding.", type: "select", options: ["Per-transaction review for all clients", "Annual review of all client files", "Risk-based — more frequent for high-risk clients", "Not yet established"] },
    ]
  },
  {
    id: "reporting",
    title: "Reporting Obligations",
    icon: "📋",
    description: "How you report suspicious activity and cash transactions to the FIC",
    fields: [
      { id: "str_process", label: "How do you file Suspicious Transaction Reports (STRs)?", hint: "An STR must be filed within 15 days of suspicion arising — not when you have proof, when you have suspicion. goAML is the FIC's free online portal. All accountable institutions must be registered.", type: "select", options: ["Registered on goAML and actively filing", "Registered on goAML but not yet filed", "Not yet registered on goAML", "Our compliance provider files on our behalf"] },
      { id: "ctr_process", label: "How do you handle Cash Threshold Reports (CTRs) for cash over R24,999?", hint: "A CTR must be filed within 3 business days whenever cash of R24,999 or more is paid or received in a single transaction — regardless of whether it seems suspicious.", type: "select", options: ["Filed via goAML automatically", "Filed manually via goAML", "Not applicable — we do not accept cash above the threshold", "Not yet established"] },
      { id: "tpr_process", label: "Do you have a process for Terrorist Property Reports (TPRs)?", hint: "If you know or reasonably suspect any property is connected to terrorism, you must report immediately to the FIC — not within days, immediately. This includes property belonging to sanctioned persons.", type: "select", options: ["Yes — documented and tested with staff", "Yes — documented but not yet tested", "Aware of the obligation but no formal process yet", "Not yet addressed"] },
      { id: "tipping_off", label: "Do you have measures to prevent tipping off a suspect?", hint: "It is a criminal offence under FICA s29(2) to tell a client — or anyone else — that a report has been filed about them. Your staff must understand this and know what they can and cannot say.", type: "select", options: ["Yes — policy in place and staff are trained", "Yes — policy drafted but staff not yet trained", "Aware of the obligation but no policy yet", "Not yet addressed"] },
      { id: "internal_reporting", label: "How does staff escalate suspicious activity internally?", hint: "Staff need a clear, safe process to report suspicions without confronting the client themselves. Without this, suspicious transactions often go unreported out of uncertainty.", type: "select", options: ["Staff reports to Compliance Officer who files on goAML", "Staff reports directly to Compliance Officer for a decision", "All staff are authorised to file directly on goAML", "Not yet established"] },
    ]
  },
  {
    id: "record_keeping",
    title: "Record Keeping",
    icon: "🗂️",
    description: "How you store and maintain compliance records (5 year minimum required)",
    fields: [
      { id: "record_system", label: "How do you store your compliance records?", hint: "Records must be stored securely and be retrievable on request by the FIC. Cloud-based or practice management systems are preferred for audit trail purposes.", type: "select", options: ["Digital — cloud-based system", "Digital — local server or computer", "Paper-based filing only", "Hybrid — both digital and paper", "Practice management software with compliance module"] },
      { id: "retention_period", label: "How long do you keep compliance records?", hint: "FICA requires a minimum of 5 years from the end of the business relationship or the date of the transaction — whichever is later. Shorter retention is a direct FICA breach.", type: "select", options: ["5 years (FICA minimum)", "7 years", "10 years", "Indefinitely", "Not yet specified"] },
      { id: "destruction_policy", label: "Do you have a policy for destroying records after the retention period?", hint: "After the retention period, records must be formally and securely destroyed — not just deleted. You need a documented process with management sign-off to demonstrate compliant disposal.", type: "select", options: ["Yes — documented process with management sign-off", "Informal — records deleted on an ad hoc basis", "Not yet established"] },
      { id: "backup_process", label: "How do you back up your compliance records?", hint: "Records lost due to hardware failure or theft are still a compliance breach. Automated cloud backup is the most reliable way to meet your retention obligations.", type: "select", options: ["Automated cloud backup", "Regular manual backup to local drive", "Periodic backup to external drive", "No backup process in place"] },
    ]
  },
  {
    id: "sanctions",
    title: "Sanctions Screening",
    icon: "🚫",
    description: "Screening clients against UN and South African targeted financial sanctions lists",
    fields: [
      { id: "sanctions_screening", label: "How do you screen clients against sanctions lists?", hint: "South Africa is bound by UN Security Council resolutions. You must check all clients against both the UN Consolidated Sanctions List and the SA Targeted Financial Sanctions (TFS) list before entering into any business relationship.", type: "select", options: ["Automated screening tool integrated into onboarding", "Manual check against UN and SA sanctions lists", "Third-party screening service provider", "Not yet established"] },
      { id: "screening_frequency", label: "How often do you screen clients?", hint: "Clients can be added to sanctions lists after onboarding. Screening only once at onboarding is not sufficient — ongoing or periodic screening is required to catch late additions.", type: "select", options: ["Every new client before onboarding", "Before each transaction", "Periodic batch screening of all clients", "Not yet established"] },
      { id: "match_process", label: "What do you do if a client matches a sanctions list?", hint: "A sanctions match is not optional to act on. You must immediately freeze the transaction, not proceed with any business, and report to the FIC. Failing to act is a criminal offence.", type: "select", options: ["Documented procedure — freeze assets and report to FIC immediately", "Ad hoc — consult compliance officer and take action", "No process established yet"] },
    ]
  }
];

// ── ACTION PLAN LIBRARY ───────────────────────────────────────────────
const ACTION_PLANS = {
  "training_policy:Not yet established": {
    title: "Staff AML/CFT Training Programme",
    description: "Big Bay Admin designs and delivers a customised AML/CFT training programme for your team, fully compliant with FICA s43(1)(c)",
    steps: [
      { step: 1, action: "Needs assessment and training design", owner: "Big Bay Admin", timeline: "Days 1–5", cost: "Included in setup fee", details: "We assess your team size, roles, and risk profile to build a tailored training programme" },
      { step: 2, action: "Deliver group training session (up to 8 staff)", owner: "Big Bay Admin", timeline: "Days 6–14", cost: "R3,500 once-off", details: "Half-day in-person or virtual session covering AML/CFT obligations, red flags, and STR/CTR reporting" },
      { step: 3, action: "Issue attendance certificates and training register", owner: "Big Bay Admin", timeline: "Day 15", cost: "Included", details: "We provide signed attendance register and FIC-compliant training certificates for each staff member" },
      { step: 4, action: "Annual refresher training (ongoing)", owner: "Big Bay Admin", timeline: "Annually", cost: "R2,000/year", details: "Updated annual refresher session to reflect regulatory changes — keeps you compliant year after year" },
    ],
    estimatedTimeline: "14 days",
    estimatedCost: "R3,500 once-off (up to 8 staff) + R2,000/year refresher",
    priority: "HIGH",
    law: "FICA s43(1)(c)",
  },

  "pep_screening:Not yet established": {
    title: "PEP Screening Process",
    description: "Big Bay Admin sets up a Politically Exposed Persons screening process for your agency — procedure, checklist, and staff training included",
    steps: [
      { step: 1, action: "Design PEP screening procedure and onboarding checklist", owner: "Big Bay Admin", timeline: "Days 1–5", cost: "Included in setup fee", details: "We create a written PEP screening procedure and add it to your client acceptance workflow" },
      { step: 2, action: "Recommend and configure screening tool", owner: "Big Bay Admin", timeline: "Days 6–10", cost: "R4,500 once-off setup", details: "We recommend and configure a cost-effective PEP/sanctions screening solution (XDS, Lexis Nexis, or manual FIC list)" },
      { step: 3, action: "Train all client-facing staff", owner: "Big Bay Admin", timeline: "Days 11–14", cost: "Included in setup fee", details: "1-hour training on how to run a PEP screen, document results, and escalate matches" },
      { step: 4, action: "Ongoing screening tool subscription (client-managed)", owner: "Client", timeline: "Monthly", cost: "R600–R900/month (third-party tool)", details: "Screening tool subscription is billed directly by the provider — Big Bay Admin assists with setup and renewals" },
    ],
    estimatedTimeline: "14 days",
    estimatedCost: "R4,500 once-off (Big Bay Admin) + R600–R900/month screening tool",
    priority: "HIGH",
    law: "FICA s21B",
  },

  "record_system:Paper-based filing only": {
    title: "Digitise Compliance Records",
    description: "Big Bay Admin sets up a secure cloud-based compliance recordkeeping system and migrates your existing records from paper",
    steps: [
      { step: 1, action: "Set up cloud compliance folder structure", owner: "Big Bay Admin", timeline: "Days 1–3", cost: "Included in setup fee", details: "We configure Google Drive or OneDrive with a FICA-compliant folder structure, access controls, and naming conventions" },
      { step: 2, action: "Scan and digitise existing client files", owner: "Client (with BBA guidance)", timeline: "Days 4–21", cost: "R3,000 once-off setup", details: "We provide a scanning checklist and file naming guide; client scans files internally with our supervision" },
      { step: 3, action: "Enable automated daily cloud backup", owner: "Big Bay Admin", timeline: "Days 22–24", cost: "Included", details: "We configure automatic daily backups and test the restore process" },
      { step: 4, action: "Train staff on digital record protocols", owner: "Big Bay Admin", timeline: "Days 25–28", cost: "Included", details: "1-hour training on how to store, retrieve, and manage compliance records digitally" },
    ],
    estimatedTimeline: "28 days",
    estimatedCost: "R3,000 once-off (Big Bay Admin) + R200–R350/month cloud storage",
    priority: "MEDIUM",
    law: "FICA s22–23",
  },

  "backup_process:No backup process in place": {
    title: "Implement Compliance Record Backup System",
    description: "Big Bay Admin configures automated daily backups of all your compliance records and documents the recovery procedure",
    steps: [
      { step: 1, action: "Configure cloud backup automation", owner: "Big Bay Admin", timeline: "Days 1–3", cost: "R1,800 once-off", details: "We set up automatic nightly backups to a secure cloud location (Google Drive, Dropbox, or OneDrive)" },
      { step: 2, action: "Test backup and recovery process", owner: "Big Bay Admin", timeline: "Days 4–5", cost: "Included", details: "We perform a test restore to confirm backups are working and data is recoverable" },
      { step: 3, action: "Document backup and recovery procedure", owner: "Big Bay Admin", timeline: "Days 6–7", cost: "Included", details: "We provide a written backup management procedure for your RMCP file" },
      { step: 4, action: "Monthly backup verification reminder", owner: "Client", timeline: "Monthly", cost: "R150–R300/month (cloud storage only)", details: "Cloud storage subscription is billed by the provider — we recommend testing one restore per month" },
    ],
    estimatedTimeline: "7 days",
    estimatedCost: "R1,800 once-off (Big Bay Admin) + R150–R300/month cloud storage",
    priority: "MEDIUM",
    law: "FICA s22–23",
  },

  "retention_period:Not yet specified": {
    title: "Establish Record Retention Policy",
    description: "Big Bay Admin drafts a FICA-compliant record retention policy specifying the minimum 5-year retention period and procedures",
    steps: [
      { step: 1, action: "Draft retention policy document", owner: "Big Bay Admin", timeline: "Days 1–5", cost: "R2,500 once-off", details: "We draft a written policy specifying retention periods, record types, storage locations, and responsible persons" },
      { step: 2, action: "Present to management for approval", owner: "Big Bay Admin + Client", timeline: "Days 6–10", cost: "Included", details: "We present the policy to your board or management and obtain a signed approval record" },
      { step: 3, action: "Distribute to all staff", owner: "Big Bay Admin", timeline: "Days 11–14", cost: "Included", details: "We provide a staff communication memo and collect signed acknowledgements" },
      { step: 4, action: "Annual policy review", owner: "Big Bay Admin", timeline: "Annually", cost: "Included in annual retainer (if applicable)", details: "We review and update the policy annually to reflect any regulatory changes" },
    ],
    estimatedTimeline: "14 days",
    estimatedCost: "R2,500 once-off — policy drafted and approved by Big Bay Admin",
    priority: "MEDIUM",
    law: "FICA s22–23",
  },

  "destruction_policy:Not yet established": {
    title: "Create Record Destruction Policy",
    description: "Big Bay Admin drafts a secure record destruction policy and arranges an appropriate destruction method for expired compliance records",
    steps: [
      { step: 1, action: "Draft record destruction policy", owner: "Big Bay Admin", timeline: "Days 1–5", cost: "R2,000 once-off", details: "Policy covers: who authorises destruction, approved methods (shredding/secure deletion), audit trail requirements" },
      { step: 2, action: "Recommend destruction method and supplier", owner: "Big Bay Admin", timeline: "Days 6–10", cost: "Included", details: "We recommend a cost-effective certified shredding service or secure deletion software for digital records" },
      { step: 3, action: "Management approval and sign-off", owner: "Big Bay Admin + Client", timeline: "Days 11–14", cost: "Included", details: "We present the policy for formal written approval — required for your RMCP" },
      { step: 4, action: "Destruction audit trail template", owner: "Big Bay Admin", timeline: "Day 14", cost: "Included", details: "We provide a destruction log template to record every destruction event going forward" },
    ],
    estimatedTimeline: "14 days",
    estimatedCost: "R2,000 once-off (Big Bay Admin) + R400–R1,200/year destruction service",
    priority: "MEDIUM",
    law: "FICA s22–23",
  },

  "board_approval_date:": {
    title: "Obtain Formal RMCP Board Approval",
    description: "Big Bay Admin prepares your RMCP board presentation pack and facilitates the formal management approval process",
    steps: [
      { step: 1, action: "Prepare RMCP board presentation pack", owner: "Big Bay Admin", timeline: "Days 1–5", cost: "R3,500 once-off", details: "We compile a professional board pack summarising your RMCP, compliance gaps, and required decisions" },
      { step: 2, action: "Schedule management or board meeting", owner: "Client", timeline: "Days 6–10", cost: "Included", details: "Client arranges the meeting; Big Bay Admin can attend virtually to present and field questions" },
      { step: 3, action: "Present RMCP and obtain signed board resolution", owner: "Big Bay Admin + Client", timeline: "Days 11–14", cost: "Included", details: "We present the RMCP, answer questions, and prepare a signed board resolution for your file" },
      { step: 4, action: "Distribute approved RMCP to staff", owner: "Big Bay Admin", timeline: "Days 15–18", cost: "Included", details: "We issue a staff communication memo confirming board approval and any immediate compliance actions required" },
    ],
    estimatedTimeline: "18 days",
    estimatedCost: "R3,500 once-off — board pack prepared and approval facilitated by Big Bay Admin",
    priority: "CRITICAL",
    law: "FICA s43(1)(b)",
  },

  "str_process:Not yet registered on goAML": {
    title: "Register on FIC goAML Platform",
    description: "Big Bay Admin handles your institution's goAML registration on your behalf — from application to first login",
    steps: [
      { step: 1, action: "Gather institution and compliance officer details", owner: "Big Bay Admin + Client", timeline: "Days 1–2", cost: "R1,500 once-off", details: "We collect your FFC number, tax number, banking details, and compliance officer information" },
      { step: 2, action: "Complete and submit goAML registration", owner: "Big Bay Admin", timeline: "Days 3–5", cost: "Included", details: "We complete the registration at goaml.fic.gov.za on your behalf and submit all required documentation" },
      { step: 3, action: "Receive and secure login credentials", owner: "Big Bay Admin + Client", timeline: "Days 6–14", cost: "Included", details: "FIC issues credentials within 5–7 business days; we help you set up secure access and test login" },
      { step: 4, action: "Training on filing STR, CTR, and TPR reports", owner: "Big Bay Admin", timeline: "Days 15–18", cost: "Included", details: "1-hour training session on how to file Suspicious Transaction Reports, Cash Transaction Reports, and Terrorist Property Reports" },
    ],
    estimatedTimeline: "18 days",
    estimatedCost: "R1,500 once-off — Big Bay Admin handles full registration on your behalf",
    priority: "CRITICAL",
    law: "FICA s29, s43",
  },

  "sanctions_screening:Not yet established": {
    title: "Implement UN Sanctions Screening",
    description: "Big Bay Admin sets up a targeted financial sanctions screening process to ensure compliance with UN Security Council resolutions",
    steps: [
      { step: 1, action: "Design sanctions screening procedure", owner: "Big Bay Admin", timeline: "Days 1–4", cost: "Included in setup fee", details: "We draft a written sanctions screening procedure and integrate it into your client onboarding checklist" },
      { step: 2, action: "Configure screening tool or manual list process", owner: "Big Bay Admin", timeline: "Days 5–10", cost: "R3,500 once-off setup", details: "We configure a screening solution — either an automated tool (XDS, Lexis Nexis) or a documented manual FIC/UN list check process" },
      { step: 3, action: "Train all client-facing staff", owner: "Big Bay Admin", timeline: "Days 11–14", cost: "Included", details: "Training on: what a sanctions match looks like, immediate freeze and escalation procedures, and documentation requirements" },
      { step: 4, action: "Ongoing screening tool subscription (client-managed)", owner: "Client", timeline: "Monthly", cost: "R350–R800/month (third-party tool)", details: "Screening tool subscription billed directly by the provider — manual list checks are free but require more time" },
    ],
    estimatedTimeline: "14 days",
    estimatedCost: "R3,500 once-off (Big Bay Admin) + R350–R800/month screening tool",
    priority: "HIGH",
    law: "FICA s43, UN Security Council resolutions",
  },

  "tipping_off:Not yet addressed": {
    title: "Create Tipping-Off Prevention Policy",
    description: "Big Bay Admin drafts a tipping-off prevention policy and delivers mandatory staff training — a criminal offence under FICA s29(2)",
    steps: [
      { step: 1, action: "Draft tipping-off prevention policy", owner: "Big Bay Admin", timeline: "Days 1–5", cost: "R2,500 once-off", details: "Policy covers: definition of tipping-off, criminal consequences, who may be informed, confidentiality obligations" },
      { step: 2, action: "Management approval and sign-off", owner: "Big Bay Admin + Client", timeline: "Days 6–10", cost: "Included", details: "We present the policy for formal approval, emphasising the criminal liability under FICA s29(2)" },
      { step: 3, action: "Deliver mandatory staff training session", owner: "Big Bay Admin", timeline: "Days 11–14", cost: "Included", details: "1-hour training session covering real case examples, consequences, and correct escalation procedures — signed acknowledgements collected" },
      { step: 4, action: "Annual refresher included in training programme", owner: "Big Bay Admin", timeline: "Annually", cost: "Covered under annual training fee", details: "Tipping-off refresher is included in the annual AML/CFT training — no additional cost if you have our training retainer" },
    ],
    estimatedTimeline: "14 days",
    estimatedCost: "R2,500 once-off — policy drafted and staff training delivered by Big Bay Admin",
    priority: "HIGH",
    law: "FICA s29(2) — Criminal offence",
  },
};

// ── PROPOSAL ENGINE ───────────────────────────────────────────────────
const BBA_PRICING = {
  rmcp_board_approval: { name: "RMCP Board Approval Pack",                 onceOff: 3500, monthly: 0,   ref: "FICA s43(1)(b), GN7A §3",    timeline: "18 days" },
  goaml_registration:  { name: "goAML Registration Service",               onceOff: 1500, monthly: 0,   ref: "FICA s29, s43; GN7A §5",     timeline: "18 days" },
  tipping_off_policy:  { name: "Tipping-Off Prevention Policy + Training", onceOff: 2500, monthly: 0,   ref: "FICA s29(2)",                 timeline: "14 days" },
  pep_screening:       { name: "PEP Screening Process Setup",              onceOff: 4500, monthly: 750, ref: "FICA s21B; GN7A §6.2",       timeline: "14 days" },
  sanctions_screening: { name: "UN Sanctions Screening Setup",             onceOff: 3500, monthly: 575, ref: "FICA s43; UN SCR; GN7A §7",  timeline: "14 days" },
  digitise_records:    { name: "Digitise Compliance Records",              onceOff: 3000, monthly: 275, ref: "FICA s22–23; GN7A §8",       timeline: "28 days" },
  record_backup:       { name: "Compliance Record Backup System",          onceOff: 1800, monthly: 225, ref: "FICA s22–23",                 timeline: "7 days"  },
  staff_training:      { name: "Staff AML/CFT Training Programme",         onceOff: 3500, monthly: 167, ref: "FICA s43(1)(c); GN7A §4",    timeline: "14 days" },
  retention_policy:    { name: "Record Retention Policy",                  onceOff: 2500, monthly: 0,   ref: "FICA s22; GN7A §8.1",        timeline: "14 days" },
  destruction_policy:  { name: "Record Destruction Policy",                onceOff: 2000, monthly: 100, ref: "FICA s22–23; POPIA s14",     timeline: "14 days" },
};

const BBA_VALUE_PROPS = {
  rmcp_board_approval:  "Formal board approval transforms your RMCP from a draft into a legally defensible document — the single most important step for FICA s43 compliance.",
  goaml_registration:   "goAML registration is a legal obligation. Big Bay Admin handles the full process on your behalf, ensuring it is completed correctly the first time.",
  tipping_off_policy:   "A tipping-off offence under FICA s29(2) carries criminal penalties. This policy and training protects your business and staff personally.",
  pep_screening:        "Systematic PEP screening protects your agency from facilitating politically-connected money laundering and demonstrates enhanced due diligence to regulators.",
  sanctions_screening:  "UN sanctions screening is mandatory for all accountable institutions. Failure exposes your business to regulatory action and serious reputational damage.",
  digitise_records:     "Cloud-based records are searchable, auto-backed-up, and remotely accessible — making FIC inspections and audits effortless.",
  record_backup:        "A single hardware failure can permanently destroy years of compliance records. Automated cloud backup eliminates that risk entirely.",
  staff_training:       "Your staff are your first line of defence against money laundering. Annual FIC-compliant training reduces risk and satisfies your legal obligation under FICA s43(1)(c).",
  retention_policy:     "A written retention policy ensures you keep records for FICA's 5-year minimum and documents exactly when and how records may be legally disposed of.",
  destruction_policy:   "Proper record destruction prevents data breaches and POPIA violations while maintaining a defensible audit trail that records were destroyed correctly.",
};

const BBA_DELIVERABLES = {
  rmcp_board_approval:  ["Professional board presentation pack", "RMCP summary for management", "Signed board resolution document", "Staff communication memo"],
  goaml_registration:   ["Full goAML registration handled on your behalf", "Secure login credentials handover", "Filing procedures guide", "1-hour STR/CTR/TPR staff training"],
  tipping_off_policy:   ["Written tipping-off prevention policy", "Signed management approval record", "1-hour mandatory staff training session", "Staff sign-off acknowledgement forms"],
  pep_screening:        ["Written PEP screening procedure", "Updated client onboarding checklist", "Screening tool recommendation and configuration", "1-hour staff training"],
  sanctions_screening:  ["Written UN sanctions screening procedure", "Screening tool setup or manual process guide", "Freeze and escalation procedure", "1-hour staff training"],
  digitise_records:     ["Cloud folder structure configured (Google Drive / OneDrive)", "Scanning and naming guide", "Automated daily backup configured", "1-hour digital records training"],
  record_backup:        ["Cloud backup configured and tested", "Recovery procedure tested and documented", "Written backup procedure", "Monthly verification checklist"],
  staff_training:       ["Customised training programme designed", "Half-day training session (up to 8 staff)", "Attendance register + FIC-compliant certificates", "Annual refresher included"],
  retention_policy:     ["Written retention policy document", "Management sign-off obtained", "Staff acknowledgement forms", "Annual review calendar"],
  destruction_policy:   ["Written destruction policy document", "Destruction service recommendation", "Management approval obtained", "Destruction audit trail template"],
};

function generateProposal(client) {
  const d = client.data || {};
  const clientTypes = d.client_types || [];
  const hasForeignOrPEP = clientTypes.some(t => t.includes("Foreign") || t.includes("PEP"));
  const hasCompanyTrust = clientTypes.some(t => t.includes("Compan") || t.includes("Trust"));
  const isCloud = ["Digital — cloud-based system", "Practice management software with compliance module"].includes(d.record_system);
  const isTrainingCurrent = ["Annual workshops", "External provider", "Online modules", "In-house training"].includes(d.training_policy);
  const isGoAML = ["Registered on goAML and actively filing", "Registered on goAML but not yet filed"].includes(d.str_process);
  const isRMCPApproved = !!d.board_approval_date;
  const isPEPScreened = ["Third-party screening tool", "Online database check"].includes(d.pep_screening);
  const isSanctionsScreened = ["Automated screening tool integrated into onboarding", "Third-party screening service provider"].includes(d.sanctions_screening);
  const isInternational = ["International / foreign clients", "Mix of local and international"].includes(d.geographic_risk);
  const hasTippingOff = ["Yes — policy in place and staff are trained", "Yes — policy drafted but staff not yet trained"].includes(d.tipping_off);

  let pkg = "Starter";
  if (hasForeignOrPEP || (isCloud && isTrainingCurrent && isSanctionsScreened)) pkg = "Enterprise";
  else if (hasCompanyTrust || isInternational || isPEPScreened) pkg = "Professional";

  const selected = [];
  const gaps = [];

  if (!isRMCPApproved)     { selected.push("rmcp_board_approval");  gaps.push("RMCP not formally approved by management — required under FICA s43(1)(b)"); }
  if (!isGoAML)            { selected.push("goaml_registration");   gaps.push("Not registered on goAML — cannot legally file STRs, CTRs, or TPRs (FICA s29)"); }
  if (!hasTippingOff)      { selected.push("tipping_off_policy");   gaps.push("No tipping-off prevention policy — criminal offence under FICA s29(2)"); }
  if (!isPEPScreened)      { selected.push("pep_screening");        gaps.push("No systematic PEP screening — required under FICA s21B for higher-risk clients"); }
  if (!isSanctionsScreened){ selected.push("sanctions_screening");  gaps.push("No UN targeted financial sanctions screening — required under FICA s43 and UN Security Council resolutions"); }
  if (!isCloud)            { selected.push("digitise_records");     gaps.push("Compliance records not cloud-based — at risk of loss and difficult to produce for FIC inspections"); }
  if (!isCloud && d.backup_process === "No backup process in place") { selected.push("record_backup"); gaps.push("No automated backup — compliance records at permanent risk of loss"); }
  if (!isTrainingCurrent)  { selected.push("staff_training");       gaps.push("Staff AML/CFT training not current — required annually under FICA s43(1)(c)"); }
  if (d.retention_period === "Not yet specified") { selected.push("retention_policy"); gaps.push("Record retention period not specified — 5-year minimum required under FICA s22"); }
  if (["Not yet established", "Informal — records deleted on an ad hoc basis"].includes(d.destruction_policy)) { selected.push("destruction_policy"); gaps.push("No formal record destruction policy — required under FICA s22–23 and POPIA s14"); }

  const services = [...new Set(selected)].map(key => ({
    service_name: BBA_PRICING[key].name,
    once_off_fee_zar: BBA_PRICING[key].onceOff,
    monthly_fee_zar: BBA_PRICING[key].monthly,
    regulatory_reference: BBA_PRICING[key].ref,
    value_proposition: BBA_VALUE_PROPS[key],
    timeline: BBA_PRICING[key].timeline,
    deliverables: BBA_DELIVERABLES[key],
  }));

  const totalOnce = services.reduce((s, x) => s + x.once_off_fee_zar, 0);
  const totalMthly = services.reduce((s, x) => s + x.monthly_fee_zar, 0);
  const vatOnce = Math.round(totalOnce * 0.15);
  const vatMthly = Math.round(totalMthly * 0.15);

  return {
    business_name: client.company,
    fic_org_id: client.ffc || "Not provided",
    generated_date: new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }),
    recommended_package: pkg,
    services,
    pricing_summary: {
      total_once_off: totalOnce,
      total_monthly_recurring: totalMthly,
      vat_15_percent_once_off: vatOnce,
      vat_15_percent_monthly: vatMthly,
      grand_total_once_off_incl_vat: totalOnce + vatOnce,
      grand_total_monthly_incl_vat: totalMthly + vatMthly,
    },
    compliance_gaps_flagged: gaps,
  };
}

function ProposalModal({ proposal, onClose }) {
  const fmt = (n) => `R${n.toLocaleString("en-ZA")}`;
  const pkgColor = { Starter: "#6BA3E8", Professional: "#2463AE", Enterprise: "#1a2a3a", Custom: "#6c757d" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", overflowY: "auto", zIndex: 300, padding: "16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", background: "#fff", borderRadius: "14px", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #050F24, #0D2147)", padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Service Proposal · Big Bay Administrators</div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{proposal.business_name}</h2>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>FIC Org ID: {proposal.fic_org_id} · Generated {proposal.generated_date}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "8px", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <div style={{ marginTop: "14px", display: "inline-block", padding: "4px 14px", borderRadius: "20px", background: pkgColor[proposal.recommended_package] || "#6BA3E8", fontSize: "12px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>
            {proposal.recommended_package} Package
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Compliance Gaps */}
          {proposal.compliance_gaps_flagged.length > 0 && (
            <div style={{ background: "#fff8f0", border: "1.5px solid #fed7aa", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>Compliance Gaps Identified ({proposal.compliance_gaps_flagged.length})</div>
              {proposal.compliance_gaps_flagged.map((gap, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#7c2d12", display: "flex", gap: "6px", marginBottom: "4px" }}>
                  <span style={{ flexShrink: 0 }}>⚠</span><span>{gap}</span>
                </div>
              ))}
            </div>
          )}

          {/* Services */}
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Recommended Services ({proposal.services.length})</h3>
          {proposal.services.map((svc, i) => (
            <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#1a2a3a" }}>{svc.service_name}</div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#2463AE" }}>{fmt(svc.once_off_fee_zar)}</div>
                  {svc.monthly_fee_zar > 0 && <div style={{ fontSize: "11px", color: "#64748b" }}>+ {fmt(svc.monthly_fee_zar)}/mo</div>}
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#6BA3E8", fontWeight: 600, marginBottom: "4px" }}>{svc.regulatory_reference} · {svc.timeline}</div>
              <div style={{ fontSize: "12px", color: "#4a5568", marginBottom: "8px", lineHeight: 1.5 }}>{svc.value_proposition}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {svc.deliverables.map((d, j) => (
                  <span key={j} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "#f0f7ff", color: "#2463AE", fontWeight: 500 }}>✓ {d}</span>
                ))}
              </div>
            </div>
          ))}

          {/* Pricing Summary */}
          <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px 18px", marginTop: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a2a3a", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Pricing Summary (excl. VAT)</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#4a5568" }}>Once-off services</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a2a3a" }}>{fmt(proposal.pricing_summary.total_once_off)}</span>
            </div>
            {proposal.pricing_summary.total_monthly_recurring > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", color: "#4a5568" }}>Monthly recurring</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a2a3a" }}>{fmt(proposal.pricing_summary.total_monthly_recurring)}/mo</span>
              </div>
            )}
            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "8px", paddingTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>VAT (15%)</span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{fmt(proposal.pricing_summary.vat_15_percent_once_off)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#1a2a3a" }}>Total once-off (incl. VAT)</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#2463AE" }}>{fmt(proposal.pricing_summary.grand_total_once_off_incl_vat)}</span>
              </div>
              {proposal.pricing_summary.total_monthly_recurring > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a2a3a" }}>Monthly total (incl. VAT)</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#2463AE" }}>{fmt(proposal.pricing_summary.grand_total_monthly_incl_vat)}/mo</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(proposal, null, 2))}
              style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
              Copy JSON
            </button>
            <button onClick={onClose}
              style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

function FieldLabel({ label, hint }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", lineHeight: 1.4 }}>{label}</span>
        {hint && (
          <button
            onClick={() => setOpen(v => !v)}
            style={{ width: "18px", height: "18px", borderRadius: "50%", background: open ? "#2463AE" : "#dbeafe", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: open ? "#fff" : "#2463AE", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0, lineHeight: 1, fontFamily: "serif" }}
            aria-label="Show guidance"
          >i</button>
        )}
      </div>
      {hint && open && (
        <div style={{ marginTop: "7px", padding: "10px 12px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a5f", lineHeight: 1.65 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function SelectField({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const selected = value || "";
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "14px 44px 14px 14px", borderRadius: "8px",
        border: selected ? "2px solid #2463AE" : "1.5px solid #d1d9e0",
        fontSize: "16px", fontFamily: FONT_BODY,
        boxSizing: "border-box", background: selected ? "#eff6ff" : "#fff",
        color: selected ? "#1a2a3a" : "#6b7280", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        userSelect: "none", minHeight: "52px", transition: "all 0.15s"
      }}>
        <span style={{ lineHeight: 1.4 }}>{selected || "Select an answer…"}</span>
        <span style={{ color: selected ? "#2463AE" : "#9ca3af", fontSize: "13px", position: "absolute", right: "14px" }}>
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
                padding: "14px 16px", fontSize: "15px", fontFamily: FONT_BODY,
                cursor: "pointer", color: selected === opt ? "#1C5BA3" : "#1a2a3a",
                background: selected === opt ? "#eff6ff" : "#fff",
                fontWeight: selected === opt ? 600 : 400,
                borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", gap: "8px",
                minHeight: "48px"
              }}>
              {selected === opt && <span style={{ color: "#2463AE", fontSize: "13px" }}>✓</span>}
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <button key={opt} type="button"
            onClick={() => onChange(on ? selected.filter(s => s !== opt) : [...selected, opt])}
            style={{
              padding: "12px 16px", minHeight: "48px", borderRadius: "10px",
              border: on ? "2px solid #2463AE" : "1.5px solid #d1d9e0",
              background: on ? "#eff6ff" : "#fff",
              color: on ? "#1C5BA3" : "#4a5568",
              fontSize: "15px", fontFamily: FONT_BODY,
              cursor: "pointer", fontWeight: on ? 600 : 400,
              display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s"
            }}>
            {on && <span style={{ color: "#2463AE", fontSize: "13px" }}>✓</span>}
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
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: size * 0.26, fontWeight: 700, fill: "#1a2a3a", fontFamily: FONT_BODY }}>
        {percent}%
      </text>
    </svg>
  );
}

// ── ACTION PLAN MODAL ─────────────────────────────────────────────────
function ActionPlanModal({ plan, onClose, onRequestHelp }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(5,15,36,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
      <div style={{ background: "rgba(30, 41, 59, 0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "28px", maxWidth: 700, width: "100%", maxHeight: "85vh", overflowY: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", color: "#f1f5f9", fontFamily: FONT_BODY }}>
        <h2 style={{ fontFamily: FONT_HEAD, fontSize: "22px", fontWeight: 600, color: "#fff", marginBottom: "6px" }}>{plan.title}</h2>
        <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "16px" }}>{plan.description}</p>

        <div style={{ background: "rgba(107,163,232,0.1)", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", border: "1px solid rgba(107,163,232,0.25)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontFamily: FONT_BRAND, fontSize: "11px", color: "#6BA3E8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "2px" }}>Timeline</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{plan.estimatedTimeline}</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_BRAND, fontSize: "11px", color: "#6BA3E8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "2px" }}>Estimated Cost</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{plan.estimatedCost}</div>
            </div>
          </div>
        </div>

        <h3 style={{ fontFamily: FONT_BRAND, fontSize: "12px", fontWeight: 700, color: "#6BA3E8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "12px" }}>Implementation Steps</h3>
        {plan.steps.map((s, i) => (
          <div key={i} style={{ marginBottom: "14px", paddingLeft: "20px", borderLeft: "2px solid rgba(107,163,232,0.3)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Step {s.step}: {s.action}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>
              <span style={{ fontWeight: 600 }}>Owner:</span> {s.owner} · <span style={{ fontWeight: 600 }}>Timeline:</span> {s.timeline} · <span style={{ fontWeight: 600 }}>Cost:</span> {s.cost}
            </div>
            <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "2px", fontStyle: "italic" }}>{s.details}</div>
          </div>
        ))}

        <div style={{ fontSize: "12px", color: "#cbd5e1", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "6px", marginBottom: "16px", borderLeft: "3px solid rgba(107,163,232,0.5)" }}>
          <span style={{ fontWeight: 700, color: "#6BA3E8" }}>Legal Requirement:</span> {plan.law}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", minHeight: "44px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
            Close
          </button>
          <button onClick={onRequestHelp} style={{ flex: 1, padding: "12px", minHeight: "44px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY, boxShadow: "0 0 20px rgba(36,99,174,0.4)" }}>
            Request Help from Big Bay Administrators
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <h3 style={{ fontFamily: FONT_BRAND, fontSize: "11px", fontWeight: 700, color: "#6BA3E8", textTransform: "uppercase", letterSpacing: "0.7px", margin: "0 0 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>{title}</h3>
      <div style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

// ── COMPONENTS ────────────────────────────────────────────────────────

function ExitConfirmModal({ onStay, onExit }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px 24px", width: "min(360px, 100%)", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", fontFamily: FONT_BODY }}>
        <div style={{ fontSize: "38px", marginBottom: "12px" }}>⚠️</div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", margin: "0 0 10px" }}>Exit assessment?</h2>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 22px" }}>
          Your progress has been saved — you can return at any time. Are you sure you want to leave?
        </p>
        <button onClick={onStay}
          style={{ width: "100%", padding: "14px", marginBottom: "10px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY }}>
          Continue assessment
        </button>
        <button onClick={onExit}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
          Yes, exit
        </button>
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
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [popiConsent, setPopiConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminPwd, setAdminPwd] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const supabaseTimer = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rmcp-clients");
      if (saved) setClients(JSON.parse(saved));
    } catch (e) { console.log("No saved data"); }
  }, []);

  useEffect(() => {
    const inForm = view === "editor" || view === "dashboard";
    if (!inForm) return;
    window.history.pushState({ rmcp: true }, "");
    const onPop = () => {
      setShowExitConfirm(true);
      window.history.pushState({ rmcp: true }, "");
    };
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("popstate", onPop);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [view]);

  const saveClients = useCallback((updated) => {
    setSaving(true);
    setClients(updated);
    try { localStorage.setItem("rmcp-clients", JSON.stringify(updated)); }
    catch (e) { console.error("Save failed:", e); }
    setTimeout(() => setSaving(false), 800);
  }, []);

  const syncClientToDb = async (client) => {
    try {
      const { data, error } = await supabase.from("clients").upsert(mapToDb(client)).select("id").single();
      if (error) console.error("Supabase sync failed:", error.message);
      return data?.id;
    } catch (e) { console.error("Supabase sync error:", e); }
  };

  const updateField = (fieldId, value) => {
    const updated = { ...formData, [fieldId]: value };
    setFormData(updated);
    setSectionError(false);
    if (activeClient !== null) {
      const updatedClients = clients.map((c, i) => i === activeClient ? { ...c, data: updated, lastModified: new Date().toISOString() } : c);
      saveClients(updatedClients);
      clearTimeout(supabaseTimer.current);
      supabaseTimer.current = setTimeout(() => syncClientToDb(updatedClients[activeClient]), 2000);
    }
  };

  const addClient = async () => {
    if (!leadData.company.trim()) return;
    const newClient = { ...leadData, created: new Date().toISOString(), lastModified: new Date().toISOString(), data: {}, submitted: false, helpRequests: {} };
    const dbId = await syncClientToDb(newClient);
    if (dbId) newClient.id = dbId;
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
  const deleteClient = (idx) => {
    const client = clients[idx];
    if (client?.id) supabase.from("clients").delete().eq("id", client.id).then(({ error }) => { if (error) console.error("Supabase delete failed:", error.message); });
    const u = clients.filter((_, i) => i !== idx);
    saveClients(u);
    if (activeClient === idx) { setActiveClient(null); setView("clients"); }
  };

  const submitRMCP = async () => {
    if (activeClient !== null) {
      const client = clients[activeClient];
      const submittedClient = { ...client, submitted: true, submittedDate: new Date().toISOString(), helpRequests };
      saveClients(clients.map((c, i) => i === activeClient ? submittedClient : c));
      syncClientToDb(submittedClient);
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

  const requestHelp = async (planKey) => {
    const newHelp = { ...helpRequests, [planKey]: true };
    setHelpRequests(newHelp);
    const updated = clients.map((c, i) => i === activeClient ? { ...c, helpRequests: newHelp } : c);
    saveClients(updated);
    if (activeClient !== null) syncClientToDb(updated[activeClient]);
    setSelectedPlan(null);

    if (activeClient !== null) {
      const client = clients[activeClient];
      const plan = ACTION_PLANS[planKey];
      const body = `Help Request Received — RMCPPro

Client: ${client.company}
Contact: ${client.contact || "Not provided"}
Email: ${client.email || "Not provided"}
Phone: ${client.phone || "Not provided"}

Action Plan Requested:
${plan ? plan.title : planKey}
${plan ? `Priority: ${plan.priority}` : ""}
${plan ? `Timeline: ${plan.estimatedTimeline}` : ""}
${plan ? `Estimated Cost: ${plan.estimatedCost}` : ""}
${plan ? `Regulatory Reference: ${plan.law}` : ""}

Please contact the client to discuss implementation.`;

      try {
        await fetch("https://rmcp-pro.vercel.app/api/send-rmcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail: "jerome@bigbayadmin.co.za",
            clientName: `HELP REQUEST: ${client.company} — ${plan ? plan.title : planKey}`,
            rmcpHtml: `<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h1 style="color:#1C5BA3">Help Request: ${client.company}</h1><pre style="background:#f5f5f5;padding:16px;border-radius:6px;white-space:pre-wrap">${body}</pre></body></html>`,
            coverLetter: body,
          }),
        });
      } catch (err) {
        console.error("Help request notification failed:", err.message);
      }
    }
  };

  // ── DASHBOARD (with action plans) ──────────────────────────────────
  if (view === "dashboard" && activeClient !== null) {
    const client = clients[activeClient];
    const completeness = calculateCompleteness(formData);
    const compliance = calculateComplianceScore(formData);
    const flags = getRiskFlags(formData);

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: FONT_BODY }}>
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
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{s.sub}</div>
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
                      <span style={{ padding: "3px 8px", borderRadius: "6px", background: plan.priority === "CRITICAL" ? "#fee2e2" : plan.priority === "HIGH" ? "#fffbeb" : "#f0fdf4", color: plan.priority === "CRITICAL" ? "#dc2626" : plan.priority === "HIGH" ? "#d97706" : "#16a34a", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
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
                      <button onClick={() => setSelectedPlan(plan)} style={{ flex: 1, padding: "11px 12px", minHeight: "44px", borderRadius: "6px", border: "1.5px solid #cbd5e0", background: "#fff", color: "#4a5568", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
                        View Full Plan
                      </button>
                      <button onClick={() => requestHelp(planKey)} disabled={isRequested} style={{ flex: 1, padding: "11px 12px", minHeight: "44px", borderRadius: "6px", border: "none", background: isRequested ? "#d1fae5" : "#2463AE", color: isRequested ? "#1A4A8A" : "#fff", fontSize: "11px", fontWeight: 600, cursor: isRequested ? "default" : "pointer", fontFamily: FONT_BODY }}>
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
          <button onClick={submitRMCP} style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY, boxShadow: "0 4px 16px rgba(36,99,174,0.25)", marginBottom: "10px" }}>
            ✓ Submit to Big Bay Administrators for Review
          </button>
          <button onClick={() => { setActiveSection(0); setView("editor"); }} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
            ← Back to Edit
          </button>
        </div>

        {selectedPlan && <ActionPlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} onRequestHelp={() => requestHelp(Object.keys(ACTION_PLANS).find(k => ACTION_PLANS[k] === selectedPlan))} />}
        {showExitConfirm && <ExitConfirmModal onStay={() => setShowExitConfirm(false)} onExit={() => { setShowExitConfirm(false); setView(isAdmin ? "clients" : "landing"); setActiveClient(null); }} />}
      </div>
    );
  }

  // ── LANDING ──────────────────────────────────────────────────────────
  if (view === "landing") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #050F24 0%, #0D2147 40%, #071A3B 100%)", fontFamily: FONT_BODY, color: "#fff", position: "relative", overflow: "hidden" }}>
      {/* Subtle grid overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse at 50% 30%, #000 30%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, #000 30%, transparent 75%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(107,163,232,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -150, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(36,99,174,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⚖</div>
          <span style={{ fontFamily: FONT_BRAND, fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>RMCP<span style={{ color: "#6BA3E8" }}>Pro</span></span>
        </div>
        <button onClick={() => setView("adminLogin")} style={{ padding: "12px 20px", minHeight: "44px", borderRadius: "8px", border: "1.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
          Admin Login
        </button>
      </div>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "32px 20px 32px", textAlign: "center", position: "relative", zIndex: 2 }}>
        <div style={{ fontFamily: FONT_BRAND, display: "inline-block", padding: "6px 16px", borderRadius: "20px", background: "rgba(107,163,232,0.15)", border: "1px solid rgba(107,163,232,0.4)", fontSize: "11px", fontWeight: 600, color: "#6BA3E8", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "24px", boxShadow: "0 0 20px rgba(107,163,232,0.15)" }}>
          ✦ FICA Section 43 Compliance Tool
        </div>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: "clamp(40px, 7vw, 84px)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "20px" }}>
          Your RMCP,<br /><span style={{ color: "#6BA3E8", fontStyle: "italic" }}>done properly.</span>
        </h1>
        <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", maxWidth: 500, margin: "0 auto 14px" }}>
          Answer a few simple questions about your property agency. We use your answers to build your Risk Management and Compliance Programme and show you action plans to close any gaps.
        </p>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "36px" }}>Takes about 10–15 minutes. No compliance knowledge needed.</p>
        <button onClick={() => setShowLeadForm(true)} style={{ position: "relative", padding: "16px 40px", minHeight: "52px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY, boxShadow: "0 0 40px rgba(36,99,174,0.45), 0 0 80px rgba(107,163,232,0.2), 0 8px 24px rgba(0,0,0,0.3)" }}>
          Start My Free RMCP Assessment →
        </button>
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap" }}>
          <button onClick={() => setShowExplainer(v => !v)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer", fontFamily: FONT_BODY, textDecoration: "underline", padding: 0 }}>
            {showExplainer ? "Hide explanation ▲" : "What is an RMCP? ▼"}
          </button>
          <a href="https://www.fic.gov.za/faq/" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", textDecoration: "underline", fontFamily: FONT_BODY }}>
            FIC FAQs →
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
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 12px" }}>
              This tool guides you through the required sections. Big Bay Administrators then reviews your answers and produces your formal, signed RMCP document.
            </p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6BA3E8", textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 8px" }}>Who is an Accountable Institution? (Schedule 1, FICA)</p>
              <ul style={{ margin: 0, padding: "0 0 0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                {[
                  "Property practitioners (estate agents)",
                  "Attorneys & conveyancers",
                  "Accountants & auditors",
                  "Tax practitioners",
                  "Banks & mutual banks",
                  "Life insurers",
                  "Collective investment schemes",
                  "Forex & money transfer operators",
                  "Motor vehicle dealers",
                  "Dealers in high-value goods",
                  "Trust & company service providers",
                  "Gambling institutions",
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div style={{ maxWidth: 520, margin: "20px auto 0", display: "flex", flexDirection: "column", gap: "10px", position: "relative", zIndex: 2 }}>
          {[
            { icon: "📝", title: "Simple questions", desc: "Plain language — no legal jargon. Just describe how your agency operates." },
            { icon: "📊", title: "Action plans included", desc: "See exactly how to fix each compliance gap — with timelines and costs." },
            { icon: "📄", title: "Professional document", desc: "Big Bay Administrators reviews your answers and produces your formal RMCP document." },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "22px", flexShrink: 0 }}>{f.icon}</div>
              <div>
                <h3 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 2px", color: "#fff" }}>{f.title}</h3>
                <p style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(255,255,255,0.5)", margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "20px" }}>Big Bay Administrators reviews and finalises your RMCP document once complete.</p>
      </div>

      {/* FAQ Section */}
      <div style={{ position: "relative", zIndex: 2, padding: "60px 20px 40px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontFamily: FONT_BRAND, fontSize: "11px", fontWeight: 600, color: "#6BA3E8", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "10px" }}>Common Questions</div>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            Frequently asked <span style={{ color: "#6BA3E8", fontStyle: "italic" }}>questions</span>
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { q: "What is an RMCP and who needs one?", a: "A Risk Management and Compliance Programme (RMCP) is a document required by FICA Section 43 for all accountable institutions — including property practitioners registered with the PPRA, attorneys, accountants, and others listed in Schedule 1. Without one, you are non-compliant and face penalties from the Financial Intelligence Centre." },
            { q: "Am I a 'property practitioner' under FICA?", a: "If you hold a Fidelity Fund Certificate (FFC) from the PPRA and you facilitate the sale, lease, financing, or letting of property, you are an accountable institution under FICA Schedule 1, Item 20 — and you must have an RMCP." },
            { q: "Is my data safe? (POPIA)", a: "Yes. Big Bay Administrators is the responsible party under POPIA. Your information is stored on secure infrastructure, encrypted in transit, and only accessed for the purpose of preparing your RMCP. We do not sell or share your data with third parties. See our Privacy Policy for full details and your data subject rights." },
            { q: "How long does the assessment take?", a: "Most practitioners complete it in 10–15 minutes. There are six sections covering governance, risk assessment, customer due diligence, monitoring, record keeping, and reporting. You can save and return at any time." },
            { q: "What does Big Bay Administrators do with my submission?", a: "We review your answers, identify any compliance gaps, and produce a formal, signed RMCP document tailored to your agency. You receive a copy by email. We may contact you about action plans to close any gaps we identify." },
            { q: "Do you store passwords or financial information?", a: "No. The platform does not request or store passwords for any of your other systems, banking details, or client financial records. We only collect the information needed to draft your RMCP." },
          ].map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={i} style={{ background: open ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${open ? "rgba(107,163,232,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "12px", overflow: "hidden", transition: "background 200ms ease, border 200ms ease" }}>
                <button onClick={() => setOpenFaq(open ? null : i)} style={{ width: "100%", padding: "18px 20px", minHeight: "56px", background: "none", border: "none", color: "#fff", fontSize: "15px", fontWeight: 600, fontFamily: FONT_BODY, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <span>{item.q}</span>
                  <span style={{ display: "inline-flex", width: "28px", height: "28px", borderRadius: "50%", background: open ? "#6BA3E8" : "rgba(107,163,232,0.15)", color: open ? "#0D2147" : "#6BA3E8", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 300ms ease, background 200ms ease", flexShrink: 0 }}>⌃</span>
                </button>
                <div style={{ maxHeight: open ? "600px" : "0px", overflow: "hidden", transition: "max-height 350ms ease, padding 300ms ease", padding: open ? "0 20px 20px" : "0 20px" }}>
                  <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.7)", margin: 0 }}>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "24px 32px", textAlign: "center", position: "relative", zIndex: 2 }}>
        {/* ECTA s43 Supplier Disclosure */}
        <div style={{ maxWidth: 560, margin: "0 auto 14px", padding: "12px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "left" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 6px" }}>Supplier Information (ECTA s43)</p>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", lineHeight: 1.8, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
            <span><strong style={{ color: "rgba(255,255,255,0.35)" }}>Legal name:</strong> Big Bay Administrators (Pty) Ltd</span>
            <span><strong style={{ color: "rgba(255,255,255,0.35)" }}>Reg no:</strong> [Insert reg no]</span>
            <span><strong style={{ color: "rgba(255,255,255,0.35)" }}>Address:</strong> Big Bay, Blouberg, Cape Town</span>
            <span><strong style={{ color: "rgba(255,255,255,0.35)" }}>Email:</strong> jerome@bigbayadmin.co.za</span>
          </div>
        </div>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "0 0 8px" }}>
          © {new Date().getFullYear()} Big Bay Administrators (Pty) Ltd · Cape Town, South Africa
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "4px 12px", flexWrap: "wrap" }}>
          {[
            { label: "Terms of Use", action: () => setShowTerms(true) },
            { label: "Privacy Policy (POPIA)", action: () => setShowPrivacyPolicy(true) },
            { label: "PAIA Manual", action: () => setShowPrivacyPolicy(true) },
          ].map((item, i) => (
            <button key={i} onClick={item.action} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer", textDecoration: "underline", fontFamily: FONT_BODY, padding: "8px 4px", minHeight: "44px" }}>
              {item.label}
            </button>
          ))}
          <a href="mailto:jerome@bigbayadmin.co.za" style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textDecoration: "underline", fontFamily: FONT_BODY, padding: "8px 4px", display: "inline-flex", alignItems: "center", minHeight: "44px" }}>
            jerome@bigbayadmin.co.za
          </a>
        </div>
      </div>
      {showTerms && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,15,36,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", overflowY: "auto", WebkitOverflowScrolling: "touch", zIndex: 200, padding: "16px 16px 40px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          <div style={{ background: "rgba(30, 41, 59, 0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", width: "min(560px, 92vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.5)", color: "#f1f5f9", fontFamily: FONT_BODY }}>
            <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontFamily: FONT_HEAD, fontSize: "20px", fontWeight: 600, color: "#fff", margin: 0 }}>Terms of Use</h2>
                <p style={{ fontFamily: FONT_BRAND, fontSize: "11px", color: "#6BA3E8", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.6px" }}>Big Bay Administrators (Pty) Ltd · {new Date().getFullYear()}</p>
              </div>
              <button onClick={() => setShowTerms(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "20px", cursor: "pointer", color: "#cbd5e1", lineHeight: 1, width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "20px 24px", fontSize: "13px", color: "#e2e8f0", lineHeight: 1.75 }}>

              <Section title="1. Acceptance of Terms">
                <p>By accessing or using the RMCPPro platform ("the Platform") operated by Big Bay Administrators (Pty) Ltd ("Big Bay Administrators", "we", "us"), you confirm that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree, you may not use the Platform.</p>
                <p>These terms constitute a binding electronic agreement under the Electronic Communications and Transactions Act 25 of 2002 (<strong>ECTA</strong>).</p>
              </Section>

              <Section title="2. Eligibility">
                <p>You may only use the Platform if you:</p>
                <ul>
                  <li>Are 18 years of age or older</li>
                  <li>Are acting in a business capacity as a registered property practitioner, accountable institution, or authorised representative thereof</li>
                  <li>Are not prohibited by any applicable law from entering into this agreement</li>
                </ul>
                <p>Use of the Platform by consumers acting in a personal capacity is not intended and confers no rights under the Consumer Protection Act 68 of 2008 in respect of the RMCP service.</p>
              </Section>

              <Section title="3. Nature of Service">
                <p>The Platform provides a <strong>compliance assessment tool</strong> that guides registered property practitioners and other accountable institutions through the process of documenting their Risk Management and Compliance Programme (RMCP) as required by the Financial Intelligence Centre Act 38 of 2001 (FICA) Section 43.</p>
                <p><strong>The Platform does not provide legal advice.</strong> The information and output generated are based on the answers you provide and constitute a template document prepared with your input. Big Bay Administrators reviews your submission and produces a formal RMCP document, but:</p>
                <ul>
                  <li>The final RMCP is based solely on the information you supply — accuracy is your responsibility</li>
                  <li>We do not guarantee that the document will satisfy every regulatory requirement applicable to your specific circumstances</li>
                  <li>You should obtain independent legal or compliance advice if you are uncertain about your obligations</li>
                </ul>
              </Section>

              <Section title="4. Limitation of Liability">
                <p>To the maximum extent permitted by South African law, Big Bay Administrators shall not be liable for:</p>
                <ul>
                  <li>Any regulatory penalties, fines, or sanctions imposed on you by the FIC, PPRA, or any other authority arising from your RMCP or compliance programme</li>
                  <li>Any loss, damage, or expense arising from reliance on the Platform's output without independent verification</li>
                  <li>Inaccuracies in your RMCP resulting from incorrect or incomplete information you provided</li>
                  <li>Interruptions in service, data loss, or technical failures beyond our reasonable control</li>
                </ul>
                <p>Our total aggregate liability to you in respect of any claim shall not exceed the fees paid by you to Big Bay Administrators in the 12 months preceding the claim.</p>
              </Section>

              <Section title="5. User Obligations">
                <p>You agree to:</p>
                <ul>
                  <li>Provide accurate, complete, and truthful information in your assessment</li>
                  <li>Not use the Platform for any unlawful purpose</li>
                  <li>Not attempt to access, modify, or interfere with the Platform's systems or data</li>
                  <li>Keep your access credentials confidential</li>
                  <li>Notify us immediately if you become aware of any unauthorised use of the Platform</li>
                </ul>
              </Section>

              <Section title="6. Intellectual Property">
                <p>All content on the Platform, including the assessment structure, action plan library, compliance guidance, and generated document templates, is the intellectual property of Big Bay Administrators (Pty) Ltd. You may not copy, reproduce, or distribute any content without our prior written consent.</p>
                <p>The RMCP document generated for you is licensed for your internal compliance use only and may not be sold, sublicensed, or represented as independently authored.</p>
              </Section>

              <Section title="7. Amendments">
                <p>We may update these Terms of Use at any time. Continued use of the Platform after changes are published constitutes acceptance of the updated terms. Material changes will be notified via the email address you provided.</p>
              </Section>

              <Section title="8. Governing Law">
                <p>These Terms of Use are governed by the laws of the Republic of South Africa. Any dispute arising from or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of the Western Cape Division of the High Court of South Africa.</p>
              </Section>

              <Section title="9. Contact">
                <p><strong>Big Bay Administrators (Pty) Ltd</strong><br />Big Bay, Blouberg, Cape Town, Western Cape<br />Email: jerome@bigbayadmin.co.za</p>
              </Section>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setShowTerms(false)} style={{ width: "100%", padding: "12px", minHeight: "44px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY, boxShadow: "0 0 20px rgba(36,99,174,0.4)" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showPrivacyPolicy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,15,36,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", overflowY: "auto", WebkitOverflowScrolling: "touch", zIndex: 200, padding: "16px 16px 40px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          <div style={{ background: "rgba(30, 41, 59, 0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", width: "min(560px, 92vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.5)", color: "#f1f5f9", fontFamily: FONT_BODY }}>
            <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontFamily: FONT_HEAD, fontSize: "20px", fontWeight: 600, color: "#fff", margin: 0 }}>Privacy Policy & PAIA Manual</h2>
                <p style={{ fontFamily: FONT_BRAND, fontSize: "11px", color: "#6BA3E8", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.6px" }}>Big Bay Administrators (Pty) Ltd · {new Date().getFullYear()}</p>
              </div>
              <button onClick={() => setShowPrivacyPolicy(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "20px", cursor: "pointer", color: "#cbd5e1", lineHeight: 1, width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "20px 24px", fontSize: "13px", color: "#e2e8f0", lineHeight: 1.75 }}>

              <Section title="1. Who We Are">
                <p>Big Bay Administrators (Pty) Ltd ("Big Bay Administrators", "we", "us") is a compliance services company registered in South Africa. We are the <strong>responsible party</strong> for the personal information you provide through this platform, as defined in the Protection of Personal Information Act 4 of 2013 (<strong>POPIA</strong>).</p>
                <p><strong>Information Officer:</strong> Jerome Adams<br /><strong>Email:</strong> jerome@bigbayadmin.co.za<br /><strong>Address:</strong> Big Bay, Cape Town, Western Cape</p>
              </Section>

              <Section title="2. What Information We Collect">
                <p>When you use this RMCP assessment tool, we collect:</p>
                <ul>
                  <li>Company / trading name and FFC (PPRA) registration number</li>
                  <li>Contact person name, email address, and phone number</li>
                  <li>Compliance information you provide in the assessment (risk profile, policies, procedures)</li>
                  <li>Date and timestamp of submission</li>
                </ul>
              </Section>

              <Section title="3. Why We Collect It (Purpose)">
                <p>Your information is collected and processed solely to:</p>
                <ul>
                  <li>Prepare your formal Risk Management and Compliance Programme (RMCP) document required under FICA Section 43</li>
                  <li>Communicate with you regarding your RMCP and compliance obligations</li>
                  <li>Provide compliance advisory services you have requested</li>
                </ul>
                <p>We will not use your information for any other purpose without your prior consent.</p>
              </Section>

              <Section title="4. Legal Basis for Processing">
                <p>We process your personal information on the following grounds under POPIA:</p>
                <ul>
                  <li><strong>Consent</strong> — you have given explicit consent by ticking the consent checkbox before submitting your assessment</li>
                  <li><strong>Contractual necessity</strong> — processing is necessary to deliver the RMCP service you have requested</li>
                  <li><strong>Legal obligation</strong> — we are required to maintain accurate records of compliance services rendered</li>
                </ul>
              </Section>

              <Section title="5. Who We Share Your Information With">
                <p>We do not sell or share your personal information with third parties for marketing purposes. Your information may be shared only with:</p>
                <ul>
                  <li>Our internal staff directly involved in preparing your RMCP</li>
                  <li>Service providers (e.g. email delivery) who process data strictly on our behalf and under confidentiality obligations</li>
                  <li>Regulatory authorities (e.g. FIC, PPRA) where required by law</li>
                </ul>
              </Section>

              <Section title="6. Retention">
                <p>We retain your personal information for a minimum of <strong>5 years</strong> from the date of submission, in line with FICA record-keeping requirements. After this period, records are securely destroyed.</p>
              </Section>

              <Section title="7. Your Rights Under POPIA">
                <p>You have the right to:</p>
                <ul>
                  <li>Access the personal information we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your information (subject to legal retention obligations)</li>
                  <li>Object to processing of your information</li>
                  <li>Lodge a complaint with the <strong>Information Regulator</strong> at <em>inforeg@justice.gov.za</em></li>
                </ul>
                <p>To exercise any of these rights, contact: <strong>jerome@bigbayadmin.co.za</strong></p>
              </Section>

              <Section title="8. Security">
                <p>We take reasonable technical and organisational measures to protect your personal information against unauthorised access, loss, or misuse. Access to submissions is restricted to authorised Big Bay Administrators staff only.</p>
              </Section>

              <Section title="9. PAIA — Promotion of Access to Information Act">
                <p>In terms of the Promotion of Access to Information Act 2 of 2000 (<strong>PAIA</strong>), you have the right to request access to records held by Big Bay Administrators.</p>
                <p><strong>Information Officer:</strong> Jerome Adams<br /><strong>Request procedure:</strong> Submit a written request to jerome@bigbayadmin.co.za describing the records you seek. We will respond within <strong>30 days</strong> as required by PAIA.<br /><strong>Form to use:</strong> PAIA Form C (available from the South African Government website)</p>
                <p>Requests may be refused on grounds set out in PAIA (e.g. third-party privacy, commercial confidentiality). You may appeal a refusal to the Information Regulator.</p>
              </Section>

              <Section title="10. Changes to This Policy">
                <p>We may update this policy from time to time. The current version is always available on this platform. Continued use of our services after changes constitutes acceptance of the updated policy.</p>
              </Section>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setShowPrivacyPolicy(false)} style={{ width: "100%", padding: "12px", minHeight: "44px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY, boxShadow: "0 0 20px rgba(36,99,174,0.4)" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showLeadForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", overflowY: "auto", WebkitOverflowScrolling: "touch", zIndex: 100, padding: "16px 16px 40px" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px 20px", width: "min(420px, 100%)", margin: "0 auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", marginBottom: "4px" }}>Start Your RMCP Assessment</h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "18px" }}>Enter your agency details to begin</p>
            {[
              { key: "company", label: "Company / Trading Name *", placeholder: "e.g. Atlantic Seaboard Properties (Pty) Ltd" },
              { key: "contact", label: "Contact Person", placeholder: "Full name" },
              { key: "email", label: "Email Address", placeholder: "name@company.co.za", inputMode: "email" },
              { key: "phone", label: "Phone Number", placeholder: "082 123 4567", inputMode: "tel" },
              { key: "ffc", label: "FFC Number (PPRA)", placeholder: "Fidelity Fund Certificate number" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>{f.label}</label>
                <input value={leadData[f.key]} onChange={e => setLeadData({ ...leadData, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  inputMode={f.inputMode}
                  style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "16px", fontFamily: FONT_BODY, boxSizing: "border-box", outline: "none", color: "#1a2a3a", background: "#fff", minHeight: "52px", WebkitAppearance: "none" }}
                  onFocus={e => e.target.style.borderColor = "#2463AE"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
              </div>
            ))}
            <div style={{ marginTop: "16px", padding: "14px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                <input type="checkbox" checked={popiConsent} onChange={e => setPopiConsent(e.target.checked)}
                  style={{ width: "20px", height: "20px", marginTop: "1px", accentColor: "#2463AE", flexShrink: 0, cursor: "pointer" }} />
                <span style={{ fontSize: "13px", color: "#4a5568", lineHeight: 1.6 }}>
                  I consent to Big Bay Administrators (Pty) Ltd collecting and processing my personal information in accordance with the{" "}
                  <button onClick={() => setShowPrivacyPolicy(true)} style={{ background: "none", border: "none", color: "#2463AE", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline", fontFamily: FONT_BODY }}>
                    Privacy Policy (POPIA)
                  </button>.
                </span>
              </label>
            </div>
            <div style={{ marginTop: "10px", padding: "14px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                <input type="checkbox" checked={termsConsent} onChange={e => setTermsConsent(e.target.checked)}
                  style={{ width: "20px", height: "20px", marginTop: "1px", accentColor: "#2463AE", flexShrink: 0, cursor: "pointer" }} />
                <span style={{ fontSize: "13px", color: "#4a5568", lineHeight: 1.6 }}>
                  I have read and agree to the{" "}
                  <button onClick={() => setShowTerms(true)} style={{ background: "none", border: "none", color: "#2463AE", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline", fontFamily: FONT_BODY }}>
                    Terms of Use
                  </button>.
                </span>
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={() => { setShowLeadForm(false); setLeadData({ company: "", contact: "", email: "", phone: "", ffc: "" }); setPopiConsent(false); setTermsConsent(false); }}
                style={{ flex: 1, padding: "14px", minHeight: "52px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>Cancel</button>
              <button onClick={addClient} disabled={!leadData.company.trim() || !popiConsent || !termsConsent}
                style={{ flex: 1, padding: "14px", minHeight: "52px", borderRadius: "10px", border: "none", background: leadData.company.trim() && popiConsent && termsConsent ? "#2463AE" : "#d1d9e0", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: leadData.company.trim() && popiConsent && termsConsent ? "pointer" : "default", fontFamily: FONT_BODY }}>
                Start →
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
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: FONT_BODY }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => setView("landing")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}>←</button>
          <div style={{ width: 28, height: 28, borderRadius: "7px", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>⚖</div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a2a3a" }}>RMCPPro <span style={{ fontWeight: 400, color: "#94a3b8" }}>Client Manager</span></span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {saving && <span style={{ fontSize: "11px", color: "#6BA3E8" }}>✓ Saved</span>}
          <button onClick={() => setShowLeadForm(true)} style={{ padding: "12px 16px", minHeight: "44px", borderRadius: "7px", border: "none", background: "#2463AE", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>+ Add Client</button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}>
        {showLeadForm && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", width: "min(420px, 92vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
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
                    style={{ width: "100%", padding: "14px 12px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "16px", fontFamily: FONT_BODY, boxSizing: "border-box", outline: "none", color: "#1a2a3a", background: "#fff", minHeight: "52px" }}
                    onFocus={e => e.target.style.borderColor = "#2463AE"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                </div>
              ))}
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={() => { setShowLeadForm(false); setLeadData({ company: "", contact: "", email: "", phone: "", ffc: "" }); }}
                  style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>Cancel</button>
                <button onClick={addClient} disabled={!leadData.company.trim()}
                  style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "none", background: leadData.company.trim() ? "#2463AE" : "#d1d9e0", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: leadData.company.trim() ? "pointer" : "default", fontFamily: FONT_BODY }}>
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
            <button onClick={() => setShowLeadForm(true)} style={{ padding: "10px 22px", borderRadius: "8px", border: "none", background: "#2463AE", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>+ Add First Client</button>
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
                      {client.submitted && <span style={{ padding: "2px 7px", borderRadius: "6px", background: "#d1fae5", color: "#1A4A8A", fontSize: "12px", fontWeight: 700 }}>✓ SUBMITTED</span>}
                      {critical > 0 && !client.submitted && <span style={{ padding: "2px 7px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626", fontSize: "12px", fontWeight: 700 }}>{critical} CRITICAL</span>}
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
      <>
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: FONT_BODY }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "11px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => setShowExitConfirm(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}>←</button>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a" }}>{client.company}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>RMCP Assessment — Section {activeSection + 1} of {RMCP_SECTIONS.length}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {saving && <span style={{ fontSize: "11px", color: "#6BA3E8" }}>✓ Saved</span>}
            <button onClick={() => setView("dashboard")} style={{ padding: "10px 12px", minHeight: "44px", borderRadius: "6px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#4a5568", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
              Review Summary →
            </button>
          </div>
        </div>

        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "8px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px" }}>Overall progress</span>
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
                  cursor: "pointer", fontFamily: FONT_BODY,
                  display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap"
                }}>
                  {s.icon} {s.title.split(" ")[0]}{sc === 100 && <span style={{ color: "#6BA3E8", fontSize: "12px" }}>✓</span>}
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
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "3px" }}>Why this matters</div>
              <div style={{ fontSize: "12px", color: "#1A4A8A", lineHeight: 1.55 }}>This section covers critical FICA compliance requirements specific to property practitioners.</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {section.fields.map(field => (
              <div key={field.id}>
                <FieldLabel label={field.label} hint={field.hint} />
                {field.type === "text" && (
                  <input value={formData[field.id] || ""} onChange={e => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    style={{ width: "100%", padding: "14px", borderRadius: "8px", border: formData[field.id] ? "2px solid #2463AE" : "1.5px solid #d1d9e0", fontSize: "16px", fontFamily: FONT_BODY, boxSizing: "border-box", outline: "none", background: formData[field.id] ? "#eff6ff" : "#fff", color: "#1a2a3a", minHeight: "52px" }}
                    onFocus={e => e.target.style.borderColor = "#2463AE"}
                    onBlur={e => { if (!formData[field.id]) e.target.style.borderColor = "#d1d9e0"; }} />
                )}
                {field.type === "date" && (
                  <input type="date" value={formData[field.id] || ""} onChange={e => updateField(field.id, e.target.value)}
                    style={{ width: "100%", padding: "14px", borderRadius: "8px", border: formData[field.id] ? "2px solid #2463AE" : "1.5px solid #d1d9e0", fontSize: "16px", fontFamily: FONT_BODY, boxSizing: "border-box", outline: "none", background: "#fff", color: "#1a2a3a", colorScheme: "light", minHeight: "52px" }}
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "30px", paddingBottom: "40px", gap: "12px" }}>
            <button onClick={() => setActiveSection(Math.max(0, activeSection - 1))} disabled={activeSection === 0}
              style={{ padding: "13px 20px", minHeight: "44px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#fff", color: activeSection === 0 ? "#d1d9e0" : "#4a5568", fontSize: "13px", fontWeight: 600, cursor: activeSection === 0 ? "default" : "pointer", fontFamily: FONT_BODY }}>
              ← Previous
            </button>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              {sectionError && (
                <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 600, textAlign: "right" }}>
                  ⚠ Please answer all questions
                </span>
              )}
              <button onClick={() => {
                const sc = getSectionCompleteness(section, formData);
                if (sc < 100) { setSectionError(true); return; }
                setSectionError(false);
                activeSection < RMCP_SECTIONS.length - 1 ? setActiveSection(activeSection + 1) : setView("dashboard");
              }}
                style={{ padding: "13px 22px", minHeight: "44px", borderRadius: "8px", border: "none", background: "#2463AE", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
                {activeSection < RMCP_SECTIONS.length - 1 ? "Next →" : "Review & Submit →"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showExitConfirm && <ExitConfirmModal onStay={() => setShowExitConfirm(false)} onExit={() => { setShowExitConfirm(false); setView("landing"); setActiveClient(null); }} />}
      </>
    );
  }

  // ── SUBMITTED ─────────────────────────────────────────────────────────
  if (view === "submitted") {
    const client = activeClient !== null ? clients[activeClient] : null;
    const flags = getRiskFlags(formData);
    const requestedHelps = Object.entries(helpRequests).filter(([_, v]) => v).map(([k]) => k);

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #050F24 0%, #0D2147 40%, #071A3B 100%)", fontFamily: FONT_BODY, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
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
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#6BA3E8" }}>jerome@bigbayadmin.co.za</div>
          </div>

          <button onClick={() => setView("landing")} style={{ padding: "10px 24px", borderRadius: "8px", border: "1.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── ADMIN LOGIN ──────────────────────────────────────────────────
  if (view === "adminLogin") {
    const doAdminLogin = async () => {
      if (!adminPwd) { setAdminLoginError("Please enter a password"); return; }
      if (adminPwd === "Bigbay26") {
        setAdminLoginError("Loading…");
        setAdminPwd("");
        setIsAdmin(true);
        setLoadingClients(true);
        try {
          const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
          if (!error && data) setClients(data.map(mapFromDb));
          else if (error) console.error("Failed to load clients:", error.message);
        } catch (e) { console.error("Supabase load error:", e); }
        setLoadingClients(false);
        setAdminLoginError("");
        setView("admin");
      } else {
        setAdminLoginError("Incorrect password");
      }
    };

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_BODY, padding: "20px" }}>
        <div style={{ background: "#fff", padding: "32px 24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "min(400px, 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>⚖</div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", margin: 0 }}>Admin Login</h2>
          </div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Password</label>
          <input
            type="password"
            value={adminPwd}
            onChange={e => setAdminPwd(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doAdminLogin()}
            placeholder="Enter admin password"
            style={{ width: "100%", padding: "12px 14px", fontSize: "16px", borderRadius: "8px", border: "1.5px solid #e2e8f0", outline: "none", boxSizing: "border-box", marginBottom: "12px" }}
            autoFocus
          />
          <button onClick={doAdminLogin}
            style={{ width: "100%", padding: "14px", minHeight: "52px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>
            Login
          </button>
          {adminLoginError && adminLoginError !== "checking…" && (
            <p style={{ color: "#dc2626", fontSize: "13px", margin: "10px 0 0", fontWeight: 600, padding: "10px 12px", background: "#fef2f2", borderRadius: "6px", border: "1px solid #fecaca" }}>
              ⚠ {adminLoginError}
            </p>
          )}

          <button onClick={() => { setAdminLoginError(""); setView("landing"); }}
            style={{ width: "100%", marginTop: "12px", padding: "14px", minHeight: "52px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#666", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── ADMIN DASHBOARD ─────────────────────────────────────────────
  if (view === "admin") {
    const submittedClients = clients.filter(c => c.submitted);

    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: FONT_BODY }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a3a", margin: "0 0 2px" }}>Big Bay Administrators</h1>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Admin Dashboard — RMCP Submissions{loadingClients ? " · Loading…" : ""}</p>
          </div>
          <button onClick={() => setView("landing")} style={{ padding: "12px 16px", minHeight: "44px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "13px" }}>Logout</button>
        </div>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
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
      const refNo = `BBA-RMCP-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;

      // Helpers
      const val = (v, fallback = "Not specified") => v || fallback;
      const list = (arr) => Array.isArray(arr) && arr.length > 0 ? arr.join(", ") : "Not specified";
      const bullets = (arr) => Array.isArray(arr) && arr.length > 0
        ? `<ul style="margin:4px 0;padding-left:18px">${arr.map(i => `<li style="margin:3px 0">${i}</li>`).join("")}</ul>`
        : `<span style="color:#6b7280">Not specified</span>`;

      // Risk level derivation
      const rawRisk = d.risk_rating || "";
      const riskLevel = rawRisk.startsWith("High") ? "HIGH" : rawRisk.startsWith("Medium") ? "MEDIUM" : rawRisk.startsWith("Low") ? "LOW" : "MEDIUM";
      const residualRisk = riskLevel === "HIGH" ? "MEDIUM" : "LOW";
      const riskBadge = (r) => {
        if (r === "HIGH") return `<span style="background:#fee2e2;color:#b91c1c;padding:2px 10px;border-radius:12px;font-size:9.5pt;font-weight:bold;white-space:nowrap">HIGH</span>`;
        if (r === "MEDIUM") return `<span style="background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:12px;font-size:9.5pt;font-weight:bold;white-space:nowrap">MEDIUM</span>`;
        return `<span style="background:#dcfce7;color:#166534;padding:2px 10px;border-radius:12px;font-size:9.5pt;font-weight:bold;white-space:nowrap">LOW</span>`;
      };

      // Compliance gaps for summary
      const gapsList = flags.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:10pt">
            <thead><tr>
              <th style="background:#991b1b;color:#fff;padding:8px 12px;text-align:left">#</th>
              <th style="background:#991b1b;color:#fff;padding:8px 12px;text-align:left">Compliance Gap Identified</th>
              <th style="background:#991b1b;color:#fff;padding:8px 12px;text-align:left">Action Required</th>
            </tr></thead>
            <tbody>${flags.map((f, i) => `<tr style="background:${i%2===0?"#fff":"#fef2f2"}">
              <td style="padding:8px 12px;border-bottom:1px solid #fecaca;font-weight:bold;color:#991b1b">${i+1}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #fecaca">${f.text}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #fecaca;color:#dc2626">Action plan available — contact Big Bay Administrators</td>
            </tr>`).join("")}</tbody>
          </table>`
        : `<div style="background:#dcfce7;border:1px solid #86efac;border-left:4px solid #16a34a;padding:12px 16px;border-radius:4px;color:#166534"><strong>✓ No critical compliance gaps identified at time of assessment.</strong> Continue to monitor and maintain controls as documented.</div>`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RMCP — ${client.company}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,"Times New Roman",serif;font-size:11pt;color:#1a1a1a;background:#fff;line-height:1.6}
  h1{font-size:15pt;color:#0D2147;margin:0 0 6px;font-family:Georgia,serif}
  h2{font-size:12pt;color:#0D2147;margin:22px 0 8px;font-family:Georgia,serif}
  p{margin:6px 0}
  ul,ol{padding-left:20px;margin:6px 0}
  li{margin:3px 0}
  table{width:100%;border-collapse:collapse;margin:12px 0;font-size:10.5pt}
  th{background:#0D2147;color:#fff;padding:9px 12px;text-align:left;font-size:10pt;font-family:Arial,sans-serif;font-weight:600}
  td{padding:8px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top}
  tr:nth-child(even) td{background:#f8fafc}
  .part-header{background:#0D2147;color:#fff;padding:14px 20px;font-size:14pt;font-weight:bold;margin:30px -32px 20px;font-family:Arial,sans-serif;letter-spacing:0.3px}
  .section-header{background:#EEF3F8;color:#0D2147;padding:8px 14px;font-size:11pt;font-weight:bold;margin:20px 0 10px;border-left:4px solid #2463AE;font-family:Arial,sans-serif}
  .warning{background:#fff8e1;border:1px solid #fbbf24;border-left:5px solid #d97706;padding:12px 16px;margin:14px 0;border-radius:4px;font-size:10.5pt}
  .critical{background:#fee2e2;border:1px solid #fca5a5;border-left:5px solid #dc2626;padding:12px 16px;margin:14px 0;border-radius:4px;font-size:10.5pt}
  .compliant{background:#f0fdf4;border:1px solid #86efac;border-left:5px solid #16a34a;padding:12px 16px;margin:14px 0;border-radius:4px;font-size:10.5pt}
  .info-box{background:#eff6ff;border:1px solid #bfdbfe;border-left:5px solid #2463AE;padding:12px 16px;margin:14px 0;border-radius:4px;font-size:10.5pt}
  .page-break{page-break-after:always}
  .footer-bar{border-top:2px solid #2463AE;margin-top:30px;padding-top:12px;font-size:9pt;color:#64748b;font-family:Arial,sans-serif;text-align:center}
  .page-footer{font-family:Arial,sans-serif;font-size:8.5pt;color:#94a3b8;display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:40px}
  .sig-block{margin:20px 0;display:inline-block;min-width:280px}
  .sig-line{display:block;border-bottom:1px solid #333;width:240px;margin:32px 0 4px}
  @media print{.page-break{page-break-after:always}body{font-size:10pt}}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════ COVER PAGE -->
<div class="page-break" style="min-height:100vh;display:flex;flex-direction:column">
  <!-- Header bar -->
  <div style="background:#0D2147;padding:24px 32px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-family:Arial,sans-serif;font-size:11pt;font-weight:700;color:#6BA3E8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Big Bay Administrators (Pty) Ltd</div>
      <div style="font-size:9pt;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif">Cape Town · jerome@bigbayadmin.co.za</div>
    </div>
    <div style="text-align:right;font-family:Arial,sans-serif">
      <div style="font-size:9pt;color:rgba(255,255,255,0.55)">Document Ref: ${refNo}</div>
      <div style="font-size:9pt;color:rgba(255,255,255,0.55)">Date: ${today}</div>
      <div style="font-size:9pt;color:rgba(255,255,255,0.55)">Version 1.0 — Confidential</div>
    </div>
  </div>

  <!-- Cover body -->
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px 48px;text-align:center">
    <div style="width:64px;height:4px;background:#2463AE;margin:0 auto 32px"></div>
    <div style="font-family:Arial,sans-serif;font-size:10pt;font-weight:600;color:#6BA3E8;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px">Financial Intelligence Centre Act 38 of 2001 · Section 43</div>
    <h1 style="font-size:30pt;color:#0D2147;margin-bottom:10px;line-height:1.15">Risk Management and<br>Compliance Programme</h1>
    <div style="width:64px;height:4px;background:#2463AE;margin:28px auto"></div>
    <table style="margin:0 auto;width:auto;min-width:380px;border:1px solid #e2e8f0;border-radius:4px;text-align:left">
      <tr><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;font-weight:600;color:#64748b;font-size:9.5pt;width:150px">Institution</td><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;font-weight:bold;font-size:12pt;color:#0D2147">${val(client.company)}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;font-weight:600;color:#64748b;font-size:9.5pt">FFC Number</td><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0">${val(client.ffc)}</td></tr>
      <tr><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;font-weight:600;color:#64748b;font-size:9.5pt">Contact Person</td><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0">${val(client.contact)}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;font-weight:600;color:#64748b;font-size:9.5pt">Email</td><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0">${val(client.email)}</td></tr>
      <tr><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;font-weight:600;color:#64748b;font-size:9.5pt">Phone</td><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0">${val(client.phone)}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;font-weight:600;color:#64748b;font-size:9.5pt">Prepared Date</td><td style="padding:10px 20px;border-bottom:1px solid #e2e8f0">${today}</td></tr>
      <tr><td style="padding:10px 20px;font-family:Arial,sans-serif;font-weight:600;color:#64748b;font-size:9.5pt">Document Reference</td><td style="padding:10px 20px;font-family:monospace">${refNo}</td></tr>
    </table>
    <div style="margin-top:40px;padding:14px 24px;background:#fef3c7;border:1px solid #fbbf24;border-radius:6px;font-family:Arial,sans-serif;font-size:9.5pt;color:#92400e;max-width:480px">
      ⚠ This document is <strong>confidential</strong>. It contains sensitive compliance information. Do not distribute outside your organisation without the consent of your compliance officer.
    </div>
  </div>

  <div class="page-footer">
    <span>RMCP — ${val(client.company)}</span>
    <span>Prepared by Big Bay Administrators (Pty) Ltd</span>
    <span>${today}</span>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════ TABLE OF CONTENTS -->
<div class="page-break" style="padding:32px">
  <div style="background:#0D2147;padding:14px 20px;font-family:Arial,sans-serif;font-size:14pt;font-weight:bold;color:#fff;margin:0 0 24px">Table of Contents</div>
  <table style="border:none">
    ${[
      ["Part 1","Institution Details &amp; Risk Assessment"],
      ["1.1","Business Profile"],["1.2","Risk Assessment Matrix"],
      ["Part 2","Customer Due Diligence (CDD) Framework"],
      ["2.1","Identity Verification"],["2.2","Address Verification"],["2.3","Beneficial Ownership"],["2.4","PEP Screening"],["2.5","Enhanced Due Diligence Triggers"],["2.6","Ongoing Monitoring"],
      ["Part 3","Reporting Obligations"],
      ["3.1","Suspicious Transaction Reports (STRs)"],["3.2","Cash Threshold Reports (CTRs)"],["3.3","Terrorist Property Reports (TPRs)"],["3.4","Tipping-Off Prevention"],["3.5","Internal Escalation Procedure"],
      ["Part 4","Targeted Financial Sanctions Screening"],
      ["4.1","Screening Method"],["4.2","Screening Frequency"],["4.3","Match Response Procedure"],
      ["Part 5","Record Keeping"],
      ["5.1","Record Storage System"],["5.2","Retention Period"],["5.3","Destruction Policy"],["5.4","Backup Procedures"],
      ["Part 6","Governance &amp; Oversight"],
      ["6.1","Compliance Structure"],["6.2","Staff Training"],["6.3","Board &amp; Management Oversight"],["6.4","Quality Assurance Programme"],
      ["Appendix A","Compliance Gaps Summary"],
      ["Appendix B","Signature Page &amp; Approval"],
    ].map(([ref, title], i) => {
      const isPart = ref.startsWith("Part") || ref.startsWith("App");
      return `<tr style="border:none;background:${isPart?"#f1f5f9":"#fff"}">
        <td style="border:none;padding:${isPart?"10px 12px":"6px 12px 6px 28px"};font-family:Arial,sans-serif;font-weight:${isPart?"700":"400"};color:${isPart?"#0D2147":"#374151"};font-size:${isPart?"11pt":"10.5pt"};width:120px">${ref}</td>
        <td style="border:none;padding:${isPart?"10px 12px":"6px 12px"};font-family:Arial,sans-serif;font-weight:${isPart?"700":"400"};color:${isPart?"#0D2147":"#374151"};font-size:${isPart?"11pt":"10.5pt"};border-bottom:1px solid #e2e8f0">${title}</td>
      </tr>`;
    }).join("")}
  </table>
  <div class="page-footer" style="margin-top:60px">
    <span>RMCP — ${val(client.company)}</span><span>Prepared by Big Bay Administrators (Pty) Ltd</span><span>${today}</span>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════ PART 1 -->
<div class="page-break" style="padding:32px">
  <div class="part-header">Part 1 — Institution Details &amp; Risk Assessment</div>

  <div class="section-header">1.1 Business Profile</div>
  <table>
    <thead><tr><th style="width:35%">Factor</th><th>Details</th></tr></thead>
    <tbody>
      <tr><td>Institution Name</td><td><strong>${val(client.company)}</strong></td></tr>
      <tr><td>FFC Number (PPRA)</td><td>${val(client.ffc)}</td></tr>
      <tr><td>Compliance Officer</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>Compliance Officer Contact</td><td>${val(d.compliance_officer_contact)}</td></tr>
      <tr><td>Client Types Served</td><td>${bullets(d.client_types)}</td></tr>
      <tr><td>Transaction Types</td><td>${bullets(d.transaction_types)}</td></tr>
      <tr><td>Geographic Exposure</td><td>${val(d.geographic_risk)}</td></tr>
      <tr><td>Typical Transaction Value</td><td>${val(d.value_range)}</td></tr>
    </tbody>
  </table>

  <div class="section-header">1.2 Risk Assessment Matrix</div>
  <p style="margin-bottom:10px;font-family:Arial,sans-serif;font-size:10.5pt">Risk rated using a likelihood × impact matrix in accordance with FICA s43 and the FIC's Risk-Based Approach (RBA) guidance. The institution's self-assessed risk profile is combined with transactional and geographic risk factors to produce both an inherent and residual risk rating.</p>
  <table>
    <thead><tr><th>Risk Dimension</th><th>Rating</th><th>Basis</th></tr></thead>
    <tbody>
      <tr><td><strong>Self-Assessed ML/TF Risk</strong></td><td>${riskBadge(riskLevel)}</td><td style="font-size:10pt;color:#64748b">${val(d.risk_rating)}</td></tr>
      <tr><td><strong>Inherent Risk (pre-controls)</strong></td><td>${riskBadge(riskLevel)}</td><td style="font-size:10pt;color:#64748b">Based on client types, geographic exposure, and transaction values</td></tr>
      <tr><td><strong>Residual Risk (post-controls)</strong></td><td>${riskBadge(residualRisk)}</td><td style="font-size:10pt;color:#64748b">After applying CDD, reporting, and monitoring controls documented in this RMCP</td></tr>
      <tr><td><strong>Last Formal Risk Assessment</strong></td><td colspan="2">${val(d.risk_assessment_date)}</td></tr>
    </tbody>
  </table>
  ${riskLevel === "HIGH" ? `<div class="critical"><strong>⚠ HIGH RISK INSTITUTION:</strong> Enhanced due diligence, senior management approval, and source-of-funds verification are mandatory for all new business relationships. Monthly monitoring of existing high-risk clients is required.</div>` : ""}
  ${riskLevel === "MEDIUM" ? `<div class="warning"><strong>⚠ MEDIUM RISK:</strong> Standard CDD applies to most clients. Enhanced due diligence must be applied whenever any of the EDD triggers identified in Part 2.5 are present.</div>` : ""}

  <div class="page-footer"><span>RMCP — ${val(client.company)}</span><span>Prepared by Big Bay Administrators (Pty) Ltd</span><span>${today}</span></div>
</div>

<!-- ═══════════════════════════════════════════════════════ PART 2 -->
<div class="page-break" style="padding:32px">
  <div class="part-header">Part 2 — Customer Due Diligence (CDD) Framework</div>
  <div class="info-box" style="margin-bottom:20px"><strong>Legal basis:</strong> FICA ss21–21H, as amended by the Financial Intelligence Centre Amendment Act 1 of 2017. All accountable institutions must apply a risk-based approach to CDD — the level of due diligence must match the ML/TF risk posed by each client.</div>

  <div class="section-header">2.1 Identity Verification</div>
  <p>This institution verifies client identity using the following methods:</p>
  ${bullets(d.id_verification)}
  <table style="margin-top:12px">
    <thead><tr><th>Risk Level</th><th>Identity Requirement</th><th>Timing</th></tr></thead>
    <tbody>
      <tr><td>Standard (Low/Medium)</td><td>Any of the methods listed above; documentation retained on file</td><td>Before entering business relationship</td></tr>
      <tr><td>Enhanced (High / EDD)</td><td>Above methods + senior compliance officer approval + independent database verification</td><td>Before entering business relationship; no exceptions</td></tr>
      <tr><td>Foreign Nationals</td><td>Valid passport copy + proof of address from country of origin (certified)</td><td>Before entering business relationship</td></tr>
    </tbody>
  </table>

  <div class="section-header">2.2 Address Verification</div>
  <p>This institution verifies client residential or business address using the following methods:</p>
  ${bullets(d.address_verification)}
  <div class="warning" style="margin-top:10px"><strong>Documentation requirement:</strong> All address documents must not be older than <strong>3 months</strong> at the date of verification. Expired proof of address documents are not compliant under FICA s21A.</div>

  <div class="section-header">2.3 Beneficial Ownership Identification</div>
  <p>Where a client is a company, close corporation, trust, or other legal entity, this institution identifies the beneficial owner using the following procedure:</p>
  <p style="margin-top:10px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px"><strong>Method:</strong> ${val(d.beneficial_owner)}</p>
  <div class="info-box" style="margin-top:10px"><strong>Definition (FICA s21B):</strong> A beneficial owner is the natural person who ultimately owns, controls, or benefits from a legal entity — typically any person holding ≥25% of shares, voting rights, or economic interest. Identifying the company itself is not sufficient.</div>

  <div class="section-header">2.4 Politically Exposed Persons (PEP) Screening</div>
  <p>PEP screening is performed using the following method:</p>
  <p style="margin-top:10px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px"><strong>Method:</strong> ${val(d.pep_screening)}</p>
  ${d.pep_screening === "Not yet established" ? `<div class="critical"><strong>⚠ GAP:</strong> PEP screening has not yet been established. This is a direct FICA s21B obligation. All clients must be screened for PEP status before onboarding. Contact Big Bay Administrators for an action plan.</div>` : `<div class="compliant"><strong>✓</strong> PEP screening process is in place. All PEP relationships must be escalated to senior management and subject to Enhanced Due Diligence regardless of transaction value.</div>`}

  <div class="section-header">2.5 Enhanced Due Diligence (EDD) Triggers</div>
  <p>Enhanced Due Diligence is triggered by any of the following circumstances:</p>
  ${bullets(d.enhanced_dd)}
  <table style="margin-top:12px">
    <thead><tr><th>EDD Requirement</th><th>Applicable Standard</th></tr></thead>
    <tbody>
      <tr><td>Source of funds verification</td><td>Required for all EDD clients — bank statements, payslips, or financial statements</td></tr>
      <tr><td>Source of wealth verification</td><td>Required for PEPs and high-value transactions — explain how the client acquired assets</td></tr>
      <tr><td>Senior management approval</td><td>Written approval from compliance officer or director required before proceeding</td></tr>
      <tr><td>Increased monitoring frequency</td><td>Monthly review of transaction patterns for EDD clients</td></tr>
    </tbody>
  </table>

  <div class="section-header">2.6 Ongoing Client Monitoring</div>
  <p style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px"><strong>Monitoring approach:</strong> ${val(d.ongoing_dd)}</p>
  <p style="margin-top:10px;font-size:10pt;color:#374151">Client monitoring is not a once-off exercise. CDD must be refreshed whenever there is a material change in the client's circumstances, risk profile, or when suspicion arises. Records of all monitoring activities must be retained for the minimum 5-year period.</p>

  <div class="page-footer"><span>RMCP — ${val(client.company)}</span><span>Prepared by Big Bay Administrators (Pty) Ltd</span><span>${today}</span></div>
</div>

<!-- ═══════════════════════════════════════════════════════ PART 3 -->
<div class="page-break" style="padding:32px">
  <div class="part-header">Part 3 — Reporting Obligations</div>

  <table style="margin-bottom:20px">
    <thead><tr><th>Report Type</th><th>Legal Trigger</th><th>Deadline</th><th>Method</th><th>This Institution</th></tr></thead>
    <tbody>
      <tr><td><strong>STR</strong> (Suspicious Transaction Report)</td><td>Suspicion of ML/TF/PF arises — proof not required</td><td style="color:#dc2626;font-weight:bold">Within 15 days of suspicion</td><td>FIC goAML portal</td><td>${val(d.str_process)}</td></tr>
      <tr><td><strong>CTR</strong> (Cash Threshold Report)</td><td>Cash received/paid ≥ R24,999.99 in single transaction</td><td style="color:#dc2626;font-weight:bold">Within 2 business days</td><td>FIC goAML portal</td><td>${val(d.ctr_process)}</td></tr>
      <tr><td><strong>TPR</strong> (Terrorist Property Report)</td><td>Property suspected to belong to or be used for terrorism</td><td style="color:#dc2626;font-weight:bold">Immediately</td><td>goAML + FIC email</td><td>${val(d.tpr_process)}</td></tr>
    </tbody>
  </table>

  <div class="section-header">3.1 Suspicious Transaction Reports (STRs) — FICA s29</div>
  <p><strong>Current status:</strong> ${val(d.str_process)}</p>
  ${d.str_process === "Not yet registered on goAML" ? `<div class="critical"><strong>⚠ CRITICAL GAP:</strong> Your institution is not yet registered on the FIC goAML platform. You cannot file STRs, CTRs, or TPRs without this registration. This is a criminal offence under FICA. Contact Big Bay Administrators immediately — we can complete your registration.</div>` : ""}
  <p style="margin-top:10px;font-size:10pt">The STR obligation arises from <em>suspicion</em> — not from certainty of money laundering. You must file within 15 days of the suspicion arising. Filing does not require you to refuse the transaction unless there are other grounds to do so.</p>

  <div class="section-header">3.2 Cash Threshold Reports (CTRs) — FICA s31</div>
  <p><strong>Current status:</strong> ${val(d.ctr_process)}</p>
  <p style="margin-top:8px;font-size:10pt">A CTR must be filed within <strong>2 business days</strong> after a cash transaction of R24,999.99 or more. This applies regardless of whether the transaction appears suspicious. The duty to file a CTR is independent of the STR obligation.</p>

  <div class="section-header">3.3 Terrorist Property Reports (TPRs) — FICA s28A</div>
  <p><strong>Current status:</strong> ${val(d.tpr_process)}</p>
  <p style="margin-top:8px;font-size:10pt">A TPR must be filed <strong>immediately</strong> upon knowledge or reasonable suspicion. No grace period applies. The institution must simultaneously freeze any affected funds or property.</p>

  <div class="section-header">3.4 Tipping-Off Prevention — FICA s29(2)</div>
  <p><strong>Current status:</strong> ${val(d.tipping_off)}</p>
  <div class="critical" style="margin-top:10px"><strong>⚠ CRIMINAL OFFENCE — TIPPING-OFF PROHIBITION (FICA s29(2)):</strong> No director, officer, or employee may disclose to any person — including the subject of a report — that an STR, CTR, or TPR has been or is about to be filed. This prohibition extends to implying that a report may be made. Contravention carries criminal liability including imprisonment.</div>
  <p style="margin-top:10px;font-size:10pt">Staff must be trained to avoid: discussing the filing with the subject; refusing a transaction without an innocent explanation; making comments that indicate regulatory scrutiny of the client.</p>

  <div class="section-header">3.5 Internal Escalation Procedure — FICA s43(1)(d)</div>
  <p><strong>Internal reporting procedure:</strong> ${val(d.internal_reporting)}</p>
  <table style="margin-top:10px">
    <thead><tr><th>Step</th><th>Action</th><th>Responsible Person</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>Staff member identifies suspicious activity or unusual transaction</td><td>Any staff member</td></tr>
      <tr><td>2</td><td>Staff member escalates to Compliance Officer in writing (no verbal-only reports)</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>3</td><td>Compliance Officer assesses suspicion against FICA criteria</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>4</td><td>If suspicion confirmed: file STR on goAML within 15 days; do not tip off client</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>5</td><td>Document all steps, decisions, and dates in compliance register</td><td>${val(d.compliance_officer)}</td></tr>
    </tbody>
  </table>

  <div class="page-footer"><span>RMCP — ${val(client.company)}</span><span>Prepared by Big Bay Administrators (Pty) Ltd</span><span>${today}</span></div>
</div>

<!-- ═══════════════════════════════════════════════════════ PART 4 -->
<div class="page-break" style="padding:32px">
  <div class="part-header">Part 4 — Targeted Financial Sanctions (TFS) Screening</div>
  <div class="info-box"><strong>Legal basis:</strong> FICA s26A–26C (as amended); UN Security Council resolutions binding on South Africa under the UN Charter; Financial Sanctions Regulations, 2017. Non-compliance is a criminal offence with no grace period.</div>

  <div class="section-header">4.1 Screening Method</div>
  <p><strong>Screening approach:</strong> ${val(d.sanctions_screening)}</p>
  ${d.sanctions_screening === "Not yet established" ? `<div class="critical"><strong>⚠ CRITICAL GAP:</strong> Sanctions screening has not been established. South African property practitioners must screen all clients against both the UN Consolidated Sanctions List and the SA Targeted Financial Sanctions list before any business relationship. Failure to do so is a criminal offence.</div>` : ""}
  <p style="margin-top:10px;font-size:10pt">Both the <strong>UN Consolidated Sanctions List</strong> and the <strong>FIC's South African Targeted Financial Sanctions list</strong> must be checked. Free access is available at: <em>fic.gov.za</em> and <em>un.org/securitycouncil/sanctions</em>.</p>

  <div class="section-header">4.2 Screening Frequency</div>
  <p><strong>Frequency:</strong> ${val(d.screening_frequency)}</p>
  <p style="font-size:10pt;margin-top:8px">Screening only at onboarding is insufficient. Clients can be added to sanctions lists after the business relationship commences. Periodic screening of all active clients is required to detect late additions to sanctions lists.</p>

  <div class="section-header">4.3 Match Response Procedure</div>
  <p><strong>Match protocol:</strong> ${val(d.match_process)}</p>
  <table style="margin-top:10px">
    <thead><tr><th>Step</th><th>Required Action</th><th>Timeframe</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>Immediately freeze all assets and transactions relating to the matched person</td><td>Immediately upon match</td></tr>
      <tr><td>2</td><td>Do not proceed with any transaction or business activity</td><td>Immediately upon match</td></tr>
      <tr><td>3</td><td>Escalate to Compliance Officer and senior management</td><td>Within 1 hour</td></tr>
      <tr><td>4</td><td>File Terrorist Property Report (TPR) with FIC via goAML</td><td>Within 2 hours</td></tr>
      <tr><td>5</td><td>Do not disclose to the subject that a report has been filed (tipping-off prohibition)</td><td>Ongoing</td></tr>
      <tr><td>6</td><td>Document all actions, times, and decisions in the compliance register</td><td>Same day</td></tr>
    </tbody>
  </table>

  <div class="page-footer"><span>RMCP — ${val(client.company)}</span><span>Prepared by Big Bay Administrators (Pty) Ltd</span><span>${today}</span></div>
</div>

<!-- ═══════════════════════════════════════════════════════ PART 5 -->
<div class="page-break" style="padding:32px">
  <div class="part-header">Part 5 — Record Keeping</div>
  <div class="info-box"><strong>Legal basis:</strong> FICA ss22–23. All records must be retained for a minimum of 5 years from the date of the transaction or the end of the business relationship, whichever is the later. The FIC may request access to records at any time.</div>

  <div class="section-header">5.1 Record Storage System</div>
  <p><strong>Storage method:</strong> ${val(d.record_system)}</p>
  ${d.record_system === "Paper-based filing only" ? `<div class="warning"><strong>⚠ RISK:</strong> Paper-only storage carries significant risks: fire, flood, theft, and deterioration. The FIC expects records to be retrievable on request. Consider digitising your compliance records — Big Bay Administrators can assist.</div>` : ""}

  <div class="section-header">5.2 Retention Period</div>
  <p><strong>Policy:</strong> ${val(d.retention_period)}</p>
  ${d.retention_period === "Not yet specified" ? `<div class="critical"><strong>⚠ GAP:</strong> A formal record retention period has not been specified. FICA s22 requires a minimum of 5 years. Without a documented policy, you cannot demonstrate compliance during an FIC inspection.</div>` : `<div class="compliant"><strong>✓</strong> Records are retained for ${val(d.retention_period)} — meeting the FICA minimum requirement of 5 years.</div>`}
  <p style="margin-top:10px;font-size:10pt">The retention period runs from the later of: (a) the date of the transaction; or (b) the date on which the business relationship ended.</p>

  <div class="section-header">5.3 Destruction Policy</div>
  <p><strong>Policy:</strong> ${val(d.destruction_policy)}</p>
  ${d.destruction_policy === "Not yet established" ? `<div class="warning"><strong>⚠ GAP:</strong> A formal destruction policy does not yet exist. Records must be securely destroyed after the retention period — not simply deleted or discarded. A documented destruction log is required.</div>` : ""}
  <p style="font-size:10pt;margin-top:8px">After the retention period expires, records must be formally and securely destroyed with management sign-off and a written audit trail of the destruction event.</p>

  <div class="section-header">5.4 Backup Procedures</div>
  <p><strong>Backup method:</strong> ${val(d.backup_process)}</p>
  ${d.backup_process === "No backup process in place" ? `<div class="critical"><strong>⚠ GAP:</strong> No backup process is in place. Records destroyed by hardware failure, ransomware, fire, or theft cannot be recovered — and their loss is itself a FICA breach. Implement automated backups immediately.</div>` : `<div class="compliant"><strong>✓</strong> Backup procedure in place: ${val(d.backup_process)}. Test restore functionality quarterly to confirm backups are viable.</div>`}

  <p style="margin-top:20px;font-size:10pt;color:#374151"><strong>Records that must be retained include:</strong> Client CDD documents (ID, proof of address), beneficial ownership documentation, PEP screening records, all STR/CTR/TPR filings and related correspondence, ongoing monitoring records, training attendance registers, and this RMCP document itself.</p>

  <div class="page-footer"><span>RMCP — ${val(client.company)}</span><span>Prepared by Big Bay Administrators (Pty) Ltd</span><span>${today}</span></div>
</div>

<!-- ═══════════════════════════════════════════════════════ PART 6 -->
<div class="page-break" style="padding:32px">
  <div class="part-header">Part 6 — Governance &amp; Oversight</div>

  <div class="section-header">6.1 Compliance Structure</div>
  <table>
    <thead><tr><th style="width:35%">Role / Element</th><th>Details</th></tr></thead>
    <tbody>
      <tr><td><strong>Designated Compliance Officer</strong></td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td><strong>Compliance Officer Contact</strong></td><td>${val(d.compliance_officer_contact)}</td></tr>
      <tr><td><strong>Date RMCP Approved by Management</strong></td><td>${val(d.board_approval_date)}</td></tr>
      <tr><td><strong>Review Frequency</strong></td><td>${val(d.review_frequency)}</td></tr>
      <tr><td><strong>Last Review Date</strong></td><td>${val(d.last_review_date)}</td></tr>
      <tr><td><strong>Last Formal Risk Assessment</strong></td><td>${val(d.risk_assessment_date)}</td></tr>
    </tbody>
  </table>
  ${!d.board_approval_date ? `<div class="critical"><strong>⚠ GAP:</strong> This RMCP has not yet been formally approved by management. FICA s43(1)(b) requires board or senior management approval. An unsigned, unapproved RMCP provides no legal protection.</div>` : `<div class="compliant"><strong>✓</strong> RMCP approved by management on ${d.board_approval_date}.</div>`}

  <div class="section-header">6.2 Staff Training — FICA s43(1)(c)</div>
  <p><strong>Training approach:</strong> ${val(d.training_policy)}</p>
  ${d.training_policy === "Not yet established" ? `<div class="critical"><strong>⚠ CRITICAL GAP:</strong> No AML/CFT training programme is in place. FICA s43(1)(c) requires all relevant staff to be trained. Untrained staff represent the most common FIC inspection finding and are a direct source of ML/TF risk.</div>` : `<div class="compliant"><strong>✓</strong> Training programme in place: ${val(d.training_policy)}. All staff must complete training; maintain a signed attendance register as evidence for FIC inspections.</div>`}
  <table style="margin-top:12px">
    <thead><tr><th>Training Requirement</th><th>FICA Basis</th><th>Frequency</th></tr></thead>
    <tbody>
      <tr><td>AML/CFT awareness training</td><td>s43(1)(c)</td><td>At induction + annually</td></tr>
      <tr><td>Red flag identification</td><td>s43(1)(c)</td><td>Annually</td></tr>
      <tr><td>STR/CTR/TPR filing procedures</td><td>s29, s31</td><td>Annually</td></tr>
      <tr><td>Tipping-off prohibition</td><td>s29(2)</td><td>At induction + annually</td></tr>
      <tr><td>PEP and sanctions screening</td><td>s21B, s26A</td><td>Annually</td></tr>
    </tbody>
  </table>

  <div class="section-header">6.3 Board &amp; Management Oversight</div>
  <p style="font-size:10pt">Senior management must demonstrate active oversight of the compliance programme. This includes:</p>
  <ul style="font-size:10.5pt">
    <li>Receiving and reviewing regular compliance reports from the Compliance Officer</li>
    <li>Approving and signing off this RMCP and any amendments</li>
    <li>Allocating adequate resources (budget, time, personnel) to compliance activities</li>
    <li>Ensuring a culture of compliance is embedded at all levels of the organisation</li>
    <li>Responding timeously to FIC queries, inspections, and directives</li>
  </ul>

  <div class="section-header">6.4 Quality Assurance Programme</div>
  <table>
    <thead><tr><th>Activity</th><th>Frequency</th><th>Responsible</th></tr></thead>
    <tbody>
      <tr><td>CDD file audits (sample 10% of files or minimum 5)</td><td>Quarterly</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>Full RMCP review and update</td><td>${val(d.review_frequency)}</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>Risk Control Return (RCR) submission to FIC — Directive 6</td><td>Annually by 30 September</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>Employee screening — Directive 8</td><td>At onboarding + periodically</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>goAML system access review</td><td>Annually</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>Training register update and gap analysis</td><td>Annually</td><td>${val(d.compliance_officer)}</td></tr>
      <tr><td>Sanctions list update check</td><td>Monthly minimum</td><td>${val(d.compliance_officer)}</td></tr>
    </tbody>
  </table>
  <div class="warning" style="margin-top:20px"><strong>CRITICAL — Documentation ≠ Compliance:</strong> Having a written RMCP is the minimum legal requirement — not the goal. All controls must be actively implemented, tested, and evidenced. An FIC inspection will examine whether your written procedures match your actual day-to-day operations.</div>

  <div class="page-footer"><span>RMCP — ${val(client.company)}</span><span>Prepared by Big Bay Administrators (Pty) Ltd</span><span>${today}</span></div>
</div>

<!-- ═══════════════════════════════════════════════════════ APPENDIX A: GAPS -->
<div class="page-break" style="padding:32px">
  <div class="part-header">Appendix A — Compliance Gaps Summary</div>
  <p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:16px">The following compliance gaps were identified at the time of this assessment based on your responses. Each gap represents a control that has not yet been established or is insufficient for FICA compliance. Big Bay Administrators can assist with action plans to close each gap.</p>
  ${gapsList}
  ${flags.length > 0 ? `<div class="warning" style="margin-top:20px"><strong>Next step:</strong> Contact Big Bay Administrators at jerome@bigbayadmin.co.za to receive costed action plans for each gap listed above, including timelines, responsible parties, and cost estimates.</div>` : ""}
  <div class="page-footer"><span>RMCP — ${val(client.company)}</span><span>Prepared by Big Bay Administrators (Pty) Ltd</span><span>${today}</span></div>
</div>

<!-- ═══════════════════════════════════════════════════════ APPENDIX B: SIGNATURES -->
<div style="padding:32px">
  <div class="part-header">Appendix B — Approval &amp; Signature Page</div>
  <p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px">This Risk Management and Compliance Programme has been reviewed and formally approved by the authorised representatives of <strong>${val(client.company)}</strong>. By signing below, the signatories confirm that:</p>
  <ul style="font-size:10.5pt;margin-bottom:24px">
    <li>They have read and understood the contents of this RMCP</li>
    <li>The RMCP accurately reflects the institution's current compliance controls and procedures</li>
    <li>They commit to implementing and maintaining all controls described herein</li>
    <li>This RMCP will be reviewed at least ${val(d.review_frequency, "annually").toLowerCase()} and updated whenever material changes occur</li>
  </ul>

  <table style="border:none;margin:30px 0">
    <tr style="border:none">
      <td style="border:none;padding:0 40px 0 0;vertical-align:top">
        <div class="sig-block">
          <strong style="font-size:11pt;font-family:Arial,sans-serif">Board / Senior Management</strong><br>
          <span class="sig-line"></span>
          <div style="font-family:Arial,sans-serif;font-size:9.5pt;color:#374151">Name: ___________________________</div>
          <div style="font-family:Arial,sans-serif;font-size:9.5pt;color:#374151;margin-top:6px">Designation: ___________________________</div>
          <div style="font-family:Arial,sans-serif;font-size:9.5pt;color:#374151;margin-top:6px">Date: ___________________________</div>
        </div>
      </td>
      <td style="border:none;padding:0;vertical-align:top">
        <div class="sig-block">
          <strong style="font-size:11pt;font-family:Arial,sans-serif">Compliance Officer</strong><br>
          <span class="sig-line"></span>
          <div style="font-family:Arial,sans-serif;font-size:9.5pt;color:#374151">Name: <strong>${val(d.compliance_officer)}</strong></div>
          <div style="font-family:Arial,sans-serif;font-size:9.5pt;color:#374151;margin-top:6px">Contact: ${val(d.compliance_officer_contact)}</div>
          <div style="font-family:Arial,sans-serif;font-size:9.5pt;color:#374151;margin-top:6px">Date: ___________________________</div>
        </div>
      </td>
    </tr>
  </table>

  <div style="background:#0D2147;padding:20px 24px;border-radius:6px;margin-top:30px">
    <div style="font-family:Arial,sans-serif;font-size:10pt;font-weight:700;color:#6BA3E8;margin-bottom:4px">Prepared by Big Bay Administrators (Pty) Ltd</div>
    <div style="font-family:Arial,sans-serif;font-size:9.5pt;color:rgba(255,255,255,0.6)">Big Bay, Blouberg, Cape Town, Western Cape &nbsp;|&nbsp; jerome@bigbayadmin.co.za &nbsp;|&nbsp; Document Ref: ${refNo}</div>
  </div>

  <div style="margin-top:28px;padding:14px 18px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;font-family:Arial,sans-serif;font-size:9pt;color:#6c757d;line-height:1.6">
    <strong>DISCLAIMER:</strong> This Risk Management and Compliance Programme was prepared by Big Bay Administrators (Pty) Ltd based solely on information provided by the client through the RMCPPro assessment tool. It constitutes a template compliance document and does not constitute legal advice. The accuracy and completeness of this document depend entirely on the accuracy of the information supplied by the client. Big Bay Administrators makes no representation or warranty that this document will satisfy all regulatory requirements applicable to the client's specific circumstances. The client remains solely responsible for implementing the controls described herein and for compliance with all applicable legislation including FICA 38 of 2001. Independent legal or compliance advice is recommended. Big Bay Administrators (Pty) Ltd shall not be liable for any regulatory penalties, fines, sanctions, or losses arising from reliance on this document. Governed by the laws of the Republic of South Africa.
  </div>

  <div class="page-footer"><span>RMCP — ${val(client.company)} &nbsp;|&nbsp; Ref: ${refNo}</span><span>Prepared by Big Bay Administrators (Pty) Ltd</span><span>${today}</span></div>
</div>

</body></html>`;
      return html;
    };

    return (
      <>
      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: FONT_BODY, padding: "20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: "12px", padding: "24px" }}>
          <button onClick={() => setView("admin")} style={{ marginBottom: "20px", padding: "12px 16px", minHeight: "44px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>← Back to List</button>
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
            <button onClick={() => setProposal(generateProposal(client))}
              style={{ padding: "12px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #6BA3E8, #2463AE)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>📋 Generate Service Proposal</button>
            <button onClick={() => { const html = generateDoc(); const blob = new Blob([html], { type: "text/html" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `RMCP_${client.company.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.html`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }}
              style={{ padding: "12px", borderRadius: "8px", border: "none", background: "#2463AE", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>📄 Download RMCP Document</button>
            <button onClick={async () => { const btn = event.target; btn.textContent = "⏳ Sending..."; btn.disabled = true; try { const html = generateDoc(); const r = await fetch("https://rmcp-pro.vercel.app/api/send-rmcp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientEmail: client.email, clientName: client.company, rmcpHtml: html, coverLetter: `Dear ${client.contact},\n\nPlease find attached your RMCP document.\n\nBest regards,\nBig Bay Administrators` }) }); const res = await r.json(); if (r.ok) { alert("✅ Email sent to " + client.email); } else { alert("Error: " + (res.error || "Failed")); } } catch (e) { alert("Error: " + e.message); } finally { btn.textContent = "📧 Email to Client"; btn.disabled = false; } }}
              style={{ padding: "12px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>📧 Email to Client</button>
          </div>
        </div>
      </div>
      {proposal && <ProposalModal proposal={proposal} onClose={() => setProposal(null)} />}
      </>
    );
  }

  return null;
}
