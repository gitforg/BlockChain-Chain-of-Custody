"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Ban,
  Clock,
  ExternalLink,
  FileWarning,
  Maximize2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import {
  ConsoleButton,
  Field,
  Led,
  MonoValue,
  Skeleton,
  StatusBadge,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { disposeEvidence, fetchEvidenceById } from "@/lib/api";
import { getExplorerTxUrl } from "@/lib/chain";
import type { CustodyEvent, EvidenceRecord } from "@/lib/types";
import { STATUS_CODE, STATUS_LABEL, STATUS_TONE } from "@/lib/types";
import { cn, formatBytes, formatTimestamp } from "@/lib/utils";

const IMAGE_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?|#|$)/i;

function isImageEvidence(record: EvidenceRecord) {
  return (
    IMAGE_PATTERN.test(record.fileName || "") ||
    IMAGE_PATTERN.test(record.filePath || "") ||
    (record.type || "").toLowerCase().includes("image")
  );
}

/* -------------------------------------------------------------------------- */
/* Custody timeline                                                           */
/* -------------------------------------------------------------------------- */

function CustodyTimeline({ events }: { events: CustodyEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-xs text-zinc-600">
        No custody events recorded for this item.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 px-4 py-1">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const tone =
          event.action === "VERIFIED"
            ? "verified"
            : event.action === "DISPOSED"
              ? "alert"
              : (STATUS_TONE[event.status] ?? "info");

        return (
          <motion.li
            key={event.id ?? index}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.24), duration: 0.18 }}
            className="relative flex gap-3 pb-4"
          >
            {/* Rail */}
            <div className="relative flex w-3 shrink-0 justify-center pt-1">
              <Led tone={tone} pulse={isLast} />
              {!isLast && (
                <span className="absolute top-3.5 bottom-[-1rem] w-px bg-zinc-800" aria-hidden />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-xs font-medium text-zinc-200">{event.actor}</span>
                <span className="font-mono text-[10px] text-zinc-600">
                  {formatTimestamp(event.time)}
                </span>
              </div>

              <p className="mt-0.5 text-[11px] text-zinc-400">{event.action}</p>

              {event.department && (
                <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{event.department}</p>
              )}

              {event.note && (
                <p className="mt-1 border-l border-zinc-800 pl-2 text-[11px] leading-relaxed text-zinc-500">
                  {event.note}
                </p>
              )}

              {event.confirmation && (
                <p className="mt-1 font-mono text-[10px] text-emerald-400/80">
                  {event.confirmation}
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* Inspector                                                                  */
/* -------------------------------------------------------------------------- */

export function InspectorDrawer({
  evidenceId,
  open,
  onOpenChange,
  onMutated,
}: {
  evidenceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after a mutation so the parent can refresh its table. */
  onMutated?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [disposing, setDisposing] = useState(false);

  useEffect(() => {
    if (!open || !evidenceId) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setRecord(null);

    void fetchEvidenceById(evidenceId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Record not found, or the backend is unreachable.");
          return;
        }
        setRecord(data as EvidenceRecord);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [evidenceId, open]);

  const handleCopied = useCallback(
    (value: string) => toast("Copied to clipboard", { detail: value }),
    [toast],
  );

  const handleDispose = useCallback(async () => {
    if (!record) return;
    if (!confirm(`Dispose ${record.id}? This is recorded permanently on-chain.`)) return;

    setDisposing(true);
    try {
      const updated = await disposeEvidence(record.id);
      setRecord((current) => (current ? { ...current, ...updated } : current));
      toast(`${record.id} disposed`, { tone: "success" });
      onMutated?.();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Disposal failed";
      toast(message, { tone: "error" });
    } finally {
      setDisposing(false);
    }
  }, [onMutated, record, toast]);

  const explorerUrl = record?.txHash ? getExplorerTxUrl(record.txHash) : "";
  const tone = record ? (STATUS_TONE[record.status] ?? "muted") : "muted";

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      width="max-w-2xl"
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono text-cyan-300">{evidenceId ?? "—"}</span>
          {record && (
            <StatusBadge
              tone={tone}
              code={STATUS_CODE[record.status] ?? "UNK"}
              label={STATUS_LABEL[record.status] ?? record.status}
            />
          )}
        </span>
      }
      subtitle={record ? record.title || record.type : "Loading record…"}
      footer={
        record && (
          <div className="flex flex-wrap items-center gap-1.5">
            <ConsoleButton
              variant="primary"
              onClick={() => router.push(`/transfer-custody?id=${record.id}`)}
              disabled={record.status === "Disposed"}
            >
              <Send className="h-3 w-3" />
              Transfer Custody
            </ConsoleButton>

            <ConsoleButton onClick={() => router.push(`/verification?id=${record.id}`)}>
              <ShieldCheck className="h-3 w-3" />
              Verify Hash
            </ConsoleButton>

            <ConsoleButton
              variant="danger"
              onClick={handleDispose}
              disabled={disposing || record.status === "Disposed"}
            >
              <Ban className="h-3 w-3" />
              {disposing ? "Disposing…" : "Dispose"}
            </ConsoleButton>

            <div className="flex-1" />

            <ConsoleButton
              variant="ghost"
              onClick={() => router.push(`/evidence/${record.id}`)}
              title="Open the full record page"
            >
              <Maximize2 className="h-3 w-3" />
              Full page
            </ConsoleButton>
          </div>
        )
      }
    >
      {loading && (
        <div className="space-y-4 p-4">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-9" />
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <FileWarning className="h-6 w-6 text-rose-400" />
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}

      {record && !loading && (
        <div className="divide-y divide-zinc-800">
          {/* Media preview */}
          <section className="p-4">
            {isImageEvidence(record) && record.filePath ? (
              <div className="overflow-hidden rounded border border-zinc-800 bg-zinc-900">
                {/* Remote IPFS gateway host is not in next.config images —
                    a plain img keeps this unconstrained and dependency-free. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={record.filePath}
                  alt={`Evidence preview for ${record.id}`}
                  loading="lazy"
                  crossOrigin="anonymous"
                  className="max-h-64 w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center rounded border border-dashed border-zinc-800 bg-zinc-900/40">
                <p className="font-mono text-[10px] text-zinc-600">
                  NO VISUAL PREVIEW · {record.fileName || "binary payload"}
                </p>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[10px] text-zinc-500">
                {record.fileName} · {formatBytes(record.fileSize)}
              </span>
              {record.filePath && (
                <a
                  href={record.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-cyan-400 hover:text-cyan-300"
                >
                  Open source <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </section>

          {/* Cryptographic identifiers — the reason this drawer exists */}
          <section className="space-y-3 p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-600">
              Cryptographic identifiers
            </h3>

            <Field label="SHA-256 fingerprint">
              <MonoValue
                value={record.fileHash}
                copyable
                onCopied={handleCopied}
                tone="accent"
                className="break-all"
              />
            </Field>

            <Field label="IPFS CID">
              <MonoValue value={record.ipfsCid} copyable onCopied={handleCopied} className="break-all" />
            </Field>

            <Field label="Anchor transaction">
              <div className="flex items-center gap-2">
                <MonoValue
                  value={record.txHash}
                  truncate={[10, 8]}
                  copyable
                  onCopied={handleCopied}
                />
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="View on block explorer"
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </Field>
          </section>

          {/* Metadata grid */}
          <section className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-3">
            <Field label="Case ID">
              <MonoValue value={record.caseId} tone="accent" />
            </Field>
            <Field label="Classification">
              <span
                className={cn(
                  "font-mono text-xs",
                  record.classification === "Restricted" ? "text-rose-300" : "text-zinc-300",
                )}
              >
                {record.classification}
              </span>
            </Field>
            <Field label="Block">
              <MonoValue value={record.blockNumber ? `#${record.blockNumber}` : ""} />
            </Field>
            <Field label="Custodian">
              <span className="text-xs text-zinc-200">{record.custodian || "—"}</span>
            </Field>
            <Field label="Department">
              <span className="text-xs text-zinc-400">{record.department || "—"}</span>
            </Field>
            <Field label="Location">
              <span className="text-xs text-zinc-400">{record.location || "—"}</span>
            </Field>
            <Field label="Custodian wallet">
              <MonoValue
                value={record.currentCustodianWallet}
                truncate={[6, 4]}
                copyable
                onCopied={handleCopied}
              />
            </Field>
            <Field label="Creator wallet">
              <MonoValue
                value={record.creatorWallet}
                truncate={[6, 4]}
                copyable
                onCopied={handleCopied}
              />
            </Field>
            <Field label="Registered">
              <span className="font-mono text-[11px] text-zinc-400">
                {formatTimestamp(record.uploadedAt)}
              </span>
            </Field>
          </section>

          {record.notes && (
            <section className="p-4">
              <Field label="Intake notes">
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{record.notes}</p>
              </Field>
            </section>
          )}

          {/* Custody chain */}
          <section className="pb-2">
            <div className="flex items-center gap-2 px-4 py-2.5">
              <Clock className="h-3.5 w-3.5 text-zinc-600" />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-600">
                Chain of custody · {record.custodyEvents?.length ?? 0} events
              </h3>
            </div>
            <CustodyTimeline events={record.custodyEvents ?? []} />
          </section>
        </div>
      )}
    </Sheet>
  );
}
