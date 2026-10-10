"use client";

import { BookmarkPlus, FolderOpen, Plus, SearchX, Star } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { api, toApiError, type ApiError } from "@/lib/api";
import type { CollectionInput, ItemInput } from "@/lib/schemas";
import type { Collection, ContentType, SavedItem, Scope, SortKey } from "@/lib/types";
import { applyView, formatDate } from "@/lib/view";
import { AppShell } from "./AppShell";
import { CollectionDialog } from "./CollectionDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { FilterBar, type Layout } from "./FilterBar";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { CardGrid, MasonryCell, MasonryGrid } from "./MasonryGrid";
import { QuickAddDialog } from "./QuickAddDialog";
import { SavedItemCard } from "./SavedItemCard";
import { SavedItemRow } from "./SavedItemRow";
import { SearchBar } from "./SearchBar";
import { Sidebar, type SyncState } from "./Sidebar";
import { Button } from "./ui/Button";

type Status = { state: "loading" } | { state: "ready" } | { state: "error"; error: ApiError };

export function LibraryApp() {
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [items, setItems] = useState<SavedItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [scope, setScope] = useState<Scope>({ kind: "all" });
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ContentType | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [layout, setLayoutState] = useState<Layout>("grid");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pc-layout");
      if (saved === "grid" || saved === "masonry" || saved === "list") setLayoutState(saved);
    } catch {
      /* storage unavailable; keep the default */
    }
  }, []);
  const setLayout = (l: Layout) => {
    setLayoutState(l);
    try {
      localStorage.setItem("pc-layout", l);
    } catch {
      /* ignore */
    }
  };

  const [editor, setEditor] = useState<{ item?: SavedItem } | null>(null);
  const [deleting, setDeleting] = useState<SavedItem | null>(null);
  const [collDialog, setCollDialog] = useState<{ collection?: Collection } | null>(null);
  const [deletingColl, setDeletingColl] = useState<Collection | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const pendingFav = useRef(new Set<string>());
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setStatus({ state: "loading" });
    try {
      const lib = await api.library();
      setItems(lib.items);
      setCollections(lib.collections);
      setStatus({ state: "ready" });
    } catch (e) {
      setStatus({ state: "error", error: toApiError(e) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* ---------- derived data ---------- */
  const deferredQuery = useDeferredValue(query);
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) for (const t of i.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items]);
  const allTags = useMemo(() => tagCounts.map(([t]) => t).sort(), [tagCounts]);
  const activeTag = tag && allTags.includes(tag) ? tag : null;
  const collectionCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) if (i.collectionId) m.set(i.collectionId, (m.get(i.collectionId) ?? 0) + 1);
    return m;
  }, [items]);
  const collectionNames = useMemo(() => new Map(collections.map((c) => [c.id, c.name])), [collections]);
  const favoriteCount = useMemo(() => items.filter((i) => i.isFavorite).length, [items]);
  const activeCollection = scope.kind === "collection" ? collections.find((c) => c.id === scope.id) : undefined;

  const visible = useMemo(
    () => applyView(items, { scope, query: deferredQuery, type, tag: activeTag, sort }),
    [items, scope, deferredQuery, type, activeTag, sort],
  );
  // Group by day when the order is chronological; alphabetical order stays one flat list.
  const groups = useMemo(() => {
    if (sort === "alpha") return [{ label: null as string | null, items: visible }];
    const out: { label: string | null; items: SavedItem[] }[] = [];
    for (const item of visible) {
      const label = formatDate(sort === "updated" ? item.updatedAt : item.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(item);
      else out.push({ label, items: [item] });
    }
    return out;
  }, [visible, sort]);
  const filtered = query.trim() !== "" || type !== "all" || activeTag !== null;
  const resetFilters = () => {
    setQuery("");
    setType("all");
    setTag(null);
  };

  /* ---------- mutations ---------- */
  async function saveItem(input: ItemInput) {
    if (editor?.item) {
      const { item } = await api.updateItem(editor.item.id, input);
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      notify("Changes saved");
    } else {
      const { item } = await api.createItem(input);
      setItems((prev) => [item, ...prev]);
      notify("Saved to your library");
    }
    setEditor(null);
  }

  async function toggleFavorite(item: SavedItem) {
    if (pendingFav.current.has(item.id)) return;
    pendingFav.current.add(item.id);
    const next = !item.isFavorite;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isFavorite: next } : i)));
    try {
      const { item: saved } = await api.setFavorite(item.id, next);
      setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
    } catch (e) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isFavorite: !next } : i)));
      notify(`Couldn't update favorite. ${toApiError(e).message}`);
    } finally {
      pendingFav.current.delete(item.id);
    }
  }

  async function removeItem(item: SavedItem) {
    await api.deleteItem(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    notify("Item deleted");
  }

  async function saveCollection(input: CollectionInput) {
    if (collDialog?.collection) {
      const { collection } = await api.renameCollection(collDialog.collection.id, input);
      setCollections((prev) => prev.map((c) => (c.id === collection.id ? collection : c)));
    } else {
      const { collection } = await api.createCollection(input);
      setCollections((prev) => [...prev, collection]);
      setScope({ kind: "collection", id: collection.id });
    }
  }

  async function removeCollection(c: Collection) {
    await api.deleteCollection(c.id);
    setCollections((prev) => prev.filter((x) => x.id !== c.id));
    setItems((prev) => prev.map((i) => (i.collectionId === c.id ? { ...i, collectionId: undefined } : i)));
    setScope((s) => (s.kind === "collection" && s.id === c.id ? { kind: "all" } : s));
    notify(`Collection “${c.name}” deleted. Its items were kept.`);
  }

  /* ---------- presentation ---------- */
  const sync: SyncState = status.state === "ready" ? "synced" : status.state === "error" ? "error" : "loading";
  const heading =
    scope.kind === "favorites"
      ? { title: "Favorites", description: "The things you've starred." }
      : activeCollection
        ? { title: activeCollection.name, description: "A collection of saved items." }
        : { title: "All items", description: "Everything you've saved, in one calm place." };
  const openAdd = () => setEditor({});

  const sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <Sidebar
      scope={scope}
      onScope={setScope}
      collections={collections}
      collectionCounts={collectionCounts}
      totalCount={items.length}
      favoriteCount={favoriteCount}
      tags={tagCounts}
      activeTag={activeTag}
      onTag={setTag}
      onQuickAdd={openAdd}
      onNewCollection={() => setCollDialog({})}
      onRenameCollection={(c) => setCollDialog({ collection: c })}
      onDeleteCollection={setDeletingColl}
      sync={sync}
      onNavigate={onNavigate}
    />
  );

  function renderBody() {
    if (status.state === "loading") return <LoadingSkeleton />;
    if (status.state === "error") return <ErrorState error={status.error} onRetry={load} />;

    if (items.length === 0) {
      return (
        <EmptyState icon={BookmarkPlus} title="Your library is empty" description="Save a link, a quote, a snippet, an image or a document reference. It only takes a few seconds.">
          <Button variant="primary" onClick={openAdd}><Plus size={17} aria-hidden /> Save your first item</Button>
        </EmptyState>
      );
    }
    if (visible.length === 0) {
      if (filtered) {
        return (
          <EmptyState icon={SearchX} title="Nothing matches" description="No saved items match your current search and filters.">
            <Button variant="primary" onClick={resetFilters}>Reset search and filters</Button>
          </EmptyState>
        );
      }
      if (scope.kind === "favorites") {
        return <EmptyState icon={Star} title="No favorites yet" description="Tap the star on any item to keep it close at hand." />;
      }
      return (
        <EmptyState icon={FolderOpen} title="This collection is empty" description="Add something new here, or move existing items into it from their edit menu.">
          <Button variant="primary" onClick={openAdd}><Plus size={17} aria-hidden /> Add an item</Button>
        </EmptyState>
      );
    }
    const handlers = {
      onToggleFavorite: toggleFavorite,
      onEdit: (i: SavedItem) => setEditor({ item: i }),
      onDelete: setDeleting,
      onTagClick: (t: string) => setTag((cur) => (cur === t ? null : t)),
      activeTag,
    };
    return (
      <div className="space-y-10">
        {groups.map((g, gi) => {
          const cards = g.items.map((item) => {
            const collectionName = item.collectionId ? collectionNames.get(item.collectionId) : undefined;
            if (layout === "list") return <li key={item.id}><SavedItemRow item={item} {...handlers} /></li>;
            const card = <SavedItemCard item={item} collectionName={collectionName} layout={layout} {...handlers} />;
            return layout === "masonry" ? <MasonryCell key={item.id}>{card}</MasonryCell> : <li key={item.id}>{card}</li>;
          });
          return (
            <section key={g.label ?? gi} aria-label={g.label ?? "Items"}>
              {g.label && (
                <div className="mb-4">
                  <h2 className="text-[26px] font-bold leading-tight tracking-tight">{g.label}</h2>
                  <p className="text-[17px] text-ink/80">{g.items.length} {g.items.length === 1 ? "item" : "items"}</p>
                </div>
              )}
              {layout === "masonry" ? <MasonryGrid>{cards}</MasonryGrid> : layout === "grid" ? <CardGrid>{cards}</CardGrid> : <ul className="space-y-2">{cards}</ul>}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">Skip to content</a>
      <AppShell sidebar={sidebar} onQuickAdd={openAdd} search={status.state === "ready" && items.length > 0 ? <SearchBar value={query} onChange={setQuery} /> : null}>
        {scope.kind === "all" ? (
          <h1 className="sr-only">All items</h1>
        ) : (
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{heading.title}</h1>
            <button type="button" onClick={() => setScope({ kind: "all" })} className="rounded-full px-3 py-1 text-sm font-medium text-accent-strong hover:bg-surface">Back to all</button>
          </div>
        )}
        {status.state === "ready" && items.length > 0 && (
          <FilterBar type={type} onType={setType} tag={activeTag} tags={allTags} onTag={setTag} sort={sort} onSort={setSort} layout={layout} onLayout={setLayout} onReset={resetFilters} filtered={filtered} />
        )}
        {renderBody()}
      </AppShell>

      <QuickAddDialog
        open={editor !== null}
        item={editor?.item}
        collections={collections}
        knownTags={allTags}
        defaultCollectionId={scope.kind === "collection" ? scope.id : undefined}
        onSubmit={saveItem}
        onClose={() => setEditor(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this item?"
        description="This permanently removes it from your library. This can't be undone."
        onConfirm={async () => { if (deleting) await removeItem(deleting); }}
        onClose={() => setDeleting(null)}
      />
      <CollectionDialog open={collDialog !== null} collection={collDialog?.collection} onSubmit={saveCollection} onClose={() => setCollDialog(null)} />
      <ConfirmDialog
        open={deletingColl !== null}
        title={`Delete “${deletingColl?.name ?? ""}”?`}
        description="The collection is removed, but the items inside it are kept and become uncategorised."
        confirmLabel="Delete collection"
        onConfirm={async () => { if (deletingColl) await removeCollection(deletingColl); }}
        onClose={() => setDeletingColl(null)}
      />

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8">
        {toast && <p className="pointer-events-auto max-w-md rounded-xl border border-line bg-card px-4 py-2.5 text-sm shadow-[0_8px_24px_rgba(23,43,77,0.12)]">{toast}</p>}
      </div>
    </>
  );
}
