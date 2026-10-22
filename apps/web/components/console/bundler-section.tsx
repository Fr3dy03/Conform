"use client";

import {
  Badge,
  CopyButton,
  Panel,
  PanelHeader,
  StatusBadge,
} from "@conform/ui";
import {
  BOT_BUNDLER_EXTENSION,
  REQUIRED_BUNDLER_METHODS,
} from "@conform/chain";
import type { ConsoleController } from "@/lib/use-console";
import {
  aggregateChecks,
  checksForStage,
} from "@/lib/presentation";
import { ConsoleSection, Metric, MetricGrid } from "./console-section";
import { CheckRow } from "./check-row";

const expectedMethods = [
  ...REQUIRED_BUNDLER_METHODS.map((method) => ({
    method,
    required: true as const,
  })),
  { method: BOT_BUNDLER_EXTENSION, required: false as const },
];

export function BundlerSection({
  controller,
}: {
  controller: ConsoleController;
}) {
  const checks = controller.run
    ? checksForStage(controller.run.checks, "bundler")
    : [];
  const methodChecks = checks.filter((check) =>
    check.id.startsWith("bundler.method."),
  );
  const aggregate = aggregateChecks(checks);
  const snapshot = controller.run?.bundler;
  const requiredChecks = methodChecks.filter((check) =>
    (REQUIRED_BUNDLER_METHODS as readonly string[]).includes(
      check.method ?? "",
    ),
  );
  const requiredPass = requiredChecks.filter(
    (check) => check.status === "pass",
  ).length;
  const entryPointSupported = snapshot
    ? snapshot.supportedEntryPoints.some(
        (entry) =>
          entry.toLowerCase() ===
          controller.initialConfig.entryPoint.toLowerCase(),
      )
    : undefined;

  return (
    <ConsoleSection
      id="bundler"
      eyebrow="02 / Bundler"
      title="Bundler surface"
      description="Check the bundler chain, EntryPoint support, and the methods this path calls."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="outline">{controller.initialConfig.bundlerHost}</Badge>
          {checks.length > 0 ? (
            <StatusBadge status={aggregate.status} />
          ) : (
            <Badge tone="outline">Not run</Badge>
          )}
        </div>
      }
    >
      <Panel className="overflow-hidden">
        <PanelHeader
          title="BOT Chain bundler"
          description={
            controller.run?.source === "demo"
              ? "Demo method matrix. No live bundler request was made."
              : "Each method is probed without submitting a valid UserOperation."
          }
          actions={
            <div className="flex items-center gap-2">
              <Badge
                tone={controller.run?.source === "demo" ? "amber" : "lime"}
                dot
              >
                {controller.run?.source === "demo" ? "Demo" : "Live"}
              </Badge>
              <CopyButton value={controller.initialConfig.bundlerHost} />
            </div>
          }
        />
        <MetricGrid>
          <Metric
            label="Bundler chain"
            value={
              snapshot
                ? `${snapshot.chainId} · ${snapshot.chainIdHex}`
                : "Awaiting run"
            }
            mono
            tone={
              snapshot
                ? snapshot.chainId === 968
                  ? "positive"
                  : "negative"
                : "default"
            }
          />
          <Metric
            label="EntryPoint v0.7"
            value={
              entryPointSupported === undefined
                ? "Awaiting run"
                : entryPointSupported
                  ? "Supported"
                  : "Not listed"
            }
            tone={
              entryPointSupported === undefined
                ? "default"
                : entryPointSupported
                  ? "positive"
                  : "warning"
            }
          />
          <Metric
            label="Required methods"
            value={
              methodChecks.length > 0
                ? `${requiredPass}/${REQUIRED_BUNDLER_METHODS.length} present`
                : "Awaiting run"
            }
            mono
            tone={
              methodChecks.length > 0 && requiredPass === REQUIRED_BUNDLER_METHODS.length
                ? "positive"
                : methodChecks.length > 0
                  ? "warning"
                  : "default"
            }
          />
          <Metric
            label="Probe duration"
            value={snapshot ? `${snapshot.latencyMs} ms` : "Awaiting run"}
            mono
            hint={
              snapshot
                ? `${snapshot.methods.filter((method) => method.present).length} methods observed`
                : undefined
            }
          />
        </MetricGrid>

        <div className="border-b border-line bg-black/10 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="mono-label">EntryPoint</span>
              <code className="break-all font-mono text-[9.5px] text-paper/60">
                {controller.initialConfig.entryPoint}
              </code>
            </div>
            <CopyButton value={controller.initialConfig.entryPoint} />
          </div>
        </div>

        <div>
          {expectedMethods.map(({ method, required }) => {
            const check = methodChecks.find((entry) => entry.method === method);
            if (check) return <CheckRow key={method} check={check} />;
            return (
              <div
                key={method}
                className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <Badge tone="outline">Not run</Badge>
                <div className="min-w-0 flex-1">
                  <code className="break-all font-mono text-[10.5px] text-paper/75">
                    {method}
                  </code>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {required ? "Required" : "BOT fee extension · optional"}
                  </p>
                </div>
                <Badge tone={required ? "neutral" : "outline"}>
                  {required ? "Required" : "Optional"}
                </Badge>
              </div>
            );
          })}
          {checks.some((check) => check.id === "bundler.chain-id") ? (
            <div className="border-t border-line px-4 py-3">
              <CheckRow
                check={
                  checks.find((check) => check.id === "bundler.chain-id")!
                }
              />
            </div>
          ) : null}
        </div>
      </Panel>

      <div className="rounded-lg border border-amber/20 bg-amber/[0.035] px-4 py-3">
        <p className="text-[10.5px] leading-4.5 text-paper/65">
          <span className="font-medium text-amber">Scope note.</span> A method
          answering a probe shows it exists. This is not a complete ERC-4337
          bundler conformance suite.
        </p>
      </div>
    </ConsoleSection>
  );
}
