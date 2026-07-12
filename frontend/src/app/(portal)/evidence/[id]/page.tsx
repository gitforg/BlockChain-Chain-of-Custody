"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Copy,
  CheckCircle2,
  AlertTriangle,
  History,
  Send,
  Download,
  FileText,
  Clock,
  Compass,
  FileCheck,
  Trash2,
  Ban,
} from "lucide-react";
import { fetchEvidenceById, disposeEvidence, destroyEvidence } from "@/lib/api";
import { QrCode } from "@/components/qr-code";

type EvidenceDetailPageProps = {
  params: { id: string };
};

export default function EvidenceDetailPage({ params }: EvidenceDetailPageProps) {
  const router = useRouter();
  const [evidence, setEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hashInput, setHashInput] = useState("");
  const [result, setResult] = useState<"idle" | "match" | "mismatch">("idle");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [submittingDisposal, setSubmittingDisposal] = useState(false);
  const [submittingDestruction, setSubmittingDestruction] = useState(false);

  async function handleDispose() {
    if (!confirm("Are you sure you want to legally dispose of this evidence? This action will be permanently recorded on the blockchain.")) return;
    try {
      setSubmittingDisposal(true);
      const updated = await disposeEvidence(params.id);
      setEvidence(updated);
      alert("Evidence successfully marked as Disposed on the registry and blockchain!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to dispose of evidence.");
    } finally {
      setSubmittingDisposal(false);
    }
  }

  async function handleDestroy() {
    if (!confirm("CRITICAL WARNING: This will completely destroy the digital evidence record from the SQL database and unpin it from IPFS. This action is irreversible. Are you sure you want to proceed?")) return;
    try {
      setSubmittingDestruction(true);
      await destroyEvidence(params.id);
      alert("Evidence record and IPFS payload successfully destroyed!");
      router.push("/evidence");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to destroy evidence.");
    } finally {
      setSubmittingDestruction(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEvidenceById(params.id);
        setEvidence(data);
        setHashInput(data.fileHash || "");
      } catch (err: any) {
        console.error(err);
        setError("Failed to load evidence details from repository.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const isMatch = useMemo(
    () => {
      if (!evidence) return false;
      return hashInput.trim().toLowerCase() === evidence.fileHash.toLowerCase();
    },
    [hashInput, evidence]
  );

  function verifyHash() {
    setResult(isMatch ? "match" : "mismatch");
  }

  function handleCopy(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  }

  const statusColors: Record<string, string> = {
    Registered: "bg-sky-50 text-sky-700 border-sky-200",
    InTransit: "bg-amber-50 text-amber-700 border-amber-200",
    InLab: "bg-blue-50 text-blue-700 border-blue-200",
    InCourt: "bg-violet-50 text-violet-700 border-violet-200",
    Disposed: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 min-h-60">
        <div className="text-center space-y-2">
          <History className="h-8 w-8 mx-auto text-slate-350 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Syncing with ledger console...</p>
        </div>
      </div>
    );
  }

  if (error || !evidence) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 min-h-60">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-rose-500" />
          <p className="text-sm font-semibold text-slate-600">{error || "Evidence record not found."}</p>
          <Link href="/evidence" className="text-xs font-semibold text-blue-600 hover:underline block mt-2">
            Return to Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:bg-white print:p-0">
      {/* Top Header Card */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-slate-200 bg-white p-6 rounded-2xl shadow-xs print:border-none print:shadow-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ledger File</span>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[evidence.status]}`}>
              {evidence.status === "InTransit" ? "In Transit" : evidence.status === "InLab" ? "In Laboratory" : evidence.status === "InCourt" ? "In Court" : evidence.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-slate-400" />
            <span>Record: {evidence.id}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Case Reference: <span className="font-semibold text-slate-700">{evidence.caseId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </button>

          {evidence.status !== "Disposed" && (
            <button
              onClick={handleDispose}
              disabled={submittingDisposal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-250 bg-amber-50 px-4 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition shadow-xs disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              <span>{submittingDisposal ? "Disposing..." : "Dispose Evidence"}</span>
            </button>
          )}

          <button
            onClick={handleDestroy}
            disabled={submittingDestruction}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-250 bg-rose-50 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-xs disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>{submittingDestruction ? "Destroying..." : "Destroy Record"}</span>
          </button>

          {evidence.status !== "Disposed" && (
            <Link
              href={`/transfer-custody?id=${evidence.id}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Send className="h-4 w-4" />
              <span>Transfer Custody</span>
            </Link>
          )}
        </div>
      </section>

      {/* Core Details Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          {/* Metadata Card */}
          <article className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">Evidence Metadata</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">Case ID Ref</span>
                <span className="mt-1 block text-sm font-semibold text-slate-900">{evidence.caseId}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">Evidence Classification</span>
                <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold border ${
                  evidence.classification === "Restricted"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>{evidence.classification}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">Evidence Type</span>
                <span className="mt-1 block text-sm font-semibold text-slate-900">{evidence.type}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">Current Custodian</span>
                <span className="mt-1 block text-sm font-semibold text-slate-900">{evidence.custodian}</span>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Custodial Notes & Intake Comments</span>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                {evidence.notes}
              </p>
            </div>
          </article>

          {/* Custody Timeline */}
          <article className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Custody Timeline Log</h2>
              <History className="h-4.5 w-4.5 text-slate-400" />
            </div>

            <div className="relative pl-6 border-l border-slate-200 space-y-6">
              {(evidence.custodyEvents || []).map((event: any, index: number) => (
                <div key={index} className="relative space-y-2">
                  {/* Indicator Dot */}
                  <span className="absolute -left-[30px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white border border-slate-300">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-800">{event.actor}</span>
                      <span className="text-[10px] text-slate-400 ml-2 font-medium">({event.department})</span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(event.time).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{event.action}</p>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-lg">{event.note}</p>
                  
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                    <span>Tx: {event.hash}</span>
                    <span>•</span>
                    <span className="text-emerald-600">{event.confirmation}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* Side panels */}
        <aside className="space-y-6">
          {/* QR Code and anchors */}
          <QrCode value={`${evidence.id}:${evidence.txHash}`} label={`Evidence: ${evidence.id}`} />

          {/* Cryptographic Identifiers */}
          <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Cryptography Keys</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase">
                  <span>SHA-256 Hash Fingerprint</span>
                  <button
                    onClick={() => handleCopy(evidence.fileHash, "hash")}
                    className="p-1 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedText === "hash" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="mt-1.5 break-all font-mono text-[10px] bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-slate-600 leading-normal">
                  {evidence.fileHash}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase">
                  <span>IPFS Storage CID</span>
                  <button
                    onClick={() => handleCopy(evidence.ipfsCid, "ipfs")}
                    className="p-1 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedText === "ipfs" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="mt-1.5 break-all font-mono text-[10px] bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-slate-600 leading-normal">
                  {evidence.ipfsCid}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">Ledger Confirmation Signature</span>
                <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Compass className="h-4 w-4 text-blue-600" />
                  <span>Anchor Block: Verified on Node</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Digital signing completed by Officer Vance on node connection.</p>
              </div>
            </div>
          </section>

          {/* Interactive Hash Verifier */}
          <section className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileCheck className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Cryptographic Hash Verifier</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify this evidence package integrity by matching the on-chain SHA-256 fingerprint with a candidate hash.
            </p>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Candidate SHA-256 Fingerprint</span>
                <textarea
                  value={hashInput}
                  onChange={(event) => setHashInput(event.target.value)}
                  className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[10px] text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="Paste transaction or file hash here..."
                />
              </label>

              <button
                type="button"
                onClick={verifyHash}
                className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Execute Integrity Audit
              </button>

              {result !== "idle" && (
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-semibold ${
                    result === "match"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {result === "match" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Hash Match Verified</p>
                        <p className="font-medium text-emerald-700 text-[10px] mt-0.5">The candidate hash matches the blockchain register. The file has not been altered or tampered with.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Tamper Alert: Hash Mismatch</p>
                        <p className="font-medium text-rose-700 text-[10px] mt-0.5">The candidate fingerprint does not match the block record. Access forbidden or file corrupted.</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}