"use client";

import {
  Badge,
  CopyButton,
  Panel,
  PanelHeader,
  StatusBadge,
} from "@conform/ui";
import type { CheckResult, ContractSnapshot } from "@conform/chain";
import type { ConsoleController } from "@/lib/use-console";
import {
  aggregateChecks,
  checksForStage,
  explorerAddressUrl,
} from "@/lib/presentation";
import { ArrowUpRight } from "@/components/icons";
import { ConsoleSection } from "./console-section";
import { CheckList } from "./check-row";

interface ContractCard {
  id: string;
  label: string;
  role: string;
  address: string;
  snapshot?: ContractSnapshot["entryPoint"];
}

export function ContractsSection({
  controller,
}: {
  controller: ConsoleController;
}) {
  const checks = controller.run
    ? checksForStage(controller.run.checks, "contracts")
    : [];
  const aggregate = aggregateChecks(checks);
  const contracts = controller.run?.contracts;
  const cards: ContractCard[] = [
    {
      id: "contracts.entrypoint",
      label: "EntryPoint v0.7",
      role: "UserOperation entry",
      address: controller.initialConfig.entryPoint,
      snapshot: contracts?.entryPoint,
    },
    {
      id: "contracts.factory",
      label: "SimpleAccountFactory",
      role: "Counterfactual derivation",
      address: controller.initialConfig.factory,
      snapshot: contracts?.factory,
    },
    {
      id: "contracts.implementation",
      label: "SimpleAccount implementation",
      role: "Account logic",
      address: controller.initialConfig.implementation,
      snapshot: contracts?.implementation,
    },
  ];

  return (
    <ConsoleSection
      id="contracts"
      eyebrow="03 / Contracts"
      title="Contract deployments"
      description="Bytecode and interface evidence for the three addresses on this path."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="outline">
            constants checked {controller.initialConfig.verifiedAt}
          </Badge>
          {checks.length > 0 ? (
            <StatusBadge status={aggregate.status} />
          ) : (
            <Badge tone="outline">Not run</Badge>
          )}
        </div>
      }
    >
      <div className="grid gap-3 lg:grid-cols-3">
        {cards.map((card) => {
          const check = checks.find((entry) => entry.id === card.id);
          return (
            <Panel key={card.id} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <div className="text-[11.5px] font-medium text-paper">
                    {card.label}
                  </div>
                  <div className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted/60">
                    {card.role}
                  </div>
                </div>
                {check ? (
                  <StatusBadge status={check.status} />
                ) : (
                  <Badge tone="outline">Not run</Badge>
                )}
              </div>
              <div className="px-4 py-3">
                <div className="flex items-start gap-1.5">
                  <code className="min-w-0 flex-1 break-all font-mono text-[10px] leading-4.5 text-paper/65">
                    {card.address}
                  </code>
                  <CopyButton value={card.address} compact />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                      Code size
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-paper/70">
                      {card.snapshot
                        ? card.snapshot.deployed
                          ? `${card.snapshot.codeSize.toLocaleString("en-US")} bytes`
                          : "No bytecode"
                        : "—"}
                    </div>
                  </div>
                  <a
                    href={explorerAddressUrl(
                      controller.initialConfig.network.explorerUrl,
                      card.address,
                    )}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-[9.5px] text-muted transition-colors hover:text-lime"
                  >
                    Explorer
                    <ArrowUpRight className="size-2.5" />
                  </a>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Deployment checks"
          description="Checks bytecode, factory resolution, and the EntryPoint v0.7 interface."
          actions={
            <Badge tone={controller.run?.source === "demo" ? "amber" : "lime"} dot>
              {controller.run?.source === "demo" ? "Demo" : "Live"}
            </Badge>
          }
        />
        <ContractCheckList checks={checks} />
      </Panel>

      <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-panel/40 px-4 py-3">
        <p className="text-[10.5px] leading-4.5 text-muted">
          Bytecode presence is not source verification. Addresses are pinned to
          the BOT Chain account-abstraction documentation and the workspace
          configuration.
        </p>
        <a
          href={controller.initialConfig.docsUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="shrink-0 text-[10px] text-lime hover:text-[#ddff99]"
        >
          Address docs ↗
        </a>
      </div>
    </ConsoleSection>
  );
}

function ContractCheckList({ checks }: { checks: CheckResult[] }) {
  if (checks.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <div className="mx-auto mb-2 size-1.5 rounded-full bg-line-bright" />
        <p className="text-[12px] font-medium text-paper/70">
          No deployment checks yet
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Run the live checks to inspect bytecode, factory resolution, and the
          EntryPoint interface.
        </p>
      </div>
    );
  }
  return <CheckList checks={checks} />;
}
