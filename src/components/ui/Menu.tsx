"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface MenuProps {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  align?: "left" | "right";
  children: (close: () => void) => ReactNode;
}

export function Menu({ label, trigger, triggerClassName = "", align = "right", children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={id}
          className={`absolute z-30 mt-1 min-w-44 rounded-xl border border-line bg-card p-1 shadow-[0_8px_24px_rgba(23,43,77,0.10)] ${align === "right" ? "right-0" : "left-0"}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onClick,
  icon,
  children,
  danger,
  selected,
}: {
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  danger?: boolean;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors duration-150 hover:bg-surface ${
        danger ? "text-danger" : selected ? "font-medium text-accent-strong" : "text-ink"
      }`}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {selected && <span aria-hidden className="size-1.5 rounded-full bg-accent" />}
    </button>
  );
}
