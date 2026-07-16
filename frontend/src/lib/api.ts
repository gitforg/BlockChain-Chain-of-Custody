import { auth } from "@/firebase/firebase";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
const API_BASE_URL =
  typeof window === "undefined"
    ? configuredApiUrl
    : /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredApiUrl)
      ? ""
      : configuredApiUrl;

type EvidenceListResponse = {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type StatsResponse = {
  metrics: any[];
  distribution: {
    total: number;
    inLab: number;
    inTransit: number;
    inCourt: number;
    disposed: number;
  };
};

const EMPTY_STATS: StatsResponse = {
  metrics: [],
  distribution: {
    total: 0,
    inLab: 0,
    inTransit: 0,
    inCourt: 0,
    disposed: 0,
  },
};

const EMPTY_EVIDENCE_LIST: EvidenceListResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 100,
  totalPages: 0,
};

function warnAndReturnFallback(endpoint: string, error: unknown, fallback: any) {
  console.warn(`[api] ${endpoint} unavailable, using local fallback.`, error);
  return fallback;
}

async function fetchJsonWithFallback<T>(url: string, endpoint: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return warnAndReturnFallback(endpoint, new Error(`HTTP ${response.status}`), fallback);
    }

    return response.json();
  } catch (error) {
    return warnAndReturnFallback(endpoint, error, fallback);
  }
}

/**
 * Gets the current authenticated user's email.
 */
function getUserEmail(): string {
  return auth.currentUser?.email || "officer@evidencechain.com";
}

/**
 * Returns common request headers, including user identity.
 */
function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const email = getUserEmail();
  return {
    "x-user-email": email,
    ...extraHeaders,
  };
}

export type FetchEvidenceParams = {
  search?: string;
  status?: string;
  classification?: string;
  custodian?: string;
  caseId?: string;
  department?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

export async function fetchStats() {
  return fetchJsonWithFallback(`${API_BASE_URL}/api/stats`, "GET /api/stats", EMPTY_STATS);
}

export async function fetchEvidenceList(params: FetchEvidenceParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      query.append(key, val.toString());
    }
  });

  return fetchJsonWithFallback(
    `${API_BASE_URL}/api/evidence?${query.toString()}`,
    "GET /api/evidence",
    { ...EMPTY_EVIDENCE_LIST, limit: params.limit ?? EMPTY_EVIDENCE_LIST.limit },
  );
}

export async function fetchEvidenceById(id: string) {
  return fetchJsonWithFallback(`${API_BASE_URL}/api/evidence/${id}`, `GET /api/evidence/${id}`, null);
}

export async function registerEvidence(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/api/evidence`, {
    method: "POST",
    headers: getHeaders(),
    body: formData, // FormData contains file and other metadata fields. Content-Type is set automatically.
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to register evidence record");
  }
  return response.json();
}

export type TransferPayload = {
  newCustodian: string;
  department: string;
  reason: string;
  action: string;
};

export async function transferEvidence(id: string, payload: TransferPayload) {
  const response = await fetch(`${API_BASE_URL}/api/evidence/${id}/transfer`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to execute custody transfer");
  }
  return response.json();
}

export async function verifyEvidenceFile(file: File, expectedEvidenceId?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (expectedEvidenceId) {
    formData.append("expectedEvidenceId", expectedEvidenceId);
  }

  const response = await fetch(`${API_BASE_URL}/api/evidence/verify`, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Failed to verify evidence file");
  }
  return response.json();
}

export async function disposeEvidence(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/evidence/${id}/dispose`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to dispose of evidence");
  }
  return response.json();
}

export async function destroyEvidence(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/evidence/${id}/destroy`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to destroy evidence record");
  }
  return response.json();
}

export type FetchAuditParams = {
  actor?: string;
  action?: string;
  status?: string;
  evidenceId?: string;
};

export async function fetchAuditLogs(params: FetchAuditParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      query.append(key, val.toString());
    }
  });

  return fetchJsonWithFallback(`${API_BASE_URL}/api/audit-logs?${query.toString()}`, "GET /api/audit-logs", []);
}
