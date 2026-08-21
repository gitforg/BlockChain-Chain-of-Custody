"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const MotionOverlay = motion.create(Dialog.Overlay);
const MotionContent = motion.create(Dialog.Content);

/**
 * Right-hand slide-over inspector.
 *
 * Radix owns focus trapping, scroll locking and escape/outside dismissal;
 * framer-motion owns the transition. `forceMount` hands presence control to
 * AnimatePresence so the exit animation can play before unmount.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-xl",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <MotionOverlay
              forceMount
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]"
            />

            <MotionContent
              forceMount
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.9 }}
              className={cn(
                "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-zinc-800 bg-zinc-950",
                "shadow-2xl shadow-black/60 focus:outline-none",
                width,
              )}
            >
              <header className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3">
                <div className="min-w-0">
                  <Dialog.Title asChild>
                    <div className="truncate text-sm font-semibold text-zinc-100">{title}</div>
                  </Dialog.Title>
                  {subtitle && (
                    <Dialog.Description asChild>
                      <div className="mt-0.5 truncate text-[11px] text-zinc-500">{subtitle}</div>
                    </Dialog.Description>
                  )}
                </div>

                <Dialog.Close
                  className="shrink-0 rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60"
                  aria-label="Close inspector"
                >
                  <X className="h-4 w-4" />
                </Dialog.Close>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

              {footer && (
                <footer className="border-t border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
                  {footer}
                </footer>
              )}
            </MotionContent>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
