/**
 * A faint Kabul Mandawi logo watermark overlaid on product photos, to discourage
 * others from lifting the images. Purely a display overlay — the underlying file
 * is unchanged. Drop it inside any `relative` image container.
 */
export function Watermark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[5] flex items-center justify-center ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        className="w-[55%] max-w-[240px] select-none opacity-30"
      />
    </span>
  );
}
