import Link from "next/link";
import { Badge, ConformLogo } from "@conform/ui";
import { ArrowUpRight } from "@/components/icons";

export function ConsoleHeader({ demoMode }: { demoMode: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
            aria-label="Conform home"
          >
            <span className="hidden sm:inline-flex">
              <ConformLogo />
            </span>
            <span className="inline-flex sm:hidden">
              <ConformLogo compact />
            </span>
          </Link>
          <span className="hidden h-5 w-px bg-line-strong sm:block" />
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-muted sm:inline">
            Conformance console
          </span>
          <Badge tone={demoMode ? "amber" : "lime"} dot className="sm:hidden">
            {demoMode ? "Demo" : "Live"}
          </Badge>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white/[0.025] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted lg:inline-flex">
            <span className="size-1.5 rounded-full bg-lime" />
            BOT testnet · 968
          </span>
          <Link
            href="/"
            className="hidden rounded px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime sm:block"
          >
            Public site
          </Link>
          <a
            href="https://dev-docs.botchain.ai/"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden items-center gap-1 rounded px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime sm:inline-flex"
          >
            Docs
            <ArrowUpRight className="size-3" />
          </a>
          {demoMode ? (
            <Badge tone="amber" dot>
              Demo mode
            </Badge>
          ) : (
            <Badge tone="outline">Live checks</Badge>
          )}
        </div>
      </div>
    </header>
  );
}
