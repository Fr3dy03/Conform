"use client";

import {
  Badge,
  CopyButton,
  Panel,
  PanelHeader,
  StatusBadge,
} from "@conform/ui";
import {
  EIP7702_DISCLOSURE,
  EOA_PAYMASTER_NOTE,
  SPONSORSHIP_DISCLOSURE,
  formatBot,
} from "@conform/chain";
import { AlertIcon, ArrowUpRight, ShieldIcon } from "@/components/icons";
import type { ConsoleController } from "@/lib/use-console";
import { checksForStage } from "@/lib/presentation";
import { ConsoleSection } from "./console-section";
import { CheckList } from "./check-row";

export function SponsorshipSection({
  controller,
}: {
  controller: ConsoleController;
}) {
  const snapshot = controller.run?.sponsorship;
  const checks = controller.run
    ? checksForStage(controller.run.checks, "sponsorship")
    : [];
  const configured = snapshot?.state === "configured";
  const paymasterAddress = snapshot?.paymasterAddress;

  return (
    <ConsoleSection
      id="sponsorship"
      eyebrow="04 / Sponsorship"
      title="Paymaster boundary"
      description="Sponsorship depends on a paymaster and its policy. This run does not infer it from configuration."
      actions={
        <StatusBadge
          status="unknown"
          label={configured ? "Configured · unproven" : "Unknown"}
        />
      }
    >
      <Panel className="overflow-hidden">
        <PanelHeader
          title="ERC-4337 sponsorship state"
          description="No paymaster fields are added to the guided UserOperation."
          actions={
            <Badge tone="amber" dot>
              {configured ? "Paymaster configured" : "No paymaster configured"}
            </Badge>
          }
        />
        <div className="grid gap-px bg-line lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-panel p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-amber/20 bg-amber/[0.05] text-amber">
                <AlertIcon className="size-4" />
              </div>
              <div>
                <div className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-amber">
                  Sponsorship
                </div>
                <div className="mt-1 text-[25px] font-semibold tracking-[-0.03em] text-paper">
                  {configured ? "Configured" : "Unknown"}
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[11.5px] leading-5 text-muted">
              {snapshot?.disclosure ?? SPONSORSHIP_DISCLOSURE}
            </p>

            {paymasterAddress ? (
              <div className="mt-4 rounded-md border border-line bg-black/20 p-3">
                <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted/60">
                  Configured paymaster
                </div>
                <div className="mt-1 flex items-start gap-2">
                  <code className="min-w-0 flex-1 break-all font-mono text-[9.5px] leading-4 text-paper/65">
                    {paymasterAddress}
                  </code>
                  <CopyButton value={paymasterAddress} compact />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2 font-mono text-[9px] text-muted">
                  <span>
                    code:{" "}
                    <span className={snapshot?.codePresent ? "text-lime" : "text-coral"}>
                      {snapshot?.codePresent ? "present" : "missing"}
                    </span>
                  </span>
                  <span>
                    deposit:{" "}
                    <span className="text-paper/70">
                      {snapshot?.deposit
                        ? `${formatBot(snapshot.deposit)} BOT`
                        : "unknown"}
                    </span>
                  </span>
                </div>
              </div>
            ) : null}

            <a
              href={controller.initialConfig.docsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-1.5 text-[10.5px] font-medium text-lime hover:text-[#ddff99]"
            >
              BOT Chain account-abstraction docs
              <ArrowUpRight className="size-3" />
            </a>
          </div>

          <div className="bg-panel p-5">
            <div className="flex items-center gap-2">
              <ShieldIcon className="size-3.5 text-lime" />
              <span className="text-[11.5px] font-medium text-paper/85">
                Why Conform does not infer a pass
              </span>
            </div>
            <ul className="mt-3 space-y-2.5">
              {[
                "A deployed paymaster can reject every request through its validation policy.",
                "An EntryPoint deposit can exist while the paymaster rejects this sender, call, or time window.",
                "A public BOT Chain ERC-4337 paymaster is not assumed unless independently verified.",
                "A configured paymaster can be inspected, but its policy requires a sponsored operation to prove.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[10.5px] leading-4.5 text-muted"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber/70" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded border border-line bg-black/15 px-3 py-2.5">
              <p className="text-[10px] leading-4 text-paper/60">
                Unknown is a deliberate report state, not a failed check. It
                never changes a UserOperation receipt claim.
              </p>
            </div>
          </div>
        </div>

        {checks.length > 0 ? (
          <div className="border-t border-line">
            <div className="border-b border-line bg-black/10 px-4 py-2.5">
              <span className="mono-label">Recorded sponsorship checks</span>
            </div>
            <CheckList checks={checks} />
          </div>
        ) : null}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel/45 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11.5px] font-medium text-paper">
              EOA Paymaster
            </div>
            <Badge tone="outline">Different flow</Badge>
          </div>
          <p className="mt-2 text-[10.5px] leading-4.5 text-muted">
            {EOA_PAYMASTER_NOTE}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel/45 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11.5px] font-medium text-paper">
              EIP-7702
            </div>
            <Badge tone="outline">Outside v0.7 path</Badge>
          </div>
          <p className="mt-2 text-[10.5px] leading-4.5 text-muted">
            {EIP7702_DISCLOSURE}
          </p>
        </div>
      </div>
    </ConsoleSection>
  );
}
