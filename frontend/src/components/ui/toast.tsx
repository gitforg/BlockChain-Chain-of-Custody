"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  detail?: string;
}

interface ToastContextValue {
  toast: (message: string, options?: { tone?: ToastTone; detail?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TONE_ICON = {
  success: Check,
  error: AlertTriangle,
  info: Info,
} as const;

const TONE_CLASS = {
  success: "border-emerald-500/30 text-emerald-300",
  error: "border-rose-500/30 text-rose-300",
  info: "border-cyan-500/30 text-cyan-300",
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback<ToastContextValue["toast"]>((message, options) => {
    counter.current += 1;
    const id = counter.current;

    setToasts((current) => [
      ...current,
      { id, message, tone: options?.tone ?? "success", detail: options?.detail },
    ]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed bottom-11 right-4 z-[100] flex flex-col items-end gap-1.5">
        <AnimatePresence initial={false}>
          {toasts.map((entry) => {
            const Icon = TONE_ICON[entry.tone];

            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, x: 16, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={cn(
                  "pointer-events-auto flex items-center gap-2 rounded border bg-zinc-900/95 px-2.5 py-1.5",
                  "shadow-lg shadow-black/40 backdrop-blur",
                  TONE_CLASS[entry.tone],
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-medium text-zinc-100">{entry.message}</span>
                {entry.detail && (
                  <span className="max-w-[220px] truncate font-mono text-[10px] text-zinc-500">
                    {entry.detail}
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
