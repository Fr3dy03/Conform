"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  Button,
  CopyButton,
  Panel,
  PanelHeader,
  StatusBadge,
} from "@conform/ui";
import {
  buildConformanceReport,
  buildShareSummary,
  decodeShareSummary,
  encodeShareSummary,
  formatTimestamp,
  shareUrlFor,
  type DiagnosticRun,
  type UserOperationAttempt,
} from "@conform/chain";
import {
  AlertIcon,
  ArrowRight,
  ArrowUpRight,
  BracesIcon,
  LockIcon,
  ReceiptIcon,
  ShieldIcon,
} from "@/components/icons";
import type { ConsoleController } from "@/lib/use-console";
import { ConsoleSection } from "./console-section";

interface ShareState {
  url: string;
  encoded: string;
  generatedAt: string;
}

function buildShare(
  run: DiagnosticRun,
  attempt: UserOperationAttempt | null,
  origin: string,
): ShareState {
  const generatedAt = new Date().toISOString();
  const summary = buildShareSummary(run, attempt, generatedAt);
  const encoded = encodeShareSummary(summary);
  if (!decodeShareSummary(encoded)) {
    throw new Error("Share summary failed its round-trip validation");
  }
  return {
    url: shareUrlFor(encoded, origin),
    encoded,
    generatedAt,
  };
}

