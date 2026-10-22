"use client";

import { useEffect, useState } from "react";
import { cn } from "./cn";

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className,
  compact = false,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!copied && !failed) return;
    const timeout = window.setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2_000);
    return () => window.clearTimeout(timeout);
  }, [copied, failed]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded font-mono text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime",
        compact ? "px-1 py-0.5" : "border border-line px-2 py-1 hover:border-line-bright",
        className,
      )}
      aria-live="polite"
      aria-label={copied ? copiedLabel : label}
    >
      <svg
        viewBox="0 0 12 12"
        className="size-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        {copied ? (
          <path d="M2 6.2 4.8 9 10 3.2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="4.2" y="4.2" width="5.8" height="5.8" rx="1" />
            <path d="M2.4 7.4V2.4h5" strokeLinecap="round" />
          </>
        )}
      </svg>
      <span>{failed ? "Copy failed" : copied ? copiedLabel : label}</span>
    </button>
  );
}
