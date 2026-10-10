"use client";

import { FolderPlus, Folder, Hash, LibraryBig, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useId, type ReactNode } from "react";
import type { Collection, Scope } from "@/lib/types";
import { Logo } from "./Logo";
import { Button, IconButton } from "./ui/Button";
import { Menu, MenuItem } from "./ui/Menu";

export type SyncState = "loading" | "synced" | "error";

interface Props {
  scope: Scope;
  onScope: (s: Scope) => void;
  collections: Collection[];
  collectionCounts: Map<string, number>;
  totalCount: number;
  favoriteCount: number;
  tags: [string, number][];
  activeTag: string | null;
  onTag: (t: string | null) => void;
  onQuickAdd: () => void;
  onNewCollection: () => void;
  onRenameCollection: (c: Collection) => void;
  onDeleteCollection: (c: Collection) => void;
  sync: SyncState;
  /** Called after any navigation/action so a mobile drawer can close itself. */
  onNavigate?: () => void;
}

function NavButton({ active, icon, count, onClick, children }: { active: boolean; icon: ReactNode; count?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm transition-colors duration-150 ${active ? "bg-surface font-medium text-accent-strong" : "text-ink hover:bg-surface/70"}`}
    >
      <span className={active ? "text-accent" : "text-muted"}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count !== undefined && <span className="text-xs tabular-nums text-muted">{count}</span>}
    </button>
  );
}

export function Sidebar(p: Props) {
  const uid = useId();
  const collId = `${uid}-collections`;
  const tagsId = `${uid}-tags`;
  const done = (fn: () => void) => () => {
    fn();
    p.onNavigate?.();
  };
  const syncLabel = { loading: "Connecting…", synced: "Synced with JSONBin", error: "Not connected" }[p.sync];

  return (
    <nav aria-label="Library" className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-5">
      <div className="px-1"><Logo /></div>

      <Button variant="primary" className="w-full" onClick={done(p.onQuickAdd)}>
        <Plus size={17} aria-hidden /> Quick add
      </Button>

      <div className="space-y-1">
        <NavButton active={p.scope.kind === "all"} icon={<LibraryBig size={17} aria-hidden />} count={p.totalCount} onClick={done(() => p.onScope({ kind: "all" }))}>All items</NavButton>
        <NavButton active={p.scope.kind === "favorites"} icon={<Star size={17} aria-hidden />} count={p.favoriteCount} onClick={done(() => p.onScope({ kind: "favorites" }))}>Favorites</NavButton>
      </div>

      <section aria-labelledby={collId}>
        <div className="mb-1.5 flex items-center justify-between px-3">
          <h2 id={collId} className="text-xs font-semibold uppercase tracking-wide text-muted">Collections</h2>
          <IconButton label="New collection" className="-mr-2 size-8" onClick={done(p.onNewCollection)}><FolderPlus size={16} aria-hidden /></IconButton>
        </div>
        {p.collections.length === 0 ? (
          <p className="px-3 font-body text-sm text-muted">Group related items into collections.</p>
        ) : (
          <ul className="space-y-1">
            {p.collections.map((c) => {
              const active = p.scope.kind === "collection" && p.scope.id === c.id;
              return (
                <li key={c.id} className="flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <NavButton active={active} icon={<Folder size={17} aria-hidden />} count={p.collectionCounts.get(c.id) ?? 0} onClick={done(() => p.onScope({ kind: "collection", id: c.id }))}>{c.name}</NavButton>
                  </div>
                  <Menu label={`Actions for collection ${c.name}`} trigger={<MoreHorizontal size={16} aria-hidden />} triggerClassName="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink">
                    {(close) => (
                      <>
                        <MenuItem icon={<Pencil size={15} aria-hidden />} onClick={() => { close(); p.onRenameCollection(c); p.onNavigate?.(); }}>Rename</MenuItem>
                        <MenuItem danger icon={<Trash2 size={15} aria-hidden />} onClick={() => { close(); p.onDeleteCollection(c); p.onNavigate?.(); }}>Delete</MenuItem>
                      </>
                    )}
                  </Menu>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby={tagsId}>
        <h2 id={tagsId} className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted">Tags</h2>
        {p.tags.length === 0 ? (
          <p className="px-3 font-body text-sm text-muted">Tags you add will appear here.</p>
        ) : (
          <ul className="space-y-1">
            {p.tags.slice(0, 12).map(([tag, n]) => (
              <li key={tag}>
                <NavButton active={p.activeTag === tag} icon={<Hash size={16} aria-hidden />} count={n} onClick={done(() => p.onTag(p.activeTag === tag ? null : tag))}>{tag}</NavButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div role="status" className="mt-auto flex items-center gap-2 px-3 text-xs text-muted">
        <span aria-hidden className={`size-2 rounded-full ${p.sync === "synced" ? "bg-accent" : "border border-muted"}`} />
        {syncLabel}
      </div>
    </nav>
  );
}
