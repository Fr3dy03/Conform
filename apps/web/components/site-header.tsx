"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClasses, ConformLogo } from "@conform/ui";

const navigation = [
  { label: "Method", href: "/#method" },
  { label: "Coverage", href: "/#coverage" },
  { label: "Workbench", href: "/#workbench" },
  { label: "Boundaries", href: "/#boundaries" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-xl">
      <div className="border-b border-line/60 bg-black/10">
        <div className="page-shell flex h-7 items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-lime shadow-[0_0_8px_rgba(200,243,106,0.7)]" />
            BOT Chain testnet checks
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <span>Chain 968</span>
            <span className="text-line-bright">/</span>
            <span>EntryPoint v0.7</span>
            <span className="text-line-bright">/</span>
            <span>Receipt required</span>
          </span>
        </div>
      </div>

      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
          aria-label="Conform home"
        >
          <ConformLogo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-[12px] font-medium text-muted transition-colors hover:bg-white/[0.035] hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://dev-docs.botchain.ai/"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded px-3 py-2 text-[12px] font-medium text-muted transition-colors hover:bg-white/[0.035] hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime"
          >
            Docs <span className="ml-0.5 text-[9px]">↗</span>
          </a>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/console?demo=1"
            className="rounded px-3 py-2 text-[12px] font-medium text-muted transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime"
          >
            Demo run
          </Link>
          <Link
            href="/console"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            Open console
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex size-9 items-center justify-center rounded-md border border-line-strong text-paper transition-colors hover:border-line-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime sm:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <svg
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            {open ? (
              <path d="m3 3 10 10M13 3 3 13" strokeLinecap="round" />
            ) : (
              <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="border-t border-line bg-panel px-5 pb-5 pt-3 sm:hidden"
        >
          <nav aria-label="Mobile primary" className="flex flex-col">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line/60 py-3 text-sm text-paper/85 hover:text-lime"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://dev-docs.botchain.ai/"
              target="_blank"
              rel="noreferrer noopener"
              className="border-b border-line/60 py-3 text-sm text-paper/85 hover:text-lime"
            >
              Developer Docs <span className="text-[10px]">↗</span>
            </a>
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/console?demo=1"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "secondary", size: "md" })}
            >
              Demo run
            </Link>
            <Link
              href="/console"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "primary", size: "md" })}
            >
              Console
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
