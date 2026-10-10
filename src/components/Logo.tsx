export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--surface)" stroke="var(--border)" />
        <rect x="8" y="7" width="12" height="16" rx="3" fill="var(--card)" stroke="var(--accent)" strokeWidth="1.5" />
        <circle cx="21" cy="21" r="5" fill="var(--accent)" />
      </svg>
      <span className="text-[17px] font-semibold tracking-tight">Paper &amp; Cloud</span>
    </div>
  );
}
