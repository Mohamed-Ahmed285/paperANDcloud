"use client";

import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { CollectionInputSchema, type CollectionInput } from "@/lib/schemas";
import type { Collection } from "@/lib/types";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Field, Input, describedBy } from "./ui/Field";

export function CollectionDialog({
  open,
  collection,
  onSubmit,
  onClose,
}: {
  open: boolean;
  collection?: Collection;
  onSubmit: (input: CollectionInput) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={collection ? "Rename collection" : "New collection"}>
      <CollectionForm collection={collection} onSubmit={onSubmit} onClose={onClose} />
    </Dialog>
  );
}

function CollectionForm({ collection, onSubmit, onClose }: { collection?: Collection; onSubmit: (i: CollectionInput) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState(collection?.name ?? "");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = CollectionInputSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await onSubmit(parsed.data);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? (err.fields?.name ?? err.message) : "Couldn't save the collection.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Field label="Name" htmlFor="collection-name" error={error}>
        <Input
          id="collection-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={80}
          aria-invalid={!!error}
          aria-describedby={describedBy("collection-name", error)}
          placeholder="e.g. Reading list"
        />
      </Field>
      <div className="mt-6 flex justify-end gap-3">
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {collection ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  );
}
