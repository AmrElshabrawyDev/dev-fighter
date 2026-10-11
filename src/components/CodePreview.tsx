import { previewDocument } from "@/lib/match/document";

type Props = {
  code: string;
  /** the page size the code is rendered at (a challenge's canvas) */
  width?: number;
  height?: number;
  /** shown width in CSS pixels */
  size: number;
  label: string;
};

/** Renders HTML + CSS in the same sandbox as the live preview (no scripts, no network), scaled down */
export function CodePreview({ code, width = 400, height = 300, size, label }: Props) {
  const scale = size / width;
  return (
    <div className="relative shrink-0 overflow-hidden rounded-lg ring-1 ring-border-default" style={{ width: size, height: height * scale }}>
      <iframe
        title={label}
        srcDoc={previewDocument(code)}
        sandbox=""
        tabIndex={-1}
        loading="lazy"
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
        style={{ width, height, transform: `scale(${scale})` }}
      />
    </div>
  );
}
