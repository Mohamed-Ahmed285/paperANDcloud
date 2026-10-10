"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "./Button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  variant?: "modal" | "drawer";
  children: ReactNode;
}

/**
 * Built on the native <dialog> element: modal focus trap, Escape-to-close and inert background
 * come from the browser. Children are only mounted while open, so forms reset on every open.
 */
export function Dialog({ open, onClose, title, description, variant = "modal", children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const layout =
    variant === "drawer"
      ? "m-0 mr-auto h-dvh max-h-dvh w-72 max-w-[85vw] rounded-none rounded-r-2xl"
      : "m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-lg rounded-2xl";

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`${layout} overflow-y-auto border border-line bg-card p-0 shadow-[0_8px_30px_rgba(23,43,77,0.10)] backdrop:bg-ink/30`}
    >
      {open && (
        <div className={variant === "drawer" ? "h-full" : "p-5 sm:p-6"}>
          {title && (
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
                {description && <p className="mt-1 font-body text-[15px] text-muted">{description}</p>}
              </div>
              <IconButton label="Close dialog" onClick={onClose} className="-mr-2 -mt-2">
                <X size={18} aria-hidden />
              </IconButton>
            </div>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
