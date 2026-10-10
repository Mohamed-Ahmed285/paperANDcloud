/** Black tile with a big "&", plus the words typed on a slip of paper. */
export function Logo() {
  return (
    <div className="flex items-center gap-2.5" aria-label="Paper & Cloud" role="img">
      <span aria-hidden className="flex size-11 items-center justify-center rounded-xl bg-ink pb-1 font-serif text-[34px] font-bold italic leading-none text-bg">
        &amp;
      </span>
      <span
        aria-hidden
        className="pc-paper hidden -rotate-2 flex-col rounded-[3px] border border-line px-2.5 py-1 font-type text-[15px] leading-[1.15] tracking-tight text-ink shadow-[1px_2px_0_rgba(17,17,17,0.08)] min-[420px]:flex"
      >
        <span>Paper</span>
        <span>Cloud</span>
      </span>
    </div>
  );
}
