/**
 * A faint brand watermark overlaid on product photos, to discourage others from
 * lifting the images. Purely a display overlay — the underlying file is unchanged.
 * Drop it inside any `relative` image container.
 */
export function Watermark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[5] flex items-center justify-center ${className}`}
    >
      <span
        className="font-display -rotate-[20deg] select-none whitespace-nowrap text-base font-bold uppercase tracking-widest text-white/55 sm:text-xl"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}
      >
        Kabul&nbsp;Mandawi
      </span>
    </span>
  );
}
