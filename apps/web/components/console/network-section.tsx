"use client";

import {
  Badge,
  CopyButton,
  Panel,
  PanelHeader,
  StatusBadge,
} from "@conform/ui";
import { formatTimestamp } from "@conform/chain";
import type { ConsoleController } from "@/lib/use-console";
import { aggregateChecks } from "@/lib/presentation";
import { ConsoleSection, Metric, MetricGrid } from "./console-section";
import { CheckList } from "./check-row";
import { FailureLink } from "./failure-card";

export function NetworkSection({
  controller,
}: {
  controller: ConsoleController;
}) {
  const checks = controller.run?.checks.filter((check) => check.stage === "network") ?? [];
  const aggregate = aggregateChecks(checks);
  const snapshot = controller.run?.network;

  return (
    <ConsoleSection
      id="network"
      eyebrow="01 / Network"
      title="RPC identity"
      description="Read the chain ID, block height, client, and latency from the configured RPC."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="outline">{controller.initialConfig.rpcHost}</Badge>
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
          title="BOT Chain testnet endpoint"
          description={
            controller.run?.source === "demo"
              ? "Demo values. No live RPC request was made."
              : "Network evidence captured from the server-side RPC relay."
          }
          actions={
            <div className="flex items-center gap-2">
              <Badge tone={controller.run?.source === "demo" ? "amber" : "lime"} dot>
                {controller.run?.source === "demo" ? "Demo" : "Live"}
              </Badge>
              <CopyButton value={controller.initialConfig.rpcHost} />
            </div>
          }
        />
        <MetricGrid>
          <Metric
            label="Chain ID"
            value={snapshot ? `${snapshot.chainId} · ${snapshot.chainIdHex}` : "968 · 0x3c8"}
            mono
            tone={snapshot ? "positive" : "default"}
          />
          <Metric
            label="Latest block"
            value={snapshot ? snapshot.blockNumber.toLocaleString("en-US") : "—"}
            mono
            hint={snapshot?.blockHash ? `${snapshot.blockHash.slice(0, 14)}…` : undefined}
          />
          <Metric
            label="RPC latency"
            value={snapshot ? `${snapshot.latencyMs} ms` : "—"}
            mono
            tone={snapshot && snapshot.latencyMs > 2_500 ? "warning" : "default"}
          />
          <Metric
            label="Client"
            value={snapshot?.clientVersion ?? "Not queried"}
            hint={snapshot ? `Checked ${formatTimestamp(snapshot.checkedAt)}` : undefined}
          />
        </MetricGrid>
        <CheckList
          checks={checks}
          emptyTitle="No network checks yet"
          emptyBody="Run the live checks to verify eth_chainId, block height, client identity, and latency."
        />
      </Panel>

      <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-panel/40 px-4 py-3">
        <p className="text-[10.5px] leading-4.5 text-muted">
          Chain identity is read from both the RPC and the bundler. A mismatch
          fails the run.
        </p>
        <FailureLink
          href={controller.initialConfig.docsUrl}
          label="Network docs"
        />
      </div>
    </ConsoleSection>
  );
}
