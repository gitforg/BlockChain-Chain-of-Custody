"use client";

import { useMemo, useState, useEffect, use } from "react";
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
import { getExplorerTxUrl } from "@/lib/chain";

type EvidenceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function EvidenceDetailPage({ params }: EvidenceDetailPageProps) {
  const { id } = use(params);
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
      const updated = await disposeEvidence(id);
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
      await destroyEvidence(id);
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
        const data = await fetchEvidenceById(id);

        if (!data) {
          setError("Evidence record not found, or the backend is unreachable.");
          return;
        }

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
  }, [id]);

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
    Registered: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
    InTransit: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    InLab: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    InCourt: "bg-violet-500/10 text-violet-300 border-violet-500/25",
    Disposed: "bg-zinc-800 text-zinc-400 border-zinc-800",
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const explorerTxUrl = getExplorerTxUrl(evidence?.txHash || "");

  const evidenceImageUrl = evidence?.filePath || "";
  const evidenceFileName = evidence?.fileName || "";
  const isImageEvidence =
    /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(evidenceFileName) ||
    /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(evidenceImageUrl) ||
    evidence?.type?.toLowerCase().includes("image") ||
    evidenceFileName.toLowerCase().includes("whatsapp image");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-zinc-900/40 rounded-md border border-zinc-800 min-h-60">
        <div className="text-center space-y-2">
          <History className="h-8 w-8 mx-auto text-zinc-600 animate-spin" />
          <p className="text-sm font-semibold text-zinc-400">Syncing with ledger console...</p>
        </div>
      </div>
    );
  }

  if (error || !evidence) {
    return (
      <div className="flex items-center justify-center p-12 bg-zinc-900/40 rounded-md border border-zinc-800 min-h-60">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-rose-400" />
          <p className="text-sm font-semibold text-zinc-400">{error || "Evidence record not found."}</p>
          <Link href="/evidence" className="text-xs font-semibold text-cyan-400 hover:underline block mt-2">
            Return to Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:bg-white print:p-0">
      {/* Top Header Card */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-zinc-800 bg-zinc-900/40 p-6 rounded-md print:border-none print:shadow-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Ledger File</span>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[evidence.status]}`}>
              {evidence.status === "InTransit" ? "In Transit" : evidence.status === "InLab" ? "In Laboratory" : evidence.status === "InCourt" ? "In Court" : evidence.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-zinc-600" />
            <span>Record: {evidence.id}</span>
          </h1>
          <p className="text-xs text-zinc-500">
            Case Reference: <span className="font-semibold text-zinc-300">{evidence.caseId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-900/40 px-4 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 transition"
          >
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </button>

          {evidence.status !== "Disposed" && (
            <button
              onClick={handleDispose}
              disabled={submittingDisposal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded border border-amber-250 bg-amber-500/10 px-4 text-xs font-semibold text-amber-300 hover:bg-amber-100 transition disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              <span>{submittingDisposal ? "Disposing..." : "Dispose Evidence"}</span>
            </button>
          )}

          <button
            onClick={handleDestroy}
            disabled={submittingDestruction}
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-rose-250 bg-rose-500/10 px-4 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>{submittingDestruction ? "Destroying..." : "Destroy Record"}</span>
          </button>

          {evidence.status !== "Disposed" && (
            <Link
              href={`/transfer-custody?id=${evidence.id}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded bg-cyan-600 px-4 text-xs font-semibold text-white hover:bg-cyan-500 transition"
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
          <article className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-6">
            <h2 className="text-sm font-bold text-zinc-100 border-b border-zinc-800 pb-3 uppercase tracking-wider">Evidence Metadata</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Case ID Ref</span>
                <span className="mt-1 block text-sm font-semibold text-zinc-100">{evidence.caseId}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Evidence Classification</span>
                <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold border ${
                  evidence.classification === "Restricted"
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                    : "bg-zinc-800 text-zinc-300 border-zinc-800"
                }`}>{evidence.classification}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Evidence Type</span>
                <span className="mt-1 block text-sm font-semibold text-zinc-100">{evidence.type}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Current Custodian</span>
                <span className="mt-1 block text-sm font-semibold text-zinc-100">{evidence.custodian}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Current Custodian Wallet</span>
                <span className="mt-1 block font-mono text-[10px] text-zinc-300 break-all">{evidence.currentCustodianWallet || "Not linked"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Creator Wallet</span>
                <span className="mt-1 block font-mono text-[10px] text-zinc-300 break-all">{evidence.creatorWallet || "Not linked"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Block Number</span>
                <span className="mt-1 block text-sm font-semibold text-zinc-100">{evidence.blockNumber || "Pending"}</span>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Custodial Notes & Intake Comments</span>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed bg-zinc-900/40 border border-zinc-800 p-3.5 rounded">
                {evidence.notes}
              </p>
            </div>
          </article>

          {/* Custody Timeline */}
          <article className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Custody Timeline Log</h2>
              <History className="h-4.5 w-4.5 text-zinc-600" />
            </div>

            <div className="relative pl-6 border-l border-zinc-800 space-y-6">
              {(evidence.custodyEvents || []).map((event: any, index: number) => (
                <div key={index} className="relative space-y-2">
                  {/* Indicator Dot */}
                  <span className="absolute -left-[30px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-zinc-900/40 border border-zinc-700">
                    <span className="h-2 w-2 rounded-full bg-cyan-600" />
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">{event.actor}</span>
                      <span className="text-[10px] text-zinc-600 ml-2 font-medium">({event.department})</span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-600">
                      <Clock className="h-3 w-3" />
                      {new Date(event.time).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{event.action}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/40 border border-zinc-800 p-3 rounded-lg">{event.note}</p>
                  
                  <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-mono">
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
          {/* Evidence Image */}
          <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-4 print:shadow-none print:border-slate-300">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Evidence Image</h3>
              <span className="text-[10px] font-semibold text-zinc-600 uppercase">Included in report</span>
            </div>

            {isImageEvidence ? (
              <div className="overflow-hidden rounded border border-zinc-800 bg-zinc-900/40 p-2">
                <img
                  src={evidenceImageUrl}
                  alt={`Evidence preview for ${evidence.id}`}
                  className="h-52 w-full rounded-lg object-contain print:h-44"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="flex h-52 items-center justify-center rounded border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-center print:h-44">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-300">No image preview available</p>
                  <p className="text-xs text-zinc-500">
                    The stored evidence file is not an image, so the report will show metadata only.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-600 uppercase text-[10px] font-semibold">File Name</span>
                <span className="font-medium text-zinc-200 truncate">{evidence.fileName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-600 uppercase text-[10px] font-semibold">Storage Path</span>
                <a
                  href={evidenceImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-cyan-400 truncate hover:underline"
                  title={evidenceImageUrl}
                >
                  View source
                </a>
              </div>
            </div>
          </section>

          {/* Cryptographic Identifiers */}
          <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-5">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b border-zinc-800 pb-2">Cryptography Keys</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-600 uppercase">
                  <span>SHA-256 Hash Fingerprint</span>
                  <button
                    onClick={() => handleCopy(evidence.fileHash, "hash")}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-100 transition flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedText === "hash" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="mt-1.5 break-all font-mono text-[10px] bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg text-zinc-400 leading-normal">
                  {evidence.fileHash}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-600 uppercase">
                  <span>IPFS Storage CID</span>
                  <button
                    onClick={() => handleCopy(evidence.ipfsCid, "ipfs")}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-100 transition flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedText === "ipfs" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="mt-1.5 break-all font-mono text-[10px] bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg text-zinc-400 leading-normal">
                  {evidence.ipfsCid}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <span className="block text-[10px] font-semibold text-zinc-600 uppercase">Ledger Confirmation Signature</span>
                <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <Compass className="h-4 w-4 text-cyan-400" />
                  <span>Anchor Block: {evidence.blockNumber || "Pending"}</span>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">Digital signing completed by Officer Vance on node connection.</p>
                {explorerTxUrl && (
                  <a
                    href={explorerTxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-[10px] font-semibold text-cyan-400 hover:underline"
                  >
                    View transaction on block explorer
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Interactive Hash Verifier */}
          <section className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-md space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <FileCheck className="h-4.5 w-4.5 text-cyan-400" />
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Cryptographic Hash Verifier</h3>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed">
              Verify this evidence package integrity by matching the on-chain SHA-256 fingerprint with a candidate hash.
            </p>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-semibold text-zinc-600 uppercase">Candidate SHA-256 Fingerprint</span>
                <textarea
                  value={hashInput}
                  onChange={(event) => setHashInput(event.target.value)}
                  className="mt-1.5 min-h-24 w-full rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 font-mono text-[10px] text-zinc-200 outline-none focus:border-cyan-500 focus:bg-zinc-900 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="Paste transaction or file hash here..."
                />
              </label>

              <button
                type="button"
                onClick={verifyHash}
                className="w-full rounded bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500 transition"
              >
                Execute Integrity Audit
              </button>

              {result !== "idle" && (
                <div
                  className={`flex items-start gap-2.5 rounded border p-3.5 text-xs font-semibold ${
                    result === "match"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                      : "border-rose-500/25 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  {result === "match" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Hash Match Verified</p>
                        <p className="font-medium text-emerald-300 text-[10px] mt-0.5">The candidate hash matches the blockchain register. The file has not been altered or tampered with.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Tamper Alert: Hash Mismatch</p>
                        <p className="font-medium text-rose-300 text-[10px] mt-0.5">The candidate fingerprint does not match the block record. Access forbidden or file corrupted.</p>
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
