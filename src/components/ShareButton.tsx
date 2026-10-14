"use client";

import { useState, useSyncExternalStore } from "react";

type Props = {
  /** the page being shared, e.g. "/ar/challenges/leaf" */
  path: string;
  /** the message that goes with it */
  text: string;
  t: { button: string; copied: string };
};

const noSubscribe = () => () => {};

/** Share with the device's share sheet, or copy the link; plus X, LinkedIn and WhatsApp */
export function ShareButton({ path, text, t }: Props) {
  const [copied, setCopied] = useState(false);
  // the address the visitor is actually on (known once the page runs in the browser)
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
  const url = origin + path;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return; // they closed the sheet
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  };

  const e = encodeURIComponent;
  const links = [
    { name: "X", href: `https://x.com/intent/post?text=${e(text)}&url=${e(url)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${e(`${text}\n${url}`)}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="share">
      <button
        type="button"
        onClick={share}
        className="rounded-lg border border-secondary/40 px-3 py-1.5 font-semibold text-secondary transition hover:bg-secondary/10"
      >
        <span aria-hidden className="me-1.5">↗</span>
        {copied ? t.copied : t.button}
      </button>
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg px-2 py-1.5 text-text-tertiary transition hover:bg-bg-surface hover:text-text-primary"
        >
          {link.name}
        </a>
      ))}
      <span role="status" className="sr-only">
        {copied ? t.copied : ""}
      </span>
    </div>
  );
}
