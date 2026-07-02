export type PortalRoute = {
  href: string;
  label: string;
  summary: string;
};

export const portalRoutes: PortalRoute[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    summary: "Operational metrics and recent evidence",
  },
  {
    href: "/register-evidence",
    label: "Register Evidence",
    summary: "Multi-step intake with file upload",
  },
  {
    href: "/evidence/EV-2048",
    label: "Evidence Detail",
    summary: "Timeline, hash verifier, and QR preview",
  },
  {
    href: "/transfer-custody",
    label: "Transfer Custody",
    summary: "Recipient selection and transaction signing",
  },
  {
    href: "/audit-report",
    label: "Audit Report",
    summary: "Filterable event log export",
  },
];

export const dashboardMetrics = [
  { label: "Evidence items", value: "248", delta: "+18 this week" },
  { label: "Active custodians", value: "14", delta: "3 pending approval" },
  { label: "Verified transfers", value: "91%", delta: "Across 30 days" },
  { label: "Audit exports", value: "27", delta: "Generated this month" },
];

export const recentEvidence = [
  {
    id: "EV-2048",
    title: "Laptop seizure package",
    status: "Verified",
    owner: "Forensics Lab",
    hash: "0x9a4d...8f2c",
    updatedAt: "Today, 09:14",
  },
  {
    id: "EV-2031",
    title: "Warehouse access badge",
    status: "Transferred",
    owner: "Security Ops",
    hash: "0x71bc...2d0a",
    updatedAt: "Yesterday, 17:41",
  },
  {
    id: "EV-2016",
    title: "Bodycam capture bundle",
    status: "Pending review",
    owner: "Shift 4",
    hash: "0x4f33...7ab1",
    updatedAt: "Mon, 18:22",
  },
];

export const custodyTimeline = [
  {
    actor: "Intake Officer",
    action: "Registered evidence",
    time: "2026-06-29 08:12 UTC",
    note: "SHA-256 fingerprint stored on-chain and metadata locked",
  },
  {
    actor: "Evidence Custodian",
    action: "Transferred to lab",
    time: "2026-06-30 10:54 UTC",
    note: "Recipient wallet verified and approval threshold met",
  },
  {
    actor: "QA Reviewer",
    action: "Validated integrity",
    time: "2026-07-01 13:26 UTC",
    note: "Hash matched original intake record",
  },
  {
    actor: "Compliance Team",
    action: "Prepared final audit note",
    time: "2026-07-02 07:05 UTC",
    note: "Ready for archival export",
  },
];

export const transferRecipients = [
  {
    name: "Dr. Maya Chen",
    role: "Forensic Reviewer",
    wallet: "0x7B2C...1F90",
  },
  {
    name: "A. Patel",
    role: "Compliance Lead",
    wallet: "0x9C18...3A4E",
  },
  {
    name: "Evidence Vault",
    role: "Cold storage contract",
    wallet: "0x4E11...B7CD",
  },
];

export const auditLogs = [
  {
    time: "09:14",
    actor: "Intake Officer",
    action: "Register evidence",
    status: "Success",
    detail: "EV-2048 registered with file hash 0x9a4d...8f2c",
  },
  {
    time: "10:54",
    actor: "Custodian Bot",
    action: "Transfer custody",
    status: "Success",
    detail: "Approval collected from two signers and transaction mined",
  },
  {
    time: "12:12",
    actor: "Auditor",
    action: "Verify hash",
    status: "Flagged",
    detail: "One record requires re-check after metadata update",
  },
  {
    time: "13:40",
    actor: "Compliance Lead",
    action: "Export report",
    status: "Success",
    detail: "CSV and PDF audit package generated",
  },
];