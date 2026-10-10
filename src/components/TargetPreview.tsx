import type { Challenge } from "@/data/challenges";

type Props = {
  challenge: Pick<Challenge, "reference" | "width" | "height" | "title">;
  /** rendered width in CSS pixels; height follows the challenge's aspect ratio */
  size: number;
  label: string;
};

/**
 * Renders challenge code in a fully sandboxed iframe: no scripts, no network
 * (the CSP blocks every request), scaled down to fit.
 */
export function TargetPreview({ challenge, size, label }: Props) {
  const scale = size / challenge.width;
  const doc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">${challenge.reference}`;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg border border-border-default"
      style={{ width: size, height: challenge.height * scale }}
    >
      <iframe
        title={label}
        srcDoc={doc}
        sandbox=""
        tabIndex={-1}
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{ width: challenge.width, height: challenge.height, transform: `scale(${scale})` }}
      />
    </div>
  );
}
