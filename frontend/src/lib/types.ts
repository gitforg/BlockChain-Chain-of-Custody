/**
 * Domain types shared across the forensic console.
 *
 * These mirror the Prisma models in backend/prisma/schema.prisma. Keep them in
 * sync when the schema changes.
 */

export type EvidenceStatus = "Registered" | "InTransit" | "InLab" | "InCourt" | "Disposed";

export type Classification = "Restricted" | "Confidential" | "Public";

export interface CustodyEvent {
  id: number;
  evidenceId: string;
  actor: string;
  department: string;
  action: string;
  time: string;
  hash: string;
  confirmation: string;
  status: string;
  note: string;
  txHash: string;
}

export interface EvidenceRecord {
  id: string;
  title: string;
  caseId: string;
  type: string;
  classification: Classification | string;
  notes: string;
  custodian: string;
  status: EvidenceStatus | string;
  location: string;
  department: string;
  fileHash: string;
  ipfsCid: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  creatorWallet: string;
  currentCustodianWallet: string;
  txHash: string;
  blockNumber: number | null;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  custodyEvents?: CustodyEvent[];
}

export interface AuditLogEntry {
  id: number;
  time: string;
  actor: string;
  action: string;
  status: string;
  evidenceId: string;
  txHash: string;
  previousWallet: string;
  newWallet: string;
  blockNumber: number | null;
  detail: string;
  ipAddress: string;
}

export interface StatsDistribution {
  total: number;
  inLab: number;
  inTransit: number;
  inCourt: number;
  disposed: number;
}

export interface StatsMetric {
  label: string;
  value: string;
  delta: string;
  icon: string;
}

export interface StatsResponse {
  metrics: StatsMetric[];
  distribution: StatsDistribution;
}

export interface EvidenceListResponse {
  items: EvidenceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Severity channel that drives every status colour in the console. */
export type StatusTone = "verified" | "pending" | "alert" | "muted" | "info";

export const STATUS_TONE: Record<string, StatusTone> = {
  Registered: "info",
  InTransit: "pending",
  InLab: "verified",
  InCourt: "info",
  Disposed: "muted",
};

/** Short monospaced codes used in table cells and badges. */
export const STATUS_CODE: Record<string, string> = {
  Registered: "REG",
  InTransit: "TRN",
  InLab: "LAB",
  InCourt: "CRT",
  Disposed: "DSP",
};

export const STATUS_LABEL: Record<string, string> = {
  Registered: "Registered",
  InTransit: "In Transit",
  InLab: "In Laboratory",
  InCourt: "In Court",
  Disposed: "Disposed",
};
