import { cn } from "./cn";

export function ConformMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="7.5"
        stroke="currentColor"
        strokeOpacity="0.22"
      />
      <path
        d="M23 10.6a9 9 0 1 0 0 10.8"
        stroke="#C8F36A"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="m13.2 15.9 3 3 6.3-7.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="26" r="1.3" fill="#C8F36A" />
    </svg>
  );
}

export function ConformLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ConformMark />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-[0.14em] text-paper">
            CONFORM
          </span>
          <span className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.2em] text-muted">
            BOT Chain workbench
          </span>
        </span>
      )}
    </span>
  );
}

export function BotChainLogo({
  className,
  src = "/brand/bot-chain-logo.svg",
}: {
  className?: string;
  src?: string;
}) {
  return (
    <img
      src={src}
      alt="BOT Chain"
      width={161}
      height={32}
      className={cn("h-8 w-auto", className)}
    />
  );
}
