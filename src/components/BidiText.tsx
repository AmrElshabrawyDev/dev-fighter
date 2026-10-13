import { Fragment } from "react";

// a run of Latin/code tokens, e.g. "border-radius:150px 0", "100vh" or "i+i+i";
// a token never ends in sentence punctuation, so "place-items:center." keeps its full stop outside
const TOKEN = String.raw`[\w#<](?:[\w#:%;().,+×/'"<>=*-]*[\w#%)>*'"])?`;
const CODE_RUN = new RegExp(`(${TOKEN}(?: ${TOKEN})*)`, "g");

/** The code snippets found in a text (for tests) */
export function codeRuns(text: string): string[] {
  return text.split(CODE_RUN).filter((_, i) => i % 2 === 1);
}

/**
 * Arabic text with CSS snippets in it. Each Latin run is isolated as
 * left-to-right, so "border-radius:150px 0" doesn't come out as "0 border-radius:150px".
 */
export function BidiText({ text }: { text: string }) {
  const parts = text.split(CODE_RUN);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <bdi key={i} dir="ltr" className="font-mono text-[0.9em] text-secondary">
            {part}
          </bdi>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
