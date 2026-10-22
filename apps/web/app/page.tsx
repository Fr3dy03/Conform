import type { Metadata } from "next";
import Link from "next/link";
import { Badge, buttonClasses, StatusBadge } from "@conform/ui";
import {
  BOT_CHAIN_TESTNET,
  OFFICIAL_LINKS,
} from "@conform/chain";
import { SiteHeader } from "@/components/site-header";
import { SampleRunCard } from "@/components/sample-run";
import {
  AlertIcon,
  ArrowRight,
  ArrowUpRight,
  BracesIcon,
  CheckIcon,
  LayersIcon,
  LockIcon,
  NetworkIcon,
  ReceiptIcon,
  RouteIcon,
  ShieldIcon,
  TerminalIcon,
  WalletIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: {
    absolute: "Conform — BOT Chain ERC-4337 conformance",
  },
  description:
    "Run ERC-4337 checks on BOT Chain testnet: network identity, bundler methods, contract deployments, SimpleAccount derivation, and UserOperation receipts.",
  alternates: {
    canonical: "/",
  },
};

const coverage = [
  {
    icon: NetworkIcon,
    index: "01",
    label: "network",
    title: "Chain identity",
    body:
      "Reads chain ID, latest block, client version, and latency from the configured RPC endpoint.",
    checks: [
      "Chain ID is 968",
      "Latest block is readable",
      "RPC latency is recorded",
    ],
  },
  {
    icon: LayersIcon,
    index: "02",
    label: "bundler",
    title: "Bundler surface",
    body:
      "Checks the bundler chain, EntryPoint support, and the methods this path calls.",
    checks: [
      "Bundler chain matches 968",
      "EntryPoint v0.7 is listed",
      "Required RPC methods are available",
    ],
  },
  {
    icon: BracesIcon,
    index: "03",
    label: "contracts",
    title: "Contract deployments",
    body:
      "Checks bytecode at all three addresses, resolves the factory implementation, and calls the v0.7 interface.",
    checks: [
      "All three addresses have bytecode",
      "Factory resolves the configured implementation",
      "getNonce(address,uint192) responds",
    ],
  },
  {
    icon: WalletIcon,
    index: "04",
    label: "account",
    title: "Smart-account path",
    body:
      "Derives the counterfactual account from the owner, then reads its nonce, deployment status, and gas funding.",
    checks: [
      "Factory getAddress derivation",
      "Deployment status and EntryPoint nonce",
      "Native balance and EntryPoint deposit",
    ],
  },
  {
    icon: RouteIcon,
    index: "05",
    label: "useroperation",
    title: "UserOperation trace",
    body:
      "Quotes fees, estimates gas, signs the raw hash, submits to the bundler, and verifies the receipt.",
    checks: [
      "BOT fee quote and gas estimate",
      "Raw userOpHash signed by the owner",
      "Receipt success, not just inclusion",
    ],
  },
  {
    icon: ReceiptIcon,
    index: "06",
    label: "report",
    title: "Evidence export",
    body:
      "Exports a timestamped JSON report or a compact share summary without secrets.",
    checks: [
      "Timestamped JSON report",
      "Share summary without secrets",
      "Limitations included",
    ],
  },
];

const stages = [
  {
    number: "01",
    stage: "Network",
    title: "Chain identity",
    body: "Chain ID, block height, client version, RPC latency.",
  },
  {
    number: "02",
    stage: "Bundler",
    title: "Bundler surface",
    body: "EntryPoint support, required methods, BOT fee extension.",
  },
  {
    number: "03",
    stage: "Contracts",
    title: "Contract deployments",
    body: "Bytecode, factory resolution, EntryPoint v0.7 interface.",
  },
  {
    number: "04",
    stage: "Account",
    title: "Smart account",
    body: "Counterfactual derivation, nonce, deployment, gas funding.",
  },
  {
    number: "05",
    stage: "UserOperation",
    title: "Submission and receipt",
    body: "Fee quote, estimate, owner signature, submission, receipt.",
  },
  {
    number: "06",
    stage: "Sponsorship",
    title: "Paymaster boundary",
    body: "Unknown unless independently verified and explicitly configured.",
  },
];

