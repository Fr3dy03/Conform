import { Badge, StatusBadge } from "@conform/ui";

const rows = [
  {
    label: "network.chain-id",
    status: "pass" as const,
    value: "0x3c8",
  },
  {
    label: "bundler.entrypoint",
    status: "pass" as const,
    value: "v0.7 supported",
  },
  {
    label: "contracts.factory",
    status: "pass" as const,
    value: "2,288 bytes",
  },
  {
    label: "account.derivation",
    status: "pass" as const,
    value: "0x4c8b…3e2f",
  },
  {
    label: "userop.estimate",
    status: "pass" as const,
    value: "gas quoted",
  },
  {
    label: "sponsorship.status",
    status: "unknown" as const,
    value: "no paymaster",
  },
  {
    label: "userop.receipt",
    status: "pass" as const,
    value: "block 27,418,231",
  },
];

export function SampleRunCard() {
  return (
    <figure
      className="relative"
      aria-label="Sample Conform console output with demo data"
    >
      <div className="absolute -inset-6 rounded-[28px] bg-lime/[0.035] blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-line-strong bg-[#0a0d0b] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="flex h-10 items-center justify-between border-b border-line bg-white/[0.018] px-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="size-2 rounded-full bg-line-bright" />
              <span className="size-2 rounded-full bg-line-bright" />
              <span className="size-2 rounded-full bg-line-bright" />
            </div>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
              conform / console
            </span>
          </div>
          <Badge tone="amber" dot>
            Demo data
          </Badge>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                Run 0249 · 21 Oct 2026
              </p>
              <h3 className="mt-1.5 text-[17px] font-semibold tracking-[-0.02em] text-paper">
                BOT Chain Testnet
              </h3>
              <p className="mt-0.5 font-mono text-[10px] text-muted">
                chain 968 · EntryPoint 0x00000000…da032
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="tabular text-[26px] font-semibold leading-none text-lime">
                  17
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                  pass
                </span>
              </div>
              <p className="mt-1 font-mono text-[9px] text-amber">
                1 unknown · 0 failed
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-1" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <span
                key={index}
                className={
                  index === 15
                    ? "h-1 flex-1 rounded-full bg-amber/70"
                    : "h-1 flex-1 rounded-full bg-lime/65"
                }
              />
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-line bg-black/20">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 border-b border-line/60 px-3 py-2.5 last:border-b-0"
              >
                <span className="min-w-0 truncate font-mono text-[10px] text-paper/75">
                  {row.label}
                </span>
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="hidden font-mono text-[9.5px] text-muted sm:inline">
                    {row.value}
                  </span>
                  <StatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted/70">
              Illustrative values, not a live run
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-lime">
              <span className="size-1.5 rounded-full bg-lime" />
              receipt-gated
            </span>
          </div>
        </div>
      </div>

      <figcaption className="sr-only">
        Sample output. Green rows are demo passes, sponsorship is unknown, and
        the UserOperation receipt is labelled demo data.
      </figcaption>
    </figure>
  );
}
