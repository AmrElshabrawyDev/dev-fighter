import { htmlLanguage } from "@codemirror/lang-html";
import { highlightCode, tagHighlighter } from "@lezer/highlight";
import type { ReactNode } from "react";
import { codeColors } from "@/lib/code-colors";

// each colour group becomes a "class" named by its index in codeColors
const highlighter = tagHighlighter(codeColors.map(({ tag }, i) => ({ tag, class: String(i) })));

/**
 * HTML + CSS with line numbers and the editor's colours, highlighted on the
 * server (no editor code shipped). Long lines wrap instead of scrolling.
 */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const lines: ReactNode[][] = [[]];
  let key = 0;
  highlightCode(
    code,
    htmlLanguage.parser.parse(code),
    highlighter,
    (text, classes) => {
      const style = classes ? codeColors[Number(classes.split(" ")[0])] : undefined;
      lines[lines.length - 1].push(
        style ? (
          <span key={key++} style={{ color: style.color, fontStyle: style.italic ? "italic" : undefined }}>
            {text}
          </span>
        ) : (
          text
        ),
      );
    },
    () => lines.push([]),
  );

  return (
    <pre aria-label={label} className="overflow-hidden rounded-lg bg-[#181825] py-3 text-[13px] leading-relaxed text-text-primary">
      <code className="grid grid-cols-[auto_1fr]">
        {lines.map((line, i) => (
          <span key={i} className="contents">
            <span aria-hidden className="select-none px-3 text-end text-[#585b70]">
              {i + 1}
            </span>
            <span className="whitespace-pre-wrap break-all pe-3">{line.length ? line : " "}</span>
          </span>
        ))}
      </code>
    </pre>
  );
}