export function ReportSection({
  controller,
}: {
  controller: ConsoleController;
}) {
  const [share, setShare] = useState<ShareState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { run, attempt, summary } = controller;

  function downloadReport() {
    if (!run) return;
    try {
      const generatedAt = new Date().toISOString();
      const report = buildConformanceReport({
        run,
        userOperation: attempt,
        generatedAt,
      });
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `conform-${run.source}-${generatedAt.replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setError(null);
    } catch {
      setError("The report could not be generated in this browser.");
    }
  }

  function createShareLink() {
    if (!run) return;
    try {
      setShare(buildShare(run, attempt, window.location.origin));
      setError(null);
    } catch {
      setError("The share summary could not be encoded in this browser.");
    }
  }

  return (
    <ConsoleSection
      id="report"
      eyebrow="06 / Report"
      title="Export the report"
      description="Download the timestamped JSON or create a compact share link. Neither includes a private key, seed phrase, or signature."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={controller.demoMode ? "amber" : "outline"} dot>
            {controller.demoMode ? "Demo report" : "Live report"}
          </Badge>
          {summary ? (
            <StatusBadge
              status={
                summary.status === "passed"
                  ? "pass"
                  : summary.status === "failed"
                    ? "fail"
                    : summary.status === "attention"
                      ? "warn"
                      : "skip"
              }
            />
          ) : null}
        </div>
      }
    >
      {!run ? (
        <Panel className="px-6 py-12 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg border border-line-strong bg-elevated text-muted">
            <ReceiptIcon className="size-5" />
          </div>
          <h3 className="mt-4 text-[14px] font-semibold text-paper">
            No run to export
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-[11.5px] leading-5 text-muted">
            Run the live checks or load demo data first. A report is generated
            from recorded evidence, not from an empty console.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              variant="primary"
              size="sm"
              onClick={controller.runLiveChecks}
              loading={controller.running}
            >
              Run live checks
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={controller.switchToDemo}
              disabled={controller.running}
            >
              Load demo
            </Button>
          </div>
        </Panel>
      ) : (
        <>
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Conformance report"
              description={
                controller.demoMode
                  ? "This report is marked as demo data and does not claim an on-chain UserOperation."
                  : "This report reflects the responses and operation state recorded in this session."
              }
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={downloadReport}
                    icon={<BracesIcon className="size-3.5" />}
                  >
                    Download JSON
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={createShareLink}
                    icon={<ReceiptIcon className="size-3.5" />}
                  >
                    Create share link
                  </Button>
                </div>
              }
            />

            <div className="grid gap-px bg-line sm:grid-cols-3">
              <div className="bg-panel p-4">
                <div className="mono-label">Full report</div>
                <p className="mt-2 text-[10.5px] leading-4.5 text-muted">
                  Every sampled check, snapshot, failure, configuration value,
                  and limitation in one JSON object.
                </p>
              </div>
              <div className="bg-panel p-4">
                <div className="mono-label">Share summary</div>
                <p className="mt-2 text-[10.5px] leading-4.5 text-muted">
                  Stage statuses, counts, short hashes, sponsorship state, and
                  up to five failure summaries.
                </p>
              </div>
              <div className="bg-panel p-4">
                <div className="mono-label">Never included</div>
                <p className="mt-2 text-[10.5px] leading-4.5 text-muted">
                  Private keys, seed phrases, raw signatures, RPC credentials,
                  or complete UserOperation payloads.
                </p>
              </div>
            </div>

            <div className="border-t border-line bg-black/10 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-muted">
                <span>
                  Source:{" "}
                  <span className="text-paper/75">
                    {run.source === "demo" ? "Demo run" : "Live run"}
                  </span>
                </span>
                <span>
                  Checks:{" "}
                  <span className="text-paper/75">{run.checks.length}</span>
                </span>
                <span>
                  Failures:{" "}
                  <span className="text-paper/75">{run.failures.length}</span>
                </span>
                <span>
                  Recorded:{" "}
                  <span className="font-mono text-paper/65">
                    {formatTimestamp(run.finishedAt)} UTC
                  </span>
                </span>
              </div>
            </div>
          </Panel>

          {share ? (
            <Panel className="overflow-hidden border-lime/20">
              <div className="flex flex-col gap-3 border-b border-lime/15 bg-lime/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="size-4 text-lime" />
                  <span className="text-[11.5px] font-medium text-lime">
                    Share link created
                  </span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted/60">
                    {formatTimestamp(share.generatedAt)} UTC
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton value={share.url} label="Copy link" />
                  <a
                    href={share.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-lime hover:text-[#ddff99]"
                  >
                    Open
                    <ArrowUpRight className="size-3" />
                  </a>
                </div>
              </div>
              <div className="p-4">
                <code className="block max-h-24 overflow-auto break-all rounded border border-line bg-black/20 px-3 py-2.5 font-mono text-[9px] leading-4 text-paper/55">
                  {share.url}
                </code>
                <div className="mt-3 flex items-start gap-2.5 rounded border border-amber/20 bg-amber/[0.035] px-3 py-2.5">
                  <AlertIcon className="mt-0.5 size-3.5 shrink-0 text-amber" />
                  <p className="text-[10px] leading-4 text-paper/65">
                    The summary is encoded in the URL. It is not signed and can
                    be altered. Treat it as a claim, not proof of a live run.
                  </p>
                </div>
              </div>
            </Panel>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-coral/25 bg-coral/[0.045] px-4 py-3">
              <p className="text-[10.5px] text-coral">{error}</p>
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Report limitations"
                description="These statements ship with the JSON and define what the result does not prove."
              />
              <ul className="divide-y divide-line">
                {[
                  "The report covers BOT Chain testnet, chain ID 968, only.",
                  "Bundler coverage is a method sample, not a complete ERC-4337 compliance suite.",
                  "Sponsorship remains unproven without a successful sponsored UserOperation.",
                  "No private key, seed phrase, signature, or RPC credential is included.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 px-4 py-3 text-[10.5px] leading-4.5 text-muted"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="p-4">
              <div className="flex items-center gap-2">
                <LockIcon className="size-3.5 text-lime" />
                <span className="text-[11.5px] font-medium text-paper">
                  Evidence boundary
                </span>
              </div>
              <p className="mt-2.5 text-[10.5px] leading-4.5 text-muted">
                A submitted UserOperation is not a confirmed one. The report
                records on-chain confirmation only when a live receipt returns
                success=true and the outer transaction succeeded.
              </p>
              <Link
                href="#user-operation"
                className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] font-medium text-lime hover:text-[#ddff99]"
              >
                Review the operation trace
                <ArrowRight className="size-3" />
              </Link>
            </Panel>
          </div>
        </>
      )}
    </ConsoleSection>
  );
}
