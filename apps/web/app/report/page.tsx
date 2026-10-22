import type { Metadata } from "next";
import Link from "next/link";
import {
  Badge,
  CopyButton,
  Panel,
  PanelHeader,
  StatusBadge,
  buttonClasses,
} from "@conform/ui";
import {
  decodeShareSummary,
  formatTimestamp,
  type ShareSummary,
} from "@conform/chain";
import { SiteHeader } from "@/components/site-header";
import {
  AlertIcon,
  ArrowRight,
  ArrowUpRight,
  ReceiptIcon,
  ShieldIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Shared conformance report",
  description:
    "A compact, non-secret BOT Chain ERC-4337 conformance summary shared from Conform.",
  robots: {
    index: false,
    follow: false,
  },
};

function statusValue(
  status: ShareSummary["result"],
): "pass" | "warn" | "fail" | "skip" {
  switch (status) {
    case "passed":
      return "pass";
    case "attention":
      return "warn";
    case "failed":
      return "fail";
    case "incomplete":
      return "skip";
  }
}

function statusLabel(status: ShareSummary["result"]): string {
  switch (status) {
    case "passed":
      return "Passed";
    case "attention":
      return "Attention";
    case "failed":
      return "Failed";
    case "incomplete":
      return "Incomplete";
  }
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.d) ? params.d[0] : params.d;
  const summary = raw ? decodeShareSummary(raw) : null;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell py-10 lg:py-16">
        {!summary ? (
          <div className="mx-auto max-w-xl">
            <Panel className="overflow-hidden">
              <div className="border-b border-line px-6 py-8 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-lg border border-line-strong bg-elevated text-muted">
                  <ReceiptIcon className="size-5" />
                </div>
                <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.03em] text-paper">
                  {raw ? "This share link is invalid" : "No shared report"}
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-[12px] leading-5 text-muted">
                  {raw
                    ? "The encoded summary is malformed, truncated, or from an unsupported version. Ask for a new link."
                    : "Open a Conform share link, or create your own summary from a completed run."}
                </p>
              </div>
              <div className="flex flex-col justify-center gap-2 px-6 py-5 sm:flex-row">
                <Link
                  href="/console"
                  className={buttonClasses({ variant: "primary", size: "md" })}
                >
                  Open the console
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/console?demo=1"
                  className={buttonClasses({ variant: "secondary", size: "md" })}
                >
                  Open demo console
                </Link>
              </div>
            </Panel>
          </div>
        ) : (
          <div className="mx-auto max-w-[1040px]">
            <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mono-label">Shared conformance summary</div>
                <h1 className="mt-2 text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.03] tracking-[-0.045em] text-paper">
                  {summary.network.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={statusValue(summary.result)}
                    label={statusLabel(summary.result)}
                  />
                  <Badge tone={summary.source === "demo" ? "amber" : "outline"} dot>
                    {summary.source === "demo" ? "Demo summary" : "Live summary"}
                  </Badge>
                  <Badge tone="outline">Chain {summary.network.chainId}</Badge>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted/60">
                  Generated
                </div>
                <div className="mt-1 font-mono text-[10px] text-paper/65">
                  {formatTimestamp(summary.generatedAt)} UTC
                </div>
                <div className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted/50">
                  {summary.product} v1 / {summary.v}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber/20 bg-amber/[0.035] px-4 py-3">
              <AlertIcon className="mt-0.5 size-3.5 shrink-0 text-amber" />
              <p className="text-[10.5px] leading-4.5 text-paper/65">
                This summary is self-contained in the URL and is not signed. It
                can be altered by anyone. Use the full JSON and the linked
                explorer when you need stronger evidence.
              </p>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              <Panel className="overflow-hidden">
                <PanelHeader
                  title="Check result"
                  description="Counts come from the sampled checks recorded by the sharing console."
                />
                <div className="grid grid-cols-5 border-b border-line">
                  {[
                    ["Pass", summary.counts.pass, "text-lime"],
                    ["Warn", summary.counts.warn, "text-amber"],
                    ["Fail", summary.counts.fail, "text-coral"],
                    ["Skip", summary.counts.skip, "text-muted"],
                    ["Unknown", summary.counts.unknown, "text-amber"],
                  ].map(([label, value, tone]) => (
                    <div
                      key={String(label)}
                      className="border-r border-line px-2 py-3 last:border-r-0 sm:px-4"
                    >
                      <div className={`tabular text-[19px] font-semibold ${tone}`}>
                        {value}
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/60">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-px bg-line sm:grid-cols-2">
                  <div className="bg-panel px-4 py-3.5">
                    <div className="mono-label">UserOperation</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          summary.userOperation?.confirmedOnChain
                            ? "lime"
                            : summary.userOperation
                              ? "amber"
                              : "outline"
                        }
                      >
                        {summary.userOperation?.status ?? "Not attempted"}
                      </Badge>
                      {summary.userOperation?.confirmedOnChain ? (
                        <span className="text-[10px] text-lime">
                          Receipt confirmed
                        </span>
                      ) : summary.userOperation ? (
                        <span className="text-[10px] text-amber">
                          Not confirmed on chain
                        </span>
                      ) : null}
                    </div>
                    {summary.userOperation?.userOpHash ? (
                      <div className="mt-2 flex items-center gap-1.5">
                        <code className="font-mono text-[9px] text-muted">
                          {summary.userOperation.userOpHash}
                        </code>
                        <CopyButton
                          value={summary.userOperation.userOpHash}
                          compact
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="bg-panel px-4 py-3.5">
                    <div className="mono-label">Sponsorship</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge tone="amber" dot>
                        {summary.sponsorship}
                      </Badge>
                      <span className="text-[10px] text-muted">
                        {summary.sponsorship === "unknown"
                          ? "Not inferred from configuration"
                          : "Configured, not proven"}
                      </span>
                    </div>
                    <p className="mt-2 text-[9.5px] leading-4 text-muted/70">
                      A successful sponsored UserOperation is required to prove
                      a paymaster policy.
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel className="p-4">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="size-4 text-lime" />
                  <span className="text-[11.5px] font-medium text-paper">
                    What this page includes
                  </span>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {[
                    "Stage and check statuses at the time of sharing.",
                    "Short operation and transaction hashes, when present.",
                    "Failure summaries, capped at five entries.",
                    "Explicit limits and official BOT Chain links.",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[10px] leading-4 text-muted"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-lime/70" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-line pt-3">
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted/55">
                    Not included
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-muted">
                    Private keys, seed phrases, signatures, raw payloads, or
                    endpoint credentials.
                  </p>
                </div>
              </Panel>
            </div>

            <Panel className="mt-3 overflow-hidden">
              <PanelHeader title="Recorded checks" />
              <div>
                {summary.checks.length > 0 ? (
                  summary.checks.map((check, index) => (
                    <div
                      key={`${check.stage}-${check.label}-${index}`}
                      className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
                    >
                      <StatusBadge status={check.status} />
                      <span className="min-w-0 flex-1 truncate text-[11px] text-paper/75">
                        {check.label}
                      </span>
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted/50">
                        {check.stage}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-[11px] text-muted">
                    No individual checks were included in this summary.
                  </div>
                )}
              </div>
            </Panel>

            {summary.failures.length > 0 ? (
              <Panel className="mt-3 overflow-hidden border-coral/20">
                <PanelHeader
                  title="Failure summaries"
                  description="Sanitized to the first five entries. Read the full report before treating any failure as fully diagnosed."
                />
                <div className="divide-y divide-line">
                  {summary.failures.map((failure, index) => (
                    <div key={`${failure.stage}-${index}`} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="coral">{failure.stage}</Badge>
                        {failure.code ? (
                          <Badge tone="coral" className="font-mono">
                            {failure.code}
                          </Badge>
                        ) : null}
                        {failure.method ? (
                          <code className="font-mono text-[8.5px] text-muted/60">
                            {failure.method}
                          </code>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[11px] leading-4.5 text-paper/70">
                        {failure.message}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-muted">
                        Next: {failure.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Panel className="p-4">
                <div className="mono-label">Official links</div>
                <div className="mt-2.5 space-y-2">
                  {[
                    ["BOT Chain", summary.links.botChain],
                    ["Explorer", summary.links.explorer],
                    ["Developer docs", summary.links.developerDocs],
                  ].map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5 text-[10.5px] text-muted transition-colors hover:text-lime"
                    >
                      {label}
                      <ArrowUpRight className="size-3" />
                    </a>
                  ))}
                </div>
              </Panel>

              <Panel className="p-4">
                <div className="mono-label">Run your own checks</div>
                <p className="mt-2.5 text-[10.5px] leading-4.5 text-muted">
                  Shared summaries are claims. Run the console against the
                  current BOT Chain testnet state to capture your own evidence.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/console"
                    className={buttonClasses({
                      variant: "primary",
                      size: "sm",
                    })}
                  >
                    Open console
                    <ArrowRight className="size-3" />
                  </Link>
                  <Link
                    href="/console?demo=1"
                    className={buttonClasses({
                      variant: "secondary",
                      size: "sm",
                    })}
                  >
                    Open demo
                  </Link>
                </div>
              </Panel>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
