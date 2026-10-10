import { Search, X } from "lucide-react";

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="search" className="relative flex-1">
      <Search size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search your library"
        placeholder="Search titles, text, tags, links…"
        className="block h-11 w-full rounded-xl border border-line bg-card pl-10 pr-10 text-[15px] transition-colors duration-150 placeholder:text-muted/80 hover:border-accent/50 focus-visible:border-accent [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink">
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}
