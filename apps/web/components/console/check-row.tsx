import { formatDuration } from "@conform/chain";
import type { CheckResult } from "@conform/chain";
import { cn, StatusBadge } from "@conform/ui";
import { FailureCard } from "./failure-card";

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-3.5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export function CheckRow({ check }: { check: CheckResult }) {
  const expandable = Boolean(check.details?.length || check.failure);
  const hasFailure = Boolean(check.failure);

  const content = (
    <>
      <div className="flex items-start gap-3">
        <StatusBadge status={check.status} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[12px] font-medium text-paper">
              {check.label}
            </span>
            {check.method ? (
              <code className="break-all font-mono text-[9px] text-muted/65">
                {check.method}
              </code>
            ) : null}
          </div>
          <p className="mt-1 break-words text-[11px] leading-4.5 text-muted">
            {check.summary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {check.durationMs !== undefined ? (
            <span className="hidden font-mono text-[9px] text-muted/50 sm:inline">
              {formatDuration(check.durationMs)}
            </span>
          ) : null}
          {expandable ? (
            <Chevron className="text-muted transition-transform group-open:rotate-180" />
          ) : null}
        </div>
      </div>
    </>
  );

  if (!expandable) {
    return (
      <div className="border-b border-line px-4 py-3 last:border-b-0">
        {content}
      </div>
    );
  }

  return (
    <details className="group border-b border-line last:border-b-0">
      <summary
        className={cn(
          "cursor-pointer list-none px-4 py-3 transition-colors hover:bg-white/[0.018] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-lime [&::-webkit-details-marker]:hidden",
          hasFailure && "hover:bg-coral/[0.025]",
        )}
      >
        {content}
      </summary>
      <div className="border-t border-line/60 bg-black/15 px-4 py-4 sm:pl-[70px]">
        {check.failure ? (
          <FailureCard failure={check.failure} className="mb-3" />
        ) : null}
        {check.details?.length ? (
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {check.details.map((detail) => (
              <div
                key={`${detail.label}-${detail.value}`}
                className="min-w-0 border-b border-line/40 pb-2"
              >
                <dt className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted/60">
                  {detail.label}
                </dt>
                <dd
                  className={cn(
                    "mt-0.5 break-all text-[10.5px] leading-4 text-paper/70",
                    detail.mono && "font-mono",
                    detail.tone === "positive" && "text-lime",
                    detail.tone === "warning" && "text-amber",
                    detail.tone === "negative" && "text-coral",
                  )}
                >
                  {detail.href ? (
                    <a
                      href={detail.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline decoration-line-bright underline-offset-2 hover:text-lime"
                    >
                      {detail.value}
                    </a>
                  ) : (
                    detail.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </details>
  );
}

export function CheckList({
  checks,
  emptyTitle = "Checks have not run",
  emptyBody = "Run the live checks to populate this stage.",
}: {
  checks: CheckResult[];
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (checks.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <div className="mx-auto mb-2 size-1.5 rounded-full bg-line-bright" />
        <p className="text-[12px] font-medium text-paper/70">{emptyTitle}</p>
        <p className="mt-1 text-[11px] text-muted">{emptyBody}</p>
      </div>
    );
  }
  return (
    <div>
      {checks.map((check) => (
        <CheckRow key={check.id} check={check} />
      ))}
    </div>
  );
}
