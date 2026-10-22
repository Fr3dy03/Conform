"use client";

import {
  Badge,
  Button,
  Callout,
  StatusBadge,
  cn,
} from "@conform/ui";
import {
  BOT_CHAIN_TESTNET,
  type PublicConfig,
} from "@conform/chain";
import { AlertIcon, ShieldIcon, XIcon } from "@/components/icons";
import { useConsole } from "@/lib/use-console";
import { ConsoleHeader } from "./console-header";
import { ConsoleMobileNav, ConsoleSidebar } from "./console-nav";
import { Overview } from "./overview";
import { NetworkSection } from "./network-section";
import { BundlerSection } from "./bundler-section";
import { ContractsSection } from "./contracts-section";
import { UserOperationSection } from "./userop-section";
import { SponsorshipSection } from "./sponsorship-section";
import { ReportSection } from "./report-section";

export function ConsoleWorkbench({
  publicConfig,
  configError,
  initialDemo,
}: {
  publicConfig: PublicConfig;
  configError: string | null;
  initialDemo: boolean;
}) {
  const controller = useConsole(publicConfig, configError, initialDemo);

  return (
    <div className="min-h-dvh bg-ink">
      <ConsoleHeader demoMode={controller.demoMode} />

      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
        <ConsoleMobileNav controller={controller} />

        <div className="flex gap-7 py-6 lg:py-8">
          <ConsoleSidebar controller={controller} />

          <main id="main-content" className="min-w-0 flex-1 space-y-9">
            <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mono-label">BOT Chain testnet / run workspace</div>
                <h1 className="mt-2 text-[clamp(1.6rem,3vw,2.15rem)] font-semibold tracking-[-0.035em] text-paper">
                  Conformance console
                </h1>
                <p className="mt-1 max-w-2xl text-[12px] leading-5 text-muted">
                  Inspect the infrastructure first. Add an owner only when you
                  are ready to derive and test the smart-account path.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="outline">
                  {BOT_CHAIN_TESTNET.name} / {BOT_CHAIN_TESTNET.id}
                </Badge>
                {controller.summary ? (
                  <StatusBadge
                    status={
                      controller.summary.status === "passed"
                        ? "pass"
                        : controller.summary.status === "failed"
                          ? "fail"
                          : controller.summary.status === "attention"
                            ? "warn"
                            : "skip"
                    }
                  />
                ) : (
                  <Badge tone="outline">No run yet</Badge>
                )}
              </div>
            </div>

            {controller.demoMode ? (
              <div className="flex flex-col gap-3 rounded-lg border border-amber/25 bg-amber/[0.045] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <AlertIcon className="mt-0.5 size-4 shrink-0 text-amber" />
                  <div>
                    <div className="text-[11.5px] font-semibold text-amber">
                      Demo mode is active
                    </div>
                    <p className="mt-0.5 text-[10.5px] leading-4 text-paper/65">
                      Every displayed value is labelled demo data. No wallet
                      connection, signature, RPC request, or transaction occurs.
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={controller.switchToLive}
                  className="shrink-0"
                >
                  Switch to live
                </Button>
              </div>
            ) : null}

            {controller.configError ? (
              <Callout
                tone="coral"
                title="Server configuration warning"
                icon={<AlertIcon className="size-4" />}
              >
                {controller.configError} The console is showing the verified
                official defaults. Relay requests will fail until the server
                environment is fixed.
              </Callout>
            ) : null}

            {controller.notice ? (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-4 py-3.5",
                  controller.notice.tone === "coral" &&
                    "border-coral/25 bg-coral/[0.045]",
                  controller.notice.tone === "amber" &&
                    "border-amber/25 bg-amber/[0.045]",
                  controller.notice.tone === "lime" &&
                    "border-lime/25 bg-lime/[0.045]",
                  controller.notice.tone === "neutral" &&
                    "border-line-strong bg-white/[0.02]",
                )}
                role="status"
              >
                <AlertIcon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    controller.notice.tone === "coral" && "text-coral",
                    controller.notice.tone === "amber" && "text-amber",
                    controller.notice.tone === "lime" && "text-lime",
                    controller.notice.tone === "neutral" && "text-muted",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] font-semibold text-paper">
                    {controller.notice.title}
                  </div>
                  <p className="mt-0.5 text-[10.5px] leading-4 text-paper/65">
                    {controller.notice.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => controller.setNotice(null)}
                  className="shrink-0 rounded p-1 text-muted transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime"
                  aria-label="Dismiss message"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ) : null}

            <Overview controller={controller} />
            <NetworkSection controller={controller} />
            <BundlerSection controller={controller} />
            <ContractsSection controller={controller} />
            <UserOperationSection controller={controller} />
            <SponsorshipSection controller={controller} />
            <ReportSection controller={controller} />

            <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-[10px] leading-4 text-muted/70">
                <ShieldIcon className="size-3.5 shrink-0 text-lime/70" />
                No key custody. No signatures in reports. Success requires a
                verified receipt.
              </p>
              <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted/50">
                Conform {controller.initialConfig.verifiedAt}
              </span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
