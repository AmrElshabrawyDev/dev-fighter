"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicChallenge } from "@/data/challenges";
import type { Dictionary } from "@/i18n/get-dictionary";
import { useDraft } from "@/lib/drafts";
import { previewDocument } from "@/lib/match/document";
import { compare, formatAccuracy, loadTarget, renderCode, type Match } from "@/lib/match/engine";
import { CodeEditor } from "./CodeEditor";

type Props = { challenge: PublicChallenge; t: Dictionary["play"] };
type Mode = "slide" | "diff";

/** The largest size a canvas is shown at; bigger challenges are scaled down */
const MAX_DISPLAY = 400;

const starterCode = (color: string) => `<div></div>
<style>
  div {
    width: 100px;
    height: 100px;
    background: ${color};
  }
</style>
`;

export function Playground({ challenge, t }: Props) {
  const { width, height } = challenge;
  const starter = starterCode(challenge.colors[1] ?? challenge.colors[0]);

  const [code, setCode] = useDraft(`dev-fighter:code:${challenge.slug}`, starter);
  const [preview, setPreview] = useState(code); // `code`, a moment after typing stops
  const [match, setMatch] = useState<Match | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [mode, setMode] = useState<Mode>("slide");
  const [split, setSplit] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const target = useRef<Promise<ImageData> | null>(null);
  const diffCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setPreview(code), 150);
    return () => clearTimeout(timer);
  }, [code]);

  // live match: render the code, compare with the target
  useEffect(() => {
    let current = true;
    target.current ??= loadTarget(challenge.target, width, height);
    Promise.all([renderCode(preview, width, height), target.current])
      .then(([output, goal]) => current && setMatch(compare(output, goal)))
      .catch(() => current && setUnsupported(true));
    return () => {
      current = false;
    };
  }, [preview, challenge.target, width, height]);

  useEffect(() => {
    if (mode === "diff" && match) diffCanvas.current?.getContext("2d")?.putImageData(match.diff, 0, 0);
  }, [mode, match]);

  const copy = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopied(color);
      setTimeout(() => setCopied((c) => (c === color ? null : c)), 1200);
    } catch {
      // clipboard blocked: the colour is still visible in the tooltip
    }
  };

  const reset = () => {
    if (code !== starter && !window.confirm(t.resetConfirm)) return;
    setCode(starter);
  };

  const accuracy = match ? formatAccuracy(match.accuracy) : null;
  const perfect = match?.accuracy === 1;
  const barColor = !match
    ? "bg-bg-surface"
    : perfect
      ? "bg-success"
      : match.accuracy >= 0.9
        ? "bg-primary"
        : match.accuracy >= 0.5
          ? "bg-warning"
          : "bg-accent";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
      {/* Editor */}
      <section className="flex h-[22rem] flex-col overflow-hidden rounded-xl border border-border-default bg-[#181825] lg:sticky lg:top-20 lg:h-[calc(100dvh-7rem)]">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2">
          <h2 className="text-sm font-bold">{t.editor}</h2>
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            <span>
              <span className="font-mono text-text-secondary">{code.length}</span> {t.chars}
            </span>
            <button type="button" onClick={reset} className="rounded px-2 py-1 transition hover:bg-bg-surface hover:text-text-primary">
              {t.reset}
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <CodeEditor value={code} onChange={setCode} label={t.editorLabel} />
        </div>
      </section>

      {/* Output, target, match */}
      <div className="grid content-start gap-5 sm:grid-cols-2 lg:w-[400px] lg:grid-cols-1 2xl:w-[820px] 2xl:grid-cols-2">
        <section className="rounded-xl border border-border-default bg-bg-elevated p-4 sm:col-span-2 lg:col-span-1 2xl:col-span-2" aria-live="polite">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-text-secondary">{t.match}</p>
              <p className={`font-mono text-3xl font-bold ${perfect ? "text-success" : "text-text-primary"}`} dir="ltr">
                {unsupported ? "—" : accuracy === null ? "…" : `${accuracy}%`}
              </p>
            </div>
            <div className="text-end">
              <p className="text-sm text-text-secondary">{t.chars}</p>
              <p className="font-mono text-xl font-bold" dir="ltr">{code.length}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-surface" dir="ltr">
            <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${(match?.accuracy ?? 0) * 100}%` }} />
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            {unsupported ? t.unsupported : perfect ? <span className="font-bold text-success">{t.perfect}</span> : t.estimate}
          </p>
          <button type="button" disabled className="mt-3 w-full cursor-not-allowed rounded-lg bg-bg-surface py-2.5 text-sm font-bold text-text-tertiary">
            {t.submitSoon}
          </button>
        </section>
        <Panel
          title={t.output}
          aside={
            <div className="flex gap-1 rounded-md bg-bg-surface p-0.5 text-xs" role="group" aria-label={t.compareLabel}>
              {(["slide", "diff"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={`rounded px-2 py-1 transition ${mode === m ? "bg-primary font-bold text-on-primary" : "text-text-secondary hover:text-text-primary"}`}
                >
                  {m === "slide" ? t.slide : t.diff}
                </button>
              ))}
            </div>
          }
        >
          <Canvas width={width} height={height}>
            {(scale) => (
              <div
                className={`relative h-full w-full ${mode === "slide" ? "cursor-col-resize touch-pan-y" : ""}`}
                onPointerMove={(e) => {
                  if (mode !== "slide") return;
                  const box = e.currentTarget.getBoundingClientRect();
                  setSplit(Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)));
                }}
                onPointerLeave={() => setSplit(null)}
              >
                <iframe
                  title={t.output}
                  srcDoc={previewDocument(preview)}
                  sandbox=""
                  tabIndex={-1}
                  className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
                  style={{ width, height, transform: `scale(${scale})` }}
                />
                {mode === "slide" && split !== null && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- exact pixels, never resized by the optimizer */}
                    <img
                      src={challenge.target}
                      alt=""
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      style={{ clipPath: `inset(0 0 0 ${split * 100}%)` }}
                    />
                    <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-gold shadow-[0_0_8px] shadow-gold" style={{ left: `${split * 100}%` }} />
                  </>
                )}
                {mode === "diff" && (
                  <>
                    <span className="absolute inset-0 bg-bg-base/75" />
                    <canvas ref={diffCanvas} width={width} height={height} aria-label={t.diffLabel} className="absolute inset-0 h-full w-full" />
                  </>
                )}
              </div>
            )}
          </Canvas>
          {mode === "slide" && (
            <label className="mt-2 grid gap-1 text-xs text-text-tertiary">
              <span>{t.slideHint}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={split === null ? 100 : Math.round(split * 100)}
                onChange={(e) => setSplit(Number(e.target.value) / 100)}
                onBlur={() => setSplit(null)}
                dir="ltr"
                className="w-full accent-gold"
              />
            </label>
          )}
          {mode === "diff" && <p className="mt-2 text-xs text-text-tertiary">{t.diffHint}</p>}
        </Panel>

        <Panel title={t.target} aside={<span className="font-mono text-xs text-text-tertiary" dir="ltr">{width}×{height}</span>}>
          <Canvas width={width} height={height}>
            {() => (
              // eslint-disable-next-line @next/next/no-img-element -- exact pixels, never resized by the optimizer
              <img src={challenge.target} alt={t.targetAlt} width={width} height={height} className="h-full w-full" />
            )}
          </Canvas>
          <div className="mt-3">
            <p className="mb-2 text-xs text-text-tertiary">{t.colors}</p>
            <ul className="flex flex-wrap gap-2" dir="ltr">
              {challenge.colors.map((color) => (
                <li key={color}>
                  <button
                    type="button"
                    onClick={() => copy(color)}
                    title={t.copy}
                    className="flex items-center gap-2 rounded-full border border-border-default bg-bg-surface py-1 ps-1 pe-3 font-mono text-xs transition hover:border-primary"
                  >
                    <span className="size-5 rounded-full border border-border-strong" style={{ background: color }} />
                    {copied === color ? <span className="text-success">{t.copied}</span> : color}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

      </div>
    </div>
  );
}

function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-border-default bg-bg-elevated p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * A box with the challenge's aspect ratio, at most MAX_DISPLAY wide. Children
 * get the scale from the challenge's real size to the box's current size.
 */
function Canvas({ width, height, children }: { width: number; height: number; children: (scale: number) => ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(Math.min(1, MAX_DISPLAY / width));

  useEffect(() => {
    const el = box.current!;
    const observer = new ResizeObserver(() => setScale(el.clientWidth / width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={box}
      dir="ltr"
      className="relative mx-auto w-full overflow-hidden rounded-lg ring-1 ring-border-subtle"
      style={{ maxWidth: Math.min(width, MAX_DISPLAY), aspectRatio: `${width} / ${height}` }}
    >
      {children(scale)}
    </div>
  );
}
