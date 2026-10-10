/**
 * Dev Fighter mark: the brand hexagon with two code brackets facing off — two
 * fighters in the ring. Colours from Amr Elshabrawy's brand.
 */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M32 3 57 17.5v29L32 61 7 46.5v-29z"
        fill="#11111b"
        stroke="#89b4fa"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="m26 22-10 10 10 10" fill="none" stroke="#94e2d5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m38 22 10 10-10 10" fill="none" stroke="#f38ba8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5" dir="ltr">
      <LogoMark />
      <span className="font-mono text-lg font-bold tracking-tight">
        Dev<span className="text-primary">Fighter</span>
      </span>
    </span>
  );
}
