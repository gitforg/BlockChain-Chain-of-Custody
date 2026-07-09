export type PortalRoute = {
  href: string;
  label: string;
  summary: string;
};

export const portalRoutes: PortalRoute[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    summary: "System dashboard and overview metrics",
  },
  {
    href: "/register-evidence",
    label: "Register Evidence",
    summary: "Digital intake form for new items",
  },
  {
    href: "/evidence",
    label: "Evidence Records",
    summary: "Complete directory of case files",
  },
  {
    href: "/chain-of-custody",
    label: "Chain of Custody",
    summary: "Secure vertical timeline audit trail",
  },
  {
    href: "/transfer-custody",
    label: "Transfer Evidence",
    summary: "Initiate custody handoff to another custodian",
  },
  {
    href: "/verification",
    label: "Verification",
    summary: "Cryptographic hash integrity check",
  },
  {
    href: "/audit-report",
    label: "Audit Logs",
    summary: "Immutable event stream export",
  },
  {
    href: "/reports",
    label: "Reports",
    summary: "Visual analytics and operations trends",
  },
  {
    href: "/settings",
    label: "Settings",
    summary: "DApp and blockchain configuration",
  },
];

export const dashboardMetrics = [
  { label: "Total Evidence", value: "312", delta: "+12 this week", icon: "Evidence" },
  { label: "Evidence In Transit", value: "14", delta: "2 pending approval", icon: "Transit" },
  { label: "Evidence In Laboratory", value: "48", delta: "5 analysts active", icon: "Lab" },
  { label: "Evidence In Court", value: "26", delta: "3 active hearings", icon: "Court" },
  { label: "Disposed Evidence", value: "224", delta: "12 archived this month", icon: "Disposed" },
  { label: "Pending Transfers", value: "5", delta: "Awaiting signatures", icon: "Pending" },
  { label: "Verified Hashes", value: "100%", delta: "0 integrity alerts", icon: "Verified" },
  { label: "Blockchain Transactions", value: "1,204", delta: "Gas: 24 Gwei avg", icon: "Blockchain" },
];

export const recentEvidence = [
  {
    id: "EV-2026-0048",
    caseId: "CASE-2026-041",
    type: "Digital Drive (Laptop Seizure)",
    custodian: "Officer Robert Vance",
    status: "InLab", // Registered, InTransit, InLab, InCourt, Disposed
    updatedAt: "2026-07-07 11:24 UTC",
    txHash: "0x7c2b9f6d2a4e8b1c9f0d3e5a1b8f4c2d7e9a6f0b1c4d8e2f6a9b3c7d1e5f2a4b",
    classification: "Restricted",
    notes: "Redacted email log dump from the corporate network server.",
    ipfsCid: "QmXoypizjW3WknFixtdKLwugnSm91hGLZT6FL5WfvH9Z4y",
  },
  {
    id: "EV-2026-0031",
    caseId: "CASE-2026-039",
    type: "Access Control Badge",
    custodian: "Analyst Sarah Croft",
    status: "InTransit",
    updatedAt: "2026-07-06 17:41 UTC",
    txHash: "0x9a4d3f11bc2d0a8f2c713b7e4f3a1e2b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
    classification: "Confidential",
    notes: "Retrieved from warehouse dock entrance. Fingerprint traces match suspect.",
    ipfsCid: "QmYwAPJ51QzH2MGDX4kF68S4y88t8e4a9hGLZT6FL5Wfvi",
  },
  {
    id: "EV-2026-0016",
    caseId: "CASE-2026-012",
    type: "Bodycam Video Bundle (MP4)",
    custodian: "Court Clerk James Lee",
    status: "InCourt",
    updatedAt: "2026-07-05 13:12 UTC",
    txHash: "0x4f337ab19a4d8f2c71bc2d0a7f82ab12cd34ef56gh78ij90kl12mn34op56qr78",
    classification: "Restricted",
    notes: "Full recording of warehouse sweep operation on June 15.",
    ipfsCid: "QmZ3K4Q5wE6rT7y8u9i0oP1a2s3d4f5g6h7j8k9l0zXyCv",
  },
  {
    id: "EV-2026-0005",
    caseId: "CASE-2026-008",
    type: "Physical Document Ledger",
    custodian: "System Administrator",
    status: "Disposed",
    updatedAt: "2026-07-01 09:05 UTC",
    txHash: "0x3f3b7e4f3a1e2b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c",
    classification: "Confidential",
    notes: "Archived sales receipt journal. Destroyed per retention mandate.",
    ipfsCid: "QmR4e5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l0zXyCvB3n2",
  },
  {
    id: "EV-2026-0099",
    caseId: "CASE-2026-099",
    type: "Mobile Phone (iPhone 13)",
    custodian: "Officer Robert Vance",
    status: "Registered",
    updatedAt: "2026-07-07 13:50 UTC",
    txHash: "0x55db2f7f82ab12cd34ef56gh78ij90kl12mn34op56qr78as90df12gh34jk56lm",
    classification: "Restricted",
    notes: "Suspect cell phone retrieved during vehicle inspection.",
    ipfsCid: "QmS3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e",
  }
];

