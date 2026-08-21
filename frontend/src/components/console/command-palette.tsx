"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  Boxes,
  Database,
  FilePlus,
  FileSpreadsheet,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { fetchEvidenceList } from "@/lib/api";
import type { EvidenceRecord } from "@/lib/types";
import { STATUS_CODE, STATUS_TONE } from "@/lib/types";
import { StatusBadge } from "@/components/ui/primitives";
import { truncateMiddle } from "@/lib/utils";

const MotionOverlay = motion.create(Dialog.Overlay);
const MotionContent = motion.create(Dialog.Content);

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return context;
}

const QUICK_ACTIONS = [
  { label: "Register New Evidence", href: "/register-evidence", icon: FilePlus, keywords: "intake add create new" },
  { label: "Verify Hash Integrity", href: "/verification", icon: ShieldCheck, keywords: "check sha256 tamper audit" },
  { label: "Transfer Custody", href: "/transfer-custody", icon: Send, keywords: "handoff move custodian" },
  { label: "Export Audit Report", href: "/audit-report", icon: FileSpreadsheet, keywords: "csv pdf logs export" },
  { label: "Chain of Custody Explorer", href: "/chain-of-custody", icon: Workflow, keywords: "timeline history" },
  { label: "Evidence Records Archive", href: "/evidence", icon: Database, keywords: "list directory browse" },
  { label: "Analytics & Reports", href: "/reports", icon: Activity, keywords: "charts metrics trends" },
  { label: "System Settings", href: "/settings", icon: Settings, keywords: "config rpc node ipfs" },
] as const;

export function CommandPaletteProvider({
  children,
  onInspect,
}: {
  children: ReactNode;
  /** Opens the inspector drawer instead of navigating, when available. */
  onInspect?: (evidenceId: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(() => setOpen((current) => !current), []);

  // Global Cmd/Ctrl+K binding.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load the corpus once the palette is first opened, then filter client-side.
  useEffect(() => {
    if (!open || records.length > 0) return;

    let cancelled = false;
    setLoading(true);

    void fetchEvidenceList({ limit: 500 })
      .then((data) => {
        if (!cancelled) setRecords(data.items ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, records.length]);

  const runCommand = useCallback((action: () => void) => {
    setOpen(false);
    setQuery("");
    action();
  }, []);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <MotionOverlay
                forceMount
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-[3px]"
              />

              <MotionContent
                forceMount
                initial={{ opacity: 0, y: -8, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.985 }}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
                aria-label="Command palette"
                className="fixed left-1/2 top-[12vh] z-[60] w-[min(94vw,640px)] -translate-x-1/2 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/70 focus:outline-none"
              >
                <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Search evidence by ID, case, hash or CID, or run a quick action.
                </Dialog.Description>

                <Command
                  loop
                  // Identifiers are opaque strings, so match on raw substrings
                  // rather than cmdk's default fuzzy scoring.
                  filter={(itemValue, search) =>
                    itemValue.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0
                  }
                >
                  <div className="flex items-center gap-2 border-b border-zinc-800 px-3">
                    <Search className="h-4 w-4 shrink-0 text-zinc-600" />
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      autoFocus
                      placeholder="Search evidence ID, case, hash, CID — or run a command…"
                      className="h-11 w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600"
                    />
                    <kbd className="hidden shrink-0 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:block">
                      ESC
                    </kbd>
                  </div>

                  <Command.List className="max-h-[52vh] overflow-y-auto p-1.5">
                    <Command.Empty className="px-3 py-8 text-center text-xs text-zinc-600">
                      {loading ? "Indexing evidence registry…" : "No matching records or commands."}
                    </Command.Empty>

                    <Command.Group heading="Quick actions">
                      {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;

                        return (
                          <Command.Item
                            key={action.href}
                            value={`${action.label} ${action.keywords} ${action.href}`}
                            onSelect={() => runCommand(() => router.push(action.href))}
                            className="flex items-center gap-2.5 rounded px-2.5 py-2 text-xs text-zinc-300"
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                            <span className="flex-1">{action.label}</span>
                            <span className="font-mono text-[10px] text-zinc-700">
                              {action.href}
                            </span>
                          </Command.Item>
                        );
                      })}
                    </Command.Group>

                    {records.length > 0 && (
                      <Command.Group heading={`Evidence registry · ${records.length} indexed`}>
                        {records.map((record) => (
                          <Command.Item
                            key={record.id}
                            value={[
                              record.id,
                              record.caseId,
                              record.title,
                              record.fileHash,
                              record.ipfsCid,
                              record.custodian,
                              record.type,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onSelect={() =>
                              runCommand(() => {
                                if (onInspect) onInspect(record.id);
                                else router.push(`/evidence/${record.id}`);
                              })
                            }
                            className="flex items-center gap-2.5 rounded px-2.5 py-2"
                          >
                            <Boxes className="h-3.5 w-3.5 shrink-0 text-zinc-600" />

                            <span className="font-mono text-xs font-medium text-cyan-300">
                              {record.id}
                            </span>

                            <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                              {record.title || record.type}
                            </span>

                            <span className="hidden font-mono text-[10px] text-zinc-600 md:inline">
                              {truncateMiddle(record.fileHash, 8, 4)}
                            </span>

                            <StatusBadge
                              tone={STATUS_TONE[record.status] ?? "muted"}
                              code={STATUS_CODE[record.status] ?? "UNK"}
                              label={record.status}
                            />
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </Command.List>

                  <footer className="flex items-center justify-between border-t border-zinc-800 px-3 py-1.5">
                    <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-600">
                      <span>↑↓ navigate</span>
                      <span>↵ open</span>
                      <span>esc close</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-700">
                      {loading ? "indexing…" : `${records.length} records`}
                    </span>
                  </footer>
                </Command>
              </MotionContent>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </CommandPaletteContext.Provider>
  );
}