const boundaries = [
  {
    title: "Not an audit",
    body:
      "Conform samples specific RPC and UserOperation paths. A pass is evidence, not a security certification.",
  },
  {
    title: "Not full bundler conformance",
    body:
      "Method probes show the interface exists. They are not a complete ERC-4337 compatibility suite.",
  },
  {
    title: "Not proof of sponsorship",
    body:
      "A deployed paymaster is not a sponsorship policy. Sponsorship stays unknown without a sponsored operation.",
  },
  {
    title: "Not mainnet",
    body:
      "All checks target BOT Chain testnet, chain ID 968. Results do not apply to mainnet.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="relative overflow-hidden border-b border-line">
          <div
            className="pointer-events-none absolute inset-0 marketing-grid opacity-[0.28] [mask-image:linear-gradient(to_bottom,black_10%,transparent_88%)]"
            aria-hidden="true"
          />
          <div className="page-shell relative grid gap-16 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:py-24">
            <div className="max-w-[640px]">
              <div className="animate-fade-up">
                <Badge tone="lime" dot>
                  BOT Chain testnet · ERC-4337
                </Badge>
              </div>
              <h1 className="animate-fade-up delay-1 mt-6 text-balance text-[clamp(2.8rem,6.2vw,5.15rem)] font-semibold leading-[0.96] tracking-[-0.058em] text-paper">
                Check the ERC-4337 path.
                <span className="mt-2 block text-paper/45">
                  On BOT Chain testnet<span className="text-lime">.</span>
                </span>
              </h1>
              <p className="animate-fade-up delay-2 mt-6 max-w-[540px] text-pretty text-[15px] leading-7 text-muted sm:text-[16px]">
                Conform checks network identity, bundler methods, contract
                deployments, SimpleAccount derivation, and a UserOperation
                receipt. A check that cannot be verified does not pass.
              </p>

              <div className="animate-fade-up delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/console"
                  className={buttonClasses({
                    variant: "primary",
                    size: "lg",
                    className: "group",
                  })}
                >
                  Open live console
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/console?demo=1"
                  className={buttonClasses({
                    variant: "secondary",
                    size: "lg",
                  })}
                >
                  <TerminalIcon className="size-4 text-lime" />
                  Open demo console
                </Link>
              </div>

              <div className="animate-fade-up delay-4 mt-8 grid max-w-[540px] grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {[
                  "BOT Chain testnet only",
                  "EntryPoint v0.7 + SimpleAccount",
                  "Wallet-signed UserOperations",
                  "Receipt required before success",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[11.5px] text-muted"
                  >
                    <CheckIcon className="size-3.5 shrink-0 text-lime" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="animate-fade-up delay-4 mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 font-mono text-[9px] uppercase tracking-[0.1em] text-muted/80">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-lime" />
                  Testnet only · chain 968
                </span>
                <span className="text-line-bright">/</span>
                <span>Constants checked 21 Oct 2026</span>
              </div>
            </div>

            <div className="animate-fade-in delay-2 lg:pl-2">
              <SampleRunCard />
            </div>
          </div>
        </section>

        <section id="method" className="anchor-offset border-b border-line">
          <div className="page-shell py-20 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <div className="mono-label">01 — Run order</div>
                <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-paper">
                  A matching chain ID is only the first check.
                </h2>
                <p className="mt-5 max-w-md text-[13.5px] leading-6 text-muted">
                  Conform records the method, result, and timing at each stage.
                  A failure stays attached to the RPC, bundler, contract,
                  account, or receipt check that produced it.
                </p>
                <p className="mt-4 max-w-md border-l border-lime/30 pl-4 text-[12.5px] leading-5 text-paper/65">
                  There is no combined score. The earliest failed stage is the
                  place to start.
                </p>
              </div>

              <div className="lg:pt-2">
                <div className="overflow-hidden rounded-lg border border-line bg-panel/70">
                  {stages.map((stage) => (
                    <div
                      key={stage.number}
                      className="grid grid-cols-[38px_1fr] items-center gap-3 border-b border-line px-4 py-4 last:border-b-0 sm:grid-cols-[48px_150px_1fr] sm:px-5"
                    >
                      <span className="font-mono text-[10px] text-muted/60">
                        {stage.number}
                      </span>
                      <div>
                        <span className="block font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted/60">
                          {stage.stage}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] font-medium text-paper">
                          {stage.title}
                        </span>
                      </div>
                      <p className="hidden text-[11.5px] leading-5 text-muted sm:block">
                        {stage.body}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-muted/60">
                  Stages run in order · a failure is reported where it occurs
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="coverage" className="anchor-offset border-b border-line">
          <div className="page-shell py-20 lg:py-24">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <div className="mono-label">02 — Coverage</div>
                <h2 className="mt-4 max-w-3xl text-balance text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-paper">
                  From network identity to a confirmed receipt.
                </h2>
              </div>
              <p className="max-w-xs text-[12.5px] leading-5 text-muted">
                Each check records the method, status, and evidence summary.
              </p>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {coverage.map((item) => (
                <article
                  key={item.title}
                  className="surface-sheen group rounded-lg border border-line bg-panel/65 p-5 transition-colors hover:border-line-bright"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-md border border-line-strong bg-black/20 text-lime">
                      <item.icon className="size-[18px]" />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted/55">
                      {item.index} / {item.label}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[15px] font-semibold tracking-[-0.015em] text-paper">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[12px] leading-5 text-muted">
                    {item.body}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-line pt-4">
                    {item.checks.map((check) => (
                      <li
                        key={check}
                        className="flex items-start gap-2 text-[11px] leading-4 text-paper/65"
                      >
                        <CheckIcon className="mt-0.5 size-3 shrink-0 text-lime/80" />
                        {check}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="workbench"
          className="anchor-offset border-b border-line bg-[#080b09]"
        >
          <div className="page-shell py-20 lg:py-24">
            <div className="grid items-center gap-14 lg:grid-cols-[0.86fr_1.14fr]">
              <div>
                <div className="mono-label">03 — The workbench</div>
                <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-paper">
                  Failures keep their context.
                </h2>
                <p className="mt-5 max-w-md text-[13.5px] leading-6 text-muted">
                  A red dot is not a diagnosis. Each failure records the method,
                  error code, request state, and a next action.
                </p>
                <ul className="mt-7 space-y-3.5">
                  {[
                    "AA and JSON-RPC errors include a concrete next step.",
                    "Submitted, included, and successful are separate states.",
                    "Success is recorded only after receipt verification.",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[12.5px] leading-5 text-paper/75"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-lime" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/console?demo=1"
                  className="mt-7 inline-flex items-center gap-2 text-[12.5px] font-medium text-lime transition-colors hover:text-[#ddff99]"
                >
                  Open a sample failure
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <div className="relative">
                <div
                  className="absolute -inset-5 rounded-3xl bg-amber/[0.025] blur-2xl"
                  aria-hidden="true"
                />
                <div className="relative overflow-hidden rounded-xl border border-line-strong bg-[#0a0d0b] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                  <div className="flex h-10 items-center justify-between border-b border-line bg-white/[0.018] px-4">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
                      conform / diagnosis
                    </span>
                    <Badge tone="amber" dot>
                      Sample trace
                    </Badge>
                  </div>
                  <div className="border-b border-line px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <StatusBadge status="fail" />
                      <Badge tone="coral" className="font-mono">
                        AA21
                      </Badge>
                      <span className="font-mono text-[9.5px] text-muted">
                        eth_estimateUserOperationGas
                      </span>
                    </div>
                    <h3 className="mt-3 text-[16px] font-semibold tracking-[-0.015em] text-paper">
                      Account prefund is missing
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-5 text-muted">
                      The smart account has no native BOT and no EntryPoint
                      deposit, so the bundler cannot simulate validation.
                    </p>
                  </div>

                  <div className="space-y-4 px-5 py-5">
                    <div>
                      <div className="mono-label">Next action</div>
                      <p className="mt-2 text-[12px] leading-5 text-paper/75">
                        Send test BOT to the derived account, then re-read its
                        balance and estimate a fresh UserOperation. Do not
                        resubmit the same payload.
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-md border border-line bg-black/30">
                      <div className="flex items-center justify-between border-b border-line px-3 py-2">
                        <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                          Bundler response
                        </span>
                        <span className="font-mono text-[8.5px] text-muted/60">
                          excerpt
                        </span>
                      </div>
                      <pre className="overflow-x-auto p-3 font-mono text-[10px] leading-5 text-paper/65">
{`{
  "code": -32500,
  "message": "AA21 didn't pay prefund"
}`}
                      </pre>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted/60">
                        Failure record · account stage
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-lime">
                        No signature stored
                        <ShieldIcon className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="page-shell py-20 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="mono-label">04 — Trust boundary</div>
                <h2 className="mt-4 max-w-lg text-balance text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.03] tracking-[-0.045em] text-paper">
                  Evidence in the browser. Signing in your wallet.
                </h2>
                <p className="mt-5 max-w-md text-[13.5px] leading-6 text-muted">
                  Conform does not ask for a private key or seed phrase.
                  JSON-RPC requests go through a same-origin relay with a method
                  allowlist.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      icon: LockIcon,
                      title: "Server-side endpoints",
                      body: "Credentials and custom endpoints remain in server configuration.",
                    },
                    {
                      icon: ShieldIcon,
                      title: "Wallet-signed",
                      body: "The owner signs the raw userOpHash. The key stays in the wallet.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-lg border border-line bg-panel/60 p-4"
                    >
                      <item.icon className="size-4 text-lime" />
                      <h3 className="mt-3 text-[12px] font-semibold text-paper">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-[11px] leading-4.5 text-muted">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-line bg-panel/50 p-5 sm:p-7">
                <div className="mono-label">Request path</div>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between rounded-lg border border-line-strong bg-black/20 px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <TerminalIcon className="size-4 text-paper/70" />
                      <div>
                        <div className="text-[12px] font-medium text-paper">
                          Browser
                        </div>
                        <div className="text-[10px] text-muted">
                          Conform console · wallet signature
                        </div>
                      </div>
                    </div>
                    <Badge tone="outline">client</Badge>
                  </div>
                  <div className="flex items-center gap-2 pl-5">
                    <div className="h-5 w-px bg-line-bright" />
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted">
                      POST · allowlisted JSON-RPC
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-lime/20 bg-lime/[0.035] px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <ShieldIcon className="size-4 text-lime" />
                      <div>
                        <div className="text-[12px] font-medium text-paper">
                          Conform relay
                        </div>
                        <div className="text-[10px] text-muted">
                          Same-origin route · method allowlist · no key custody
                        </div>
                      </div>
                    </div>
                    <Badge tone="lime">server</Badge>
                  </div>
                  <div className="flex items-center gap-2 pl-5">
                    <div className="h-5 w-px bg-line-bright" />
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted">
                      server-side env
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-line-strong bg-black/20 px-4 py-3.5">
                      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        BOT RPC
                      </div>
                      <div className="mt-1 text-[11px] text-paper/70">
                        rpc.bohr.life
                      </div>
                    </div>
                    <div className="rounded-lg border border-line-strong bg-black/20 px-4 py-3.5">
                      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        Bundler
                      </div>
                      <div className="mt-1 text-[11px] text-paper/70">
                        bundler.bohr.life
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-[10px] leading-4 text-muted/70">
                  Custom endpoints stay in server configuration. Share reports
                  contain no endpoint credentials or signatures.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="sponsorship"
          className="anchor-offset border-b border-line bg-[#080b09]"
        >
          <div className="page-shell py-20 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <div className="mono-label">05 — Sponsorship</div>
                <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.03] tracking-[-0.045em] text-paper">
                  Sponsorship is not proven by configuration.
                </h2>
                <p className="mt-5 max-w-md text-[13.5px] leading-6 text-muted">
                  BOT Chain documents an EOA Paymaster flow and recognizes
                  EIP-7702 transactions. Neither is an ERC-4337 EntryPoint v0.7
                  paymaster.
                </p>
                <div className="mt-7 inline-flex items-center gap-3 rounded-lg border border-amber/25 bg-amber/[0.045] px-4 py-3">
                  <AlertIcon className="size-4 text-amber" />
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber">
                      Default report state
                    </div>
                    <div className="mt-0.5 text-[12px] text-paper/75">
                      Sponsorship: unknown
                    </div>
                  </div>
                </div>
                <a
                  href={OFFICIAL_LINKS.accountAbstractionDocs}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-6 inline-flex items-center gap-2 text-[12px] font-medium text-lime hover:text-[#ddff99]"
                >
                  Read BOT Chain account abstraction docs
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-line bg-panel/70 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mono-label">ERC-4337 sponsorship</div>
                      <h3 className="mt-2 text-[14px] font-semibold text-paper">
                        Paymaster validation
                      </h3>
                    </div>
                    <StatusBadge status="unknown" label="Unknown" />
                  </div>
                  <p className="mt-3 text-[11.5px] leading-5 text-muted">
                    No public BOT Chain ERC-4337 paymaster is assumed. A
                    configured address is checked for bytecode and EntryPoint
                    deposit; policy still requires a sponsored operation.
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-panel/70 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mono-label">EOA Paymaster</div>
                      <h3 className="mt-2 text-[14px] font-semibold text-paper">
                        A separate transaction flow
                      </h3>
                    </div>
                    <Badge tone="outline">Out of scope</Badge>
                  </div>
                  <p className="mt-3 text-[11.5px] leading-5 text-muted">
                    Transaction sharing is a separate flow, not ERC-4337
                    UserOperation sponsorship.
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-panel/70 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mono-label">EIP-7702</div>
                      <h3 className="mt-2 text-[14px] font-semibold text-paper">
                        Recognized, not the tested path
                      </h3>
                    </div>
                    <Badge tone="outline">Not v0.7</Badge>
                  </div>
                  <p className="mt-3 text-[11.5px] leading-5 text-muted">
                    BOT Chain nodes recognize EIP-7702 transactions, but the
                    public bundler does not currently support EIP-7702
                    UserOperations. Conform tests the v0.7 SimpleAccount path.
                  </p>
                </div>
                <div className="rounded-lg border border-lime/20 bg-lime/[0.03] p-4 text-[11px] leading-5 text-paper/70">
                  <span className="font-medium text-lime">Rule:</span> a
                  configured paymaster is reported as configured. Sponsorship
                  stays unproven until a sponsored UserOperation succeeds.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="boundaries" className="anchor-offset border-b border-line">
          <div className="page-shell py-20 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="mono-label">06 — Boundaries</div>
                <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3.3rem)] font-semibold leading-[1.03] tracking-[-0.045em] text-paper">
                  What a passing run does not prove.
                </h2>
                <p className="mt-5 max-w-md text-[13.5px] leading-6 text-muted">
                  The report includes these limits so a passing result is not
                  read as a broader certification.
                </p>
                <div className="mt-7 rounded-lg border border-amber/20 bg-amber/[0.035] p-4">
                  <div className="flex gap-3">
                    <AlertIcon className="mt-0.5 size-4 shrink-0 text-amber" />
                    <p className="text-[11.5px] leading-5 text-paper/70">
                      Conform is an independent developer tool. It is not a BOT
                      Chain product, audit, or endorsement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {boundaries.map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-line bg-panel/60 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted/60">
                        Limit 0{index + 1}
                      </span>
                      <span className="text-muted/50">/</span>
                    </div>
                    <h3 className="mt-4 text-[13px] font-semibold text-paper">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[11.5px] leading-5 text-muted">
                      {item.body}
                    </p>
                  </div>
                ))}
                <div className="rounded-lg border border-line bg-panel/60 p-5 sm:col-span-2">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="mono-label">Official references</div>
                      <p className="mt-2 text-[12px] leading-5 text-paper/75">
                        Network and contract constants link to BOT Chain
                        documentation and were checked on 21 Oct 2026.
                      </p>
                    </div>
                    <a
                      href={OFFICIAL_LINKS.networkDocs}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={buttonClasses({
                        variant: "outline",
                        size: "sm",
                        className: "shrink-0",
                      })}
                    >
                      Verify constants
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_100%,rgba(200,243,106,0.085),transparent_65%)]"
            aria-hidden="true"
          />
          <div className="page-shell relative py-20 lg:py-28">
            <div className="mx-auto max-w-[880px] text-center">
              <div className="flex justify-center">
                <Badge tone="outline" dot>
                  BOT Chain testnet
                </Badge>
              </div>
              <h2 className="mt-6 text-balance text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-paper">
                Run the checks against the current testnet.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[14px] leading-6 text-muted">
                Start with demo data or run the live infrastructure checks.
                Connect a wallet only when you choose to sign a UserOperation.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/console"
                  className={buttonClasses({
                    variant: "primary",
                    size: "lg",
                    className: "group",
                  })}
                >
                  Open live console
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/console?demo=1"
                  className={buttonClasses({
                    variant: "secondary",
                    size: "lg",
                  })}
                >
                  Open demo console
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted/70">
                <span>Chain {BOT_CHAIN_TESTNET.id}</span>
                <span className="text-line-bright">/</span>
                <a
                  href={BOT_CHAIN_TESTNET.faucetUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition-colors hover:text-lime"
                >
                  Testnet faucet ↗
                </a>
                <span className="text-line-bright">/</span>
                <span>No key custody</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
