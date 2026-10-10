"use client";

import type { ItemInput } from "@/lib/schemas";
import type { Collection, SavedItem } from "@/lib/types";
import { ItemForm } from "./ItemForm";
import { Dialog } from "./ui/Dialog";

export function QuickAddDialog({
  open,
  item,
  collections,
  knownTags,
  defaultCollectionId,
  onSubmit,
  onClose,
}: {
  open: boolean;
  item?: SavedItem;
  collections: Collection[];
  knownTags: string[];
  defaultCollectionId?: string;
  onSubmit: (input: ItemInput) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={item ? "Edit item" : "Quick add"}
      description={item ? undefined : "Save something worth coming back to."}
    >
      <ItemForm item={item} collections={collections} knownTags={knownTags} defaultCollectionId={defaultCollectionId} onSubmit={onSubmit} onCancel={onClose} />
    </Dialog>
  );
}
