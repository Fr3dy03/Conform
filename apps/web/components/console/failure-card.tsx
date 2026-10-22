import { AlertIcon, ArrowUpRight } from "@/components/icons";
import { Badge, cn } from "@conform/ui";
import type { FailureReport } from "@conform/chain";

export function FailureCard({
  failure,
  compact = false,
  className,
}: {
  failure: FailureReport;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-coral/25 bg-coral/[0.045] p-3.5",
        compact && "p-3",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertIcon className="mt-0.5 size-3.5 shrink-0 text-coral" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] font-semibold text-coral">
              {failure.title}
            </span>
            {failure.aaCode ? (
              <Badge tone="coral" className="font-mono">
                {failure.aaCode}
              </Badge>
            ) : failure.rpcCode !== undefined ? (
              <Badge tone="coral" className="font-mono">
                {failure.rpcCode}
              </Badge>
            ) : null}
            {failure.method ? (
              <Badge tone="outline" className="font-mono normal-case tracking-normal">
                {failure.method}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1.5 break-words text-[11.5px] leading-5 text-paper/70">
            {failure.message}
          </p>
          {!compact ? (
            <div className="mt-3 border-t border-coral/15 pt-2.5">
              <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-coral/80">
                Next action
              </div>
              <p className="mt-1 text-[11.5px] leading-5 text-paper/75">
                {failure.suggestion}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function FailureLink({
  href,
  label = "Open official docs",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-[11px] font-medium text-lime hover:text-[#ddff99]"
    >
      {label}
      <ArrowUpRight className="size-3" />
    </a>
  );
}
