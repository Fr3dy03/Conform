"use client";

import Link from "next/link";
import {
  Badge,
  Button,
  CopyButton,
  Panel,
  Spinner,
  StatusBadge,
  StatusDot,
  cn,
} from "@conform/ui";
import {
  formatTimestamp,
  type CheckResult,
  type DiagnosticStage,
} from "@conform/chain";
import {
  AlertIcon,
  ArrowRight,
  RouteIcon,
  ShieldIcon,
} from "@/components/icons";
import { runStatusCopy, stageAggregate } from "@/lib/presentation";
import type { ConsoleController } from "@/lib/use-console";
import { ConsoleSection } from "./console-section";
import { FailureLink } from "./failure-card";

const stageCards: Array<{
  stage: DiagnosticStage;
  label: string;
  href: string;
  note: string;
}> = [
  {
    stage: "network",
    label: "Network",
    href: "#network",
    note: "RPC identity",
  },
  {
    stage: "bundler",
    label: "Bundler",
    href: "#bundler",
    note: "Method surface",
  },
  {
    stage: "contracts",
    label: "Contracts",
    href: "#contracts",
    note: "Bytecode & interfaces",
  },
  {
    stage: "account",
    label: "Account",
    href: "#user-operation",
    note: "Derivation & funding",
  },
  {
    stage: "sponsorship",
    label: "Sponsorship",
    href: "#sponsorship",
    note: "Paymaster policy",
  },
];

function failureHref(check: CheckResult): string {
  switch (check.stage) {
    case "network":
      return "#network";
    case "bundler":
      return "#bundler";
    case "contracts":
      return "#contracts";
    case "account":
      return "#user-operation";
    case "sponsorship":
      return "#sponsorship";
  }
}

function statusTone(
  status: "passed" | "attention" | "failed" | "incomplete",
): "lime" | "amber" | "coral" | "neutral" {
  switch (status) {
    case "passed":
      return "lime";
    case "attention":
      return "amber";
    case "failed":
      return "coral";
    case "incomplete":
      return "neutral";
  }
}

