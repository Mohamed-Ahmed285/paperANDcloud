"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <ConfirmBody description={description} confirmLabel={confirmLabel} onConfirm={onConfirm} onClose={onClose} />
    </Dialog>
  );
}

function ConfirmBody({ description, confirmLabel, onConfirm, onClose }: { description: string; confirmLabel: string; onConfirm: () => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Nothing was deleted.");
      setBusy(false);
    }
  }

  return (
    <>
      <p className="font-body text-base leading-relaxed text-muted">{description}</p>
      {error && <p role="alert" className="mt-3 text-sm text-danger">⚠ {error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" onClick={run} disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {busy ? "Deleting…" : confirmLabel}
        </Button>
      </div>
    </>
  );
}
