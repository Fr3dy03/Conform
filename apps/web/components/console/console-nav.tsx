"use client";

import type { CheckStatus, DiagnosticStage } from "@conform/chain";
import { CopyButton, StatusDot } from "@conform/ui";
import { useActiveSection } from "@/lib/use-active-section";
import {
  aggregateChecks,
  stageAggregate,
  type CheckAggregate,
} from "@/lib/presentation";
import type { ConsoleController } from "@/lib/use-console";

const sectionIds = [
  "overview",
  "network",
  "bundler",
  "contracts",
  "user-operation",
  "sponsorship",
  "report",
];

interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  stage?: DiagnosticStage;
}

const items: NavItem[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview" },
  { id: "network", label: "Network", shortLabel: "Network", stage: "network" },
  { id: "bundler", label: "Bundler", shortLabel: "Bundler", stage: "bundler" },
  {
    id: "contracts",
    label: "Contracts",
    shortLabel: "Contracts",
    stage: "contracts",
  },
  {
    id: "user-operation",
    label: "UserOperation",
    shortLabel: "UserOp",
    stage: "account",
  },
  {
    id: "sponsorship",
    label: "Sponsorship",
    shortLabel: "Sponsor",
    stage: "sponsorship",
  },
  { id: "report", label: "Report", shortLabel: "Report" },
];

function aggregateFor(
  controller: ConsoleController,
  stage?: DiagnosticStage,
): CheckAggregate | null {
  if (!controller.run) return null;
  if (stage) return stageAggregate(controller.run.checks, stage);
  return aggregateChecks(controller.run.checks);
}

function dotStatus(
  controller: ConsoleController,
  item: NavItem,
): CheckStatus {
  if (item.id === "user-operation") {
    const status = controller.attempt?.status;
    if (status === "confirmed") return "pass";
    if (status === "failed") return "fail";
    if (status === "pending" || status === "submitted") return "warn";
    if (status === "signed" || status === "estimated") return "pass";
    return "skip";
  }
  if (item.id === "sponsorship") {
    return controller.run?.sponsorship.state === "configured" ? "unknown" : "unknown";
  }
  const aggregate = aggregateFor(controller, item.stage);
  return aggregate?.status ?? "skip";
}

function CountLabel({
  controller,
  item,
}: {
  controller: ConsoleController;
  item: NavItem;
}) {
  if (item.id === "overview") {
    if (!controller.run) return null;
    return (
      <span className="font-mono text-[9px] text-muted/60">
        {controller.run.source === "demo" ? "demo" : "run"}
      </span>
    );
  }
  if (item.id === "user-operation") {
    const status = controller.attempt?.status;
    if (!status) return null;
    if (status === "pending" || status === "submitted")
      return <span className="font-mono text-[9px] text-amber">pending</span>;
    if (status === "confirmed")
      return <span className="font-mono text-[9px] text-lime">ok</span>;
    if (status === "failed")
      return <span className="font-mono text-[9px] text-coral">fail</span>;
    return null;
  }
  if (item.id === "report") {
    return controller.run ? (
      <span className="font-mono text-[9px] text-lime/70">ready</span>
    ) : null;
  }
  if (item.id === "sponsorship") {
    return (
      <span className="font-mono text-[9px] text-amber">
        {controller.run?.sponsorship.state === "configured" ? "set" : "unknown"}
      </span>
    );
  }
  const aggregate = aggregateFor(controller, item.stage);
  if (!aggregate) return null;
  return (
    <span className="font-mono text-[9px] text-muted/60">
      {aggregate.pass}/{aggregate.total}
    </span>
  );
}

export function ConsoleSidebar({ controller }: { controller: ConsoleController }) {
  const active = useActiveSection(sectionIds);

  return (
    <aside className="hidden w-[228px] shrink-0 lg:block">
      <div className="sticky top-[76px]">
        <div className="mono-label px-2">Run sections</div>
        <nav aria-label="Console sections" className="mt-2 space-y-0.5">
          {items.map((item, index) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={
                  isActive
                    ? "flex items-center gap-2.5 rounded-md border border-line bg-white/[0.045] px-2.5 py-2 text-[11.5px] font-medium text-paper"
                    : "flex items-center gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-[11.5px] font-medium text-muted transition-colors hover:bg-white/[0.025] hover:text-paper"
                }
              >
                <span className="w-4 font-mono text-[8.5px] text-muted/55">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <StatusDot status={dotStatus(controller, item)} />
                <span className="flex-1">{item.label}</span>
                <CountLabel controller={controller} item={item} />
              </a>
            );
          })}
        </nav>

        <div className="mt-6 rounded-lg border border-line bg-panel/55 p-3.5">
          <div className="flex items-center justify-between">
            <span className="mono-label">Pinned network</span>
            <span className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-lime">
              <span className="size-1.5 rounded-full bg-lime" />
              968
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted/55">
                EntryPoint v0.7
              </div>
              <div className="mt-1 flex items-start gap-1.5">
                <code className="break-all font-mono text-[9px] leading-4 text-paper/60">
                  {controller.initialConfig.entryPoint}
                </code>
                <CopyButton value={controller.initialConfig.entryPoint} compact />
              </div>
            </div>
            <div className="border-t border-line pt-2">
              <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted/55">
                RPC
              </div>
              <div className="mt-0.5 font-mono text-[9.5px] text-paper/60">
                {controller.initialConfig.rpcHost}
              </div>
            </div>
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted/55">
                Bundler
              </div>
              <div className="mt-0.5 font-mono text-[9.5px] text-paper/60">
                {controller.initialConfig.bundlerHost}
              </div>
            </div>
          </div>
          <a
            href={controller.initialConfig.docsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 block border-t border-line pt-2.5 text-[10px] text-muted transition-colors hover:text-lime"
          >
            Source: BOT Chain docs ↗
          </a>
        </div>

        {controller.configError ? (
          <div className="mt-3 rounded-md border border-amber/25 bg-amber/[0.045] p-3">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-amber">
              Config warning
            </div>
            <p className="mt-1 text-[10px] leading-4 text-paper/65">
              {controller.configError}
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function ConsoleMobileNav({
  controller,
}: {
  controller: ConsoleController;
}) {
  const active = useActiveSection(sectionIds);

  return (
    <nav
      aria-label="Console sections"
      className="sticky top-14 z-30 -mx-4 border-y border-line bg-ink/95 px-4 py-2 backdrop-blur-xl lg:hidden"
    >
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={active === item.id ? "location" : undefined}
            className={
              active === item.id
                ? "flex shrink-0 items-center gap-1.5 rounded-full border border-line-bright bg-white/[0.06] px-3 py-1.5 text-[10.5px] font-medium text-paper"
                : "flex shrink-0 items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-[10.5px] font-medium text-muted"
            }
          >
            <StatusDot status={dotStatus(controller, item)} />
            {item.shortLabel}
          </a>
        ))}
      </div>
    </nav>
  );
}