export function Overview({ controller }: { controller: ConsoleController }) {
  const { run, summary, running, demoMode, initialConfig, owner } = controller;
  const copy = run ? runStatusCopy(summary?.status ?? "incomplete") : null;
  const reviewChecks =
    run?.checks
      .filter((check) => check.status === "fail" || check.status === "warn" || check.status === "unknown")
      .slice(0, 3) ?? [];

  return (
    <ConsoleSection
      id="overview"
      eyebrow="00 / Summary"
      title="Conformance overview"
      description="One trace across the network, bundler, contracts, account, and receipt path."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={demoMode ? "amber" : "outline"} dot>
            {demoMode ? "Demo mode" : "Live mode"}
          </Badge>
          {summary ? <StatusBadge status={summary.status === "passed" ? "pass" : summary.status === "failed" ? "fail" : summary.status === "attention" ? "warn" : "skip"} /> : null}
        </div>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_304px]">
        <Panel className="overflow-hidden">
          {!run ? (
            <div className="relative overflow-hidden px-6 py-12 sm:px-10 sm:py-16">
              <div
                className="pointer-events-none absolute inset-0 diagram-grid opacity-[0.18] [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_65%)]"
                aria-hidden="true"
              />
              <div className="relative max-w-xl">
                <div className="flex size-10 items-center justify-center rounded-lg border border-line-strong bg-elevated text-lime">
                  <RouteIcon className="size-5" />
                </div>
                <h3 className="mt-5 text-[24px] font-semibold tracking-[-0.03em] text-paper">
                  Start a conformance run.
                </h3>
                <p className="mt-2 max-w-md text-[12.5px] leading-5 text-muted">
                  Run the live testnet checks or load demo data. No wallet is
                  needed for infrastructure checks.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="primary"
                    onClick={controller.runLiveChecks}
                    loading={running}
                    icon={running ? undefined : <ArrowRight className="size-4" />}
                  >
                    {running ? "Running live checks" : "Run live checks"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={controller.switchToDemo}
                    disabled={running}
                  >
                    Load demo run
                  </Button>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {stageCards.map((card) => (
                    <div
                      key={card.stage}
                      className="rounded border border-line bg-black/10 px-2.5 py-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-line-bright" />
                        <span className="text-[10.5px] font-medium text-paper/70">
                          {card.label}
                        </span>
                      </div>
                      <div className="mt-0.5 pl-3 font-mono text-[8.5px] uppercase tracking-[0.07em] text-muted/55">
                        {card.note}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 flex items-center gap-2 text-[10.5px] text-muted/70">
                  <ShieldIcon className="size-3.5 text-lime/70" />
                  UserOperation success is never inferred before a receipt.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-line p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone(summary?.status ?? "incomplete")} dot>
                    {summary?.status === "passed"
                      ? "Passed"
                      : summary?.status === "attention"
                        ? "Attention"
                        : summary?.status === "failed"
                          ? "Failed"
                          : "Incomplete"}
                  </Badge>
                  <Badge tone={run.source === "demo" ? "amber" : "outline"}>
                    {run.source === "demo" ? "Demo run" : "Live run"}
                  </Badge>
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.08em] text-muted/65">
                    {formatTimestamp(run.finishedAt)} UTC
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-[21px] font-semibold tracking-[-0.03em] text-paper">
                      {copy?.title}
                    </h3>
                    <p className="mt-1.5 max-w-xl text-[12px] leading-5 text-muted">
                      {copy?.body}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={controller.runLiveChecks}
                    loading={running}
                    className="shrink-0"
                  >
                    {running ? "Running" : "Run again"}
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-5 overflow-hidden rounded-md border border-line">
                  {(
                    [
                      ["Pass", summary?.pass ?? 0, "text-lime"],
                      ["Warn", summary?.warn ?? 0, "text-amber"],
                      ["Fail", summary?.fail ?? 0, "text-coral"],
                      ["Skip", summary?.skip ?? 0, "text-muted"],
                      ["Unknown", summary?.unknown ?? 0, "text-amber"],
                    ] satisfies Array<[string, number, string]>
                  ).map(([label, value, tone]) => (
                    <div
                      key={label}
                      className="border-r border-line px-2.5 py-2.5 last:border-r-0 sm:px-3.5"
                    >
                      <div className={cn("tabular text-[17px] font-semibold", tone)}>
                        {value}
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/60">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-line/60">
                    {run.checks.map((check) => (
                      <span
                        key={check.id}
                        title={`${check.label}: ${check.status}`}
                        className={cn(
                          "min-w-[3px] flex-1",
                          check.status === "pass" && "bg-lime/70",
                          check.status === "warn" && "bg-amber/75",
                          check.status === "fail" && "bg-coral/80",
                          check.status === "unknown" && "bg-amber/40",
                          check.status === "skip" && "bg-line-bright/60",
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                    <span>Check trace</span>
                    <span>{run.checks.length} recorded checks</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
                {stageCards.map((card) => {
                  const aggregate = stageAggregate(run.checks, card.stage);
                  return (
                    <a
                      key={card.stage}
                      href={card.href}
                      className="surface-sheen group flex items-start justify-between gap-3 bg-panel px-4 py-3.5 transition-colors hover:bg-elevated"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <StatusDot status={aggregate.status} />
                          <span className="text-[11px] font-medium text-paper/85">
                            {card.label}
                          </span>
                        </div>
                        <div className="mt-0.5 pl-[18px] font-mono text-[8.5px] uppercase tracking-[0.07em] text-muted/55">
                          {aggregate.total > 0
                            ? `${aggregate.pass}/${aggregate.total} ${aggregate.status === "pass" ? "passed" : "review"}`
                            : "Not run"}
                        </div>
                      </div>
                      <ArrowRight className="mt-0.5 size-3.5 text-muted/40 transition-transform group-hover:translate-x-0.5 group-hover:text-lime" />
                    </a>
                  );
                })}
                <a
                  href="#user-operation"
                  className="surface-sheen group flex items-start justify-between gap-3 bg-panel px-4 py-3.5 transition-colors hover:bg-elevated"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <StatusDot
                        status={
                          controller.attempt?.status === "confirmed"
                            ? "pass"
                            : controller.attempt?.status === "failed"
                              ? "fail"
                              : controller.attempt?.status === "pending" ||
                                  controller.attempt?.status === "submitted"
                                ? "warn"
                                : "skip"
                        }
                      />
                      <span className="text-[11px] font-medium text-paper/85">
                        UserOperation
                      </span>
                    </div>
                    <div className="mt-0.5 pl-[18px] font-mono text-[8.5px] uppercase tracking-[0.07em] text-muted/55">
                      {controller.attempt?.status === "confirmed"
                        ? "Receipt verified"
                        : controller.attempt?.status === "pending" ||
                            controller.attempt?.status === "submitted"
                          ? "Awaiting receipt"
                          : controller.attempt?.status === "failed"
                            ? "Failed"
                            : "Not submitted"}
                    </div>
                  </div>
                  <ArrowRight className="mt-0.5 size-3.5 text-muted/40 transition-transform group-hover:translate-x-0.5 group-hover:text-lime" />
                </a>
              </div>

              {reviewChecks.length > 0 ? (
                <div className="border-t border-line bg-black/10 px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="mono-label">Needs review</span>
                    <span className="font-mono text-[8.5px] text-muted/55">
                      earliest first
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {reviewChecks.map((check) => (
                      <a
                        key={check.id}
                        href={failureHref(check)}
                        className="flex items-center gap-2.5 rounded border border-line/70 bg-panel/40 px-2.5 py-2 transition-colors hover:border-line-bright"
                      >
                        <StatusBadge status={check.status} />
                        <span className="min-w-0 flex-1 truncate text-[11px] text-paper/75">
                          {check.label}
                        </span>
                        <span className="hidden max-w-[280px] truncate font-mono text-[8.5px] text-muted/50 sm:block">
                          {check.summary}
                        </span>
                        <ArrowRight className="size-3 text-muted/50" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel>
            <div className="border-b border-line px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="mono-label">Run context</span>
                <Badge tone={demoMode ? "amber" : "lime"} dot>
                  {demoMode ? "Demo" : "Live"}
                </Badge>
              </div>
            </div>
            <div className="px-4 py-2.5">
              <ContextRow label="Network" value="BOT Chain Testnet" />
              <ContextRow
                label="Chain ID"
                value="968 / 0x3c8"
                mono
              />
              <div className="flex items-start justify-between gap-3 border-b border-line/60 py-2.5">
                <span className="text-[10.5px] text-muted">EntryPoint</span>
                <span className="flex min-w-0 items-center gap-1">
                  <code className="truncate font-mono text-[9.5px] text-paper/70">
                    {initialConfig.entryPoint.slice(0, 10)}…{initialConfig.entryPoint.slice(-6)}
                  </code>
                  <CopyButton value={initialConfig.entryPoint} compact />
                </span>
              </div>
              <ContextRow label="RPC" value={initialConfig.rpcHost} mono />
              <ContextRow
                label="Bundler"
                value={initialConfig.bundlerHost}
                mono
              />
              <ContextRow
                label="Test owner"
                value={
                  owner.trim()
                    ? `${owner.slice(0, 8)}…${owner.slice(-6)}`
                    : "Not set"
                }
                mono
              />
              <ContextRow
                label="Last run"
                value={run ? formatTimestamp(run.finishedAt) : "Not yet"}
              />
            </div>
            <div className="border-t border-line px-4 py-3">
              {running ? (
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <Spinner />
                  Reading BOT Chain testnet…
                </div>
              ) : (
                <div className="grid gap-2">
                  <Button
                    variant={demoMode ? "secondary" : "primary"}
                    size="sm"
                    onClick={controller.runLiveChecks}
                    className="w-full"
                  >
                    {demoMode ? "Switch to live checks" : "Run live checks"}
                  </Button>
                  {demoMode ? (
                    <button
                      type="button"
                      onClick={controller.switchToLive}
                      className="text-[10px] text-muted transition-colors hover:text-paper"
                    >
                      Clear demo state
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={controller.switchToDemo}
                      className="text-[10px] text-muted transition-colors hover:text-paper"
                    >
                      Load demo data instead
                    </button>
                  )}
                </div>
              )}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-start gap-2.5">
              <AlertIcon className="mt-0.5 size-3.5 shrink-0 text-amber" />
              <div>
                <div className="text-[11px] font-medium text-paper/85">
                  Testnet only
                </div>
                <p className="mt-1 text-[10.5px] leading-4.5 text-muted">
                  Pinned to chain 968. BOT Chain mainnet and third-party
                  chains are outside this workspace.
                </p>
                <FailureLink
                  href={initialConfig.docsUrl}
                  label="Account abstraction docs"
                />
              </div>
            </div>
          </Panel>

          {!controller.run?.account && !owner.trim() ? (
            <Link
              href="#user-operation"
              className="group flex items-center justify-between rounded-lg border border-lime/20 bg-lime/[0.035] px-4 py-3 transition-colors hover:bg-lime/[0.06]"
            >
              <div>
                <div className="text-[11px] font-medium text-lime">
                  Account path not included
                </div>
                <p className="mt-0.5 text-[10px] text-paper/55">
                  Add an owner to derive and test the SimpleAccount path.
                </p>
              </div>
              <ArrowRight className="size-4 text-lime transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </ConsoleSection>
  );
}

function ContextRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-b-0">
      <span className="text-[10.5px] text-muted">{label}</span>
      <span
        className={cn(
          "truncate text-right text-[10.5px] text-paper/70",
          mono && "font-mono text-[9.5px]",
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