export const custodyTimeline = [
  {
    actor: "Officer Robert Vance",
    department: "Intake Division",
    action: "Registered Evidence Item EV-2026-0048",
    time: "2026-07-07 08:12 UTC",
    hash: "0x55db2f...e8c1",
    confirmation: "Confirmed Block #18920311",
    status: "Registered",
    note: "Initial registration. Cryptographic SHA-256 fingerprint written to registry smart contract.",
  },
  {
    actor: "Officer Robert Vance",
    department: "Intake Division",
    action: "Dispatched package to Forensic Division",
    time: "2026-07-07 09:40 UTC",
    hash: "0x9a4d3f...2d0a",
    confirmation: "Confirmed Block #18920412",
    status: "InTransit",
    note: "Secure courier dispatch, sealed lock box ID #SB-9011.",
  },
  {
    actor: "Analyst Sarah Croft",
    department: "Forensic Laboratory",
    action: "Accepted Custody Handoff & Logged Intake",
    time: "2026-07-07 11:24 UTC",
    hash: "0x7c2b9f...2a4b",
    confirmation: "Confirmed Block #18920655",
    status: "InLab",
    note: "Seals verified intact. Drive cloned for analysis. Status set to Laboratory Review.",
  },
];

export const transferRecipients = [
  {
    name: "Dr. Maya Chen",
    role: "Forensic Reviewer",
    wallet: "0x7B2C7901A670F6d9C9E18aB4E3278912E6B4F3A5",
    department: "Forensic Laboratory",
  },
  {
    name: "Clerk James Lee",
    role: "Court Clerk",
    wallet: "0x9C184b23f567D8912cE7812903Ab4C9E3219034E",
    department: "Superior Court",
  },
  {
    name: "Agent Arthur Dent",
    role: "Compliance Inspector",
    wallet: "0x4E1192931a5D6e78923bc4E2019ab7CD304859a0",
    department: "Federal Compliance Board",
  },
  {
    name: "Archive Vault (Contract)",
    role: "Cold Storage Ledger",
    wallet: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    department: "Records Management",
  },
];

export const auditLogs = [
  {
    time: "2026-07-07 13:50:11 UTC",
    actor: "Officer Robert Vance",
    action: "Register Evidence",
    status: "Success",
    evidenceId: "EV-2026-0099",
    txHash: "0x55db2f7f82ab12cd34ef56gh78ij90kl12mn34op56qr78as90df12gh34jk56lm",
    detail: "EV-2026-0099 registered to CASE-2026-099 with file hash 0x55db...e8c1.",
  },
  {
    time: "2026-07-07 11:24:55 UTC",
    actor: "Analyst Sarah Croft",
    action: "Accept Custody Handoff",
    status: "Success",
    evidenceId: "EV-2026-0048",
    txHash: "0x7c2b9f6d2a4e8b1c9f0d3e5a1b8f4c2d7e9a6f0b1c4d8e2f6a9b3c7d1e5f2a4b",
    detail: "Handoff complete. Status updated to InLab.",
  },
  {
    time: "2026-07-07 09:40:02 UTC",
    actor: "Officer Robert Vance",
    action: "Transfer Custody",
    status: "Success",
    evidenceId: "EV-2026-0048",
    txHash: "0x9a4d3f11bc2d0a8f2c713b7e4f3a1e2b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
    detail: "Dispatched to Forensic Laboratory. Package in transit status logged.",
  },
  {
    time: "2026-07-06 17:41:22 UTC",
    actor: "Analyst Sarah Croft",
    action: "Verify Hash",
    status: "Success",
    evidenceId: "EV-2026-0031",
    txHash: "0x9a4d3f11bc2d0a8f2c713b7e4f3a1e2b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
    detail: "SHA-256 matched the registry database (Matched: QmYwAPJ...Fvi).",
  },
  {
    time: "2026-07-05 13:12:08 UTC",
    actor: "Clerk James Lee",
    action: "Update Status",
    status: "Success",
    evidenceId: "EV-2026-0016",
    txHash: "0x4f337ab19a4d8f2c71bc2d0a7f82ab12cd34ef56gh78ij90kl12mn34op56qr78",
    detail: "Status set to InCourt for case CASE-2026-012.",
  },
  {
    time: "2026-07-01 09:05:44 UTC",
    actor: "System Administrator",
    action: "Evidence Disposal",
    status: "Success",
    evidenceId: "EV-2026-0005",
    txHash: "0x3f3b7e4f3a1e2b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c",
    detail: "Incinerated per disposal guidelines. Signature verified.",
  },
];