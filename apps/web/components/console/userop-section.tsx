"use client";

import {
  Badge,
  Button,
  Callout,
  CopyButton,
  Panel,
  PanelHeader,
  Spinner,
  StatusBadge,
  TextInput,
  cn,
} from "@conform/ui";
import {
  formatBot,
  formatGweiValue,
  shortAddress,
  shortHash,
} from "@conform/chain";
import {
  AlertIcon,
  ArrowRight,
  ArrowUpRight,
  CheckIcon,
  LockIcon,
  ReceiptIcon,
  RouteIcon,
  ShieldIcon,
  WalletIcon,
  XIcon,
} from "@/components/icons";
import type { ConsoleController } from "@/lib/use-console";
import {
  attemptStatus,
  explorerAddressUrl,
  explorerTransactionUrl,
} from "@/lib/presentation";
import { ConsoleSection } from "./console-section";
import { FailureCard } from "./failure-card";

type StepState = "done" | "active" | "failed" | "pending" | "skipped";

function StepRail({ controller }: { controller: ConsoleController }) {
  const status = controller.attempt?.status ?? "idle";
  const failureStage = controller.attempt?.failure?.stage;
  const signedOrBeyond = ["signed", "pending", "submitted", "confirmed"].includes(
    status,
  );

  const steps: Array<{ label: string; state: StepState; note: string }> = [
    {
      label: "Account",
      state: controller.account ? "done" : controller.ownerValid ? "active" : "pending",
      note: controller.account ? "Derived" : "Needs owner",
    },
    {
      label: "Estimate",
      state:
        failureStage === "simulation"
          ? "failed"
          : controller.prepared
            ? "done"
            : controller.account
              ? "active"
              : "pending",
      note: controller.prepared ? "Gas quoted" : "Bundler",
    },
    {
      label: "Sign",
      state: controller.demoMode
        ? "skipped"
        : failureStage === "signature" || failureStage === "submission"
          ? "failed"
          : signedOrBeyond
            ? "done"
            : controller.prepared
              ? "active"
              : "pending",
      note: controller.demoMode
        ? "Skipped"
        : signedOrBeyond
          ? "Signed"
          : "Wallet",
    },
    {
      label: "Receipt",
      state:
        status === "confirmed"
          ? "done"
          : status === "pending" ||
              status === "submitted" ||
              controller.busy === "polling"
            ? "active"
            : status === "failed" && failureStage === "receipt"
              ? "failed"
              : "pending",
      note:
        status === "confirmed"
          ? controller.demoMode
            ? "Sample"
            : "Verified"
          : "Chain proof",
    },
  ];

  return (
    <div className="grid grid-cols-4 border-b border-line bg-black/10">
      {steps.map((step, index) => (
        <div
          key={step.label}
          className={cn(
            "relative px-3 py-3.5 sm:px-4",
            index > 0 && "border-l border-line",
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full border font-mono text-[8px]",
                step.state === "done" &&
                  "border-lime/40 bg-lime/10 text-lime",
                step.state === "active" &&
                  "border-lime/40 bg-lime/10 text-lime",
                step.state === "failed" &&
                  "border-coral/40 bg-coral/10 text-coral",
                step.state === "pending" &&
                  "border-line-strong bg-white/[0.02] text-muted",
                step.state === "skipped" &&
                  "border-line-strong bg-white/[0.02] text-muted",
              )}
            >
              {step.state === "done" ? (
                <CheckIcon className="size-2.5" />
              ) : step.state === "failed" ? (
                <XIcon className="size-2.5" />
              ) : step.state === "active" ? (
                <span className="size-1.5 rounded-full bg-lime" />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </span>
            <span
              className={cn(
                "text-[10.5px] font-medium",
                step.state === "pending" || step.state === "skipped"
                  ? "text-muted"
                  : "text-paper/80",
              )}
            >
              {step.label}
            </span>
          </div>
          <div className="mt-1 pl-7 font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
            {step.note}
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserOperationSection({
  controller,
}: {
  controller: ConsoleController;
}) {
  const {
    account,
    owner,
    ownerValid,
    prepared,
    attempt,
    wallet,
    walletMatchesOwner,
    busy,
    demoMode,
    userOpError,
    accountFailure,
  } = controller;
  const status = attempt?.status ?? "idle";
  const statusBadge = attemptStatus(attempt);
  const accountFunded =
    account !== null &&
    (BigInt(account.nativeBalance) > 0n ||
      BigInt(account.entryPointDeposit) > 0n);
  const ownerError =
    owner.trim().length > 0 && !ownerValid
      ? "Enter a 20-byte 0x-prefixed owner address."
      : undefined;
  const showFailure = Boolean(attempt?.failure);

  return (
    <ConsoleSection
      id="user-operation"
      eyebrow="05 / UserOperation"
      title="UserOperation path"
      description="Derive a SimpleAccount, estimate gas, sign the raw hash, submit, and verify the receipt."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={demoMode ? "amber" : "lime"} dot>
            {demoMode ? "Demo" : "Live"}
          </Badge>
          <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
        </div>
      }
    >
      <Panel className="overflow-hidden">
        <PanelHeader
          title="SimpleAccount · no paymaster"
          description={
            demoMode
              ? "Sample values only. Demo mode never connects a wallet or sends an operation."
              : "No-value execute() call. The first operation includes factory deployment if needed."
          }
          actions={
            <div className="flex items-center gap-2">
              <Badge tone="outline">EntryPoint v0.7</Badge>
              <Badge tone="outline">No paymaster</Badge>
            </div>
          }
        />
        <StepRail controller={controller} />

        <div className="grid gap-px bg-line lg:grid-cols-[0.92fr_1.08fr]">
          <div className="bg-panel">
            <div className="border-b border-line px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-paper">
                  Owner & smart account
                </span>
                {account ? (
                  <StatusBadge
                    status={account.deployed ? "pass" : "warn"}
                    label={account.deployed ? "Deployed" : "Counterfactual"}
                  />
                ) : (
                  <Badge tone="outline">Not derived</Badge>
                )}
              </div>
            </div>

            <div className="space-y-3.5 p-4">
              <TextInput
                label="SimpleAccount owner"
                value={owner}
                onChange={(event) => controller.setOwner(event.target.value)}
                placeholder="0x… EOA owner address"
                mono
                disabled={demoMode || busy !== null}
                error={ownerError}
                hint={
                  demoMode
                    ? "Sample owner. Read-only in demo mode."
                    : "The EOA that signs the raw userOpHash. The account address is derived by the factory."
                }
                autoComplete="off"
                spellCheck={false}
              />

              {demoMode ? (
                <div className="rounded-md border border-amber/20 bg-amber/[0.035] px-3 py-2.5">
                  <div className="flex items-center gap-2 text-[10.5px] text-amber">
                    <AlertIcon className="size-3.5" />
                    Demo mode — no wallet connection or signature
                  </div>
                </div>
              ) : wallet ? (
                <div className="rounded-md border border-line bg-black/15 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-md border border-line-strong bg-elevated text-lime">
                        <WalletIcon className="size-4" />
                      </div>
                      <div>
                        <div className="font-mono text-[9.5px] text-paper/80">
                          {shortAddress(wallet.address, 10, 6)}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Badge
                            tone={wallet.chainId === 968 ? "lime" : "amber"}
                            dot
                          >
                            {wallet.chainId === 968
                              ? "BOT testnet"
                              : `Chain ${wallet.chainId}`}
                          </Badge>
                          <Badge
                            tone={walletMatchesOwner ? "lime" : "amber"}
                          >
                            {walletMatchesOwner
                              ? "Owner match"
                              : "Owner mismatch"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={controller.disconnect}
                      className="text-[9px] text-muted transition-colors hover:text-paper"
                    >
                      Forget
                    </button>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-line pt-2.5">
                    <button
                      type="button"
                      onClick={controller.switchChain}
                      disabled={controller.walletBusy}
                      className="text-[9.5px] text-muted transition-colors hover:text-lime disabled:opacity-50"
                    >
                      {wallet.chainId === 968
                        ? "Re-check network"
                        : "Switch to chain 968"}
                    </button>
                    <CopyButton value={wallet.address} compact />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 rounded-md border border-line bg-black/15 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[10.5px] text-paper/75">
                      No wallet connected
                    </div>
                    <p className="mt-0.5 text-[9.5px] text-muted">
                      You can derive and estimate with a pasted owner. Connect
                      only to sign or fund.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={controller.connect}
                    loading={controller.walletBusy}
                  >
                    Connect wallet
                  </Button>
                </div>
              )}

              {!owner.trim() ? (
                <div className="rounded-md border border-line bg-black/10 px-3 py-2.5 text-[10px] leading-4 text-muted">
                  Paste an owner address or connect a wallet. The owner does not
                  need to equal the smart-account address.
                </div>
              ) : null}

              {account ? (
                <div className="rounded-md border border-line">
                  <div className="flex items-start justify-between gap-2 border-b border-line px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted/60">
                        Derived SimpleAccount
                      </div>
                      <div className="mt-1 flex items-start gap-1.5">
                        <code className="break-all font-mono text-[9px] leading-4 text-paper/70">
                          {account.address}
                        </code>
                        <CopyButton value={account.address} compact />
                      </div>
                    </div>
                    <a
                      href={explorerAddressUrl(
                        controller.initialConfig.network.explorerUrl,
                        account.address,
                      )}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="shrink-0 text-[9px] text-muted hover:text-lime"
                    >
                      Explorer ↗
                    </a>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
                    <div className="px-3 py-2.5">
                      <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                        Nonce
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-paper/75">
                        {account.nonce}
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                        Salt
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-paper/75">
                        {account.salt}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
                    <div className="px-3 py-2.5">
                      <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                        Native BOT
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-paper/75">
                        {formatBot(account.nativeBalance)} BOT
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                        EntryPoint deposit
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-paper/75">
                        {formatBot(account.entryPointDeposit)} BOT
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          accountFunded ? "bg-lime" : "bg-amber",
                        )}
                      />
                      <span className="text-[9.5px] text-muted">
                        {accountFunded
                          ? "Has gas funding"
                          : "No gas funding yet"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={controller.deriveAccount}
                      loading={busy === "deriving"}
                    >
                      Refresh
                    </Button>
                  </div>

                  {!demoMode ? (
                    <div className="border-t border-line px-3 py-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-medium text-paper/80">
                          Fund this account
                        </div>
                        <a
                          href={controller.initialConfig.network.faucetUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-[9px] text-lime hover:text-[#ddff99]"
                        >
                          Testnet faucet ↗
                        </a>
                      </div>
                      <p className="mt-1 text-[9.5px] leading-4 text-muted">
                        Gas is prefunded from the smart account. This is a
                        separate BOT transfer, not a UserOperation.
                      </p>
                      <div className="mt-2.5 flex items-end gap-2">
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor="funding-amount"
                            className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/60"
                          >
                            Amount (BOT)
                          </label>
                          <input
                            id="funding-amount"
                            value={controller.fundingAmount}
                            onChange={(event) =>
                              controller.setFundingAmount(event.target.value)
                            }
                            inputMode="decimal"
                            disabled={controller.funding.status === "submitting"}
                            className="mt-1 h-8 w-full rounded border border-line-strong bg-[#0b0f0c] px-2 font-mono text-[10px] text-paper focus:border-lime/60 focus:outline-none focus:ring-2 focus:ring-lime/20 disabled:opacity-50"
                          />
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={controller.fundAccount}
                          disabled={!wallet || controller.funding.status === "pending"}
                          loading={controller.funding.status === "submitting"}
                        >
                          Send
                        </Button>
                      </div>
                      {controller.funding.status !== "idle" ? (
                        <div className="mt-2.5 flex items-start gap-2 rounded border border-line bg-black/15 px-2.5 py-2">
                          <span
                            className={cn(
                              "mt-1 size-1.5 shrink-0 rounded-full",
                              controller.funding.status === "confirmed"
                                ? "bg-lime"
                                : controller.funding.status === "failed"
                                  ? "bg-coral"
                                  : "bg-amber animate-pulse",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-[9.5px] leading-4 text-paper/65">
                              {controller.funding.message ??
                                "Funding transaction submitted."}
                            </p>
                            {controller.funding.hash ? (
                              <a
                                href={explorerTransactionUrl(
                                  controller.initialConfig.network.explorerUrl,
                                  controller.funding.hash,
                                )}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="mt-0.5 inline-flex items-center gap-1 font-mono text-[8.5px] text-muted hover:text-lime"
                              >
                                {shortHash(controller.funding.hash)}
                                <ArrowUpRight className="size-2.5" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-line-strong bg-black/10 px-4 py-6 text-center">
                  <RouteIcon className="mx-auto size-5 text-muted/50" />
                  <p className="mt-2 text-[10.5px] text-paper/65">
                    Derive the counterfactual account from this owner.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={controller.deriveAccount}
                    loading={busy === "deriving"}
                    disabled={!ownerValid}
                  >
                    Derive account
                  </Button>
                </div>
              )}

              {accountFailure ? (
                <FailureCard failure={accountFailure} />
              ) : null}
            </div>
          </div>

          <div className="bg-panel">
            <div className="border-b border-line px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-paper">
                  Operation & receipt
                </span>
                <div className="flex items-center gap-2">
                  {attempt?.userOpHash ? (
                    <CopyButton value={attempt.userOpHash} label="Copy hash" compact />
                  ) : null}
                  <Badge tone="outline">No paymaster</Badge>
                </div>
              </div>
            </div>

            <div className="p-4">
              {!prepared ? (
                <div>
                  <div className="rounded-md border border-line bg-black/15 p-4">
                    <div className="flex items-center gap-2">
                      <ShieldIcon className="size-4 text-lime" />
                      <span className="text-[11px] font-medium text-paper/85">
                        What will be sent
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                          Call target
                        </div>
                        <div className="mt-0.5 font-mono text-[9.5px] text-paper/70">
                          {ownerValid ? shortAddress(owner, 10, 6) : "Owner address"}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                          Value
                        </div>
                        <div className="mt-0.5 font-mono text-[9.5px] text-paper/70">
                          0 BOT
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                          Paymaster
                        </div>
                        <div className="mt-0.5 font-mono text-[9.5px] text-paper/70">
                          None
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                          Owner signature
                        </div>
                        <div className="mt-0.5 font-mono text-[9.5px] text-paper/70">
                          personal_sign
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-[10.5px] leading-4.5 text-muted">
                    The first operation includes{" "}
                    <code className="font-mono text-[9px] text-paper/65">
                      factory + factoryData
                    </code>{" "}
                    if the account is counterfactual. Estimation requires gas
                    funding from the smart account.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    className="mt-4 w-full"
                    onClick={controller.estimateOperation}
                    loading={busy === "estimating"}
                    disabled={!ownerValid || busy === "deriving"}
                  >
                    {controller.account ? "Estimate UserOperation" : "Derive & estimate"}
                    <ArrowRight className="size-4" />
                  </Button>
                  {demoMode ? (
                    <p className="mt-2 text-center text-[9px] text-amber/80">
                      Sample estimate only — no bundler request.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="lime" dot>
                      {attempt?.status === "confirmed"
                        ? "Receipt verified"
                        : attempt?.status === "pending" ||
                            attempt?.status === "submitted"
                          ? "Awaiting receipt"
                          : attempt?.status === "signed"
                            ? "Signature ready"
                            : "Gas estimated"}
                    </Badge>
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted/55">
                      {prepared.summary}
                    </span>
                  </div>

                  <div className="mt-3 rounded-md border border-line bg-black/15">
                    <div className="flex items-start justify-between gap-2 border-b border-line px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                          userOpHash
                        </div>
                        <code className="mt-0.5 block break-all font-mono text-[9px] leading-4 text-paper/70">
                          {prepared.userOpHash}
                        </code>
                      </div>
                      <CopyButton value={prepared.userOpHash} compact />
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
                      <div className="px-3 py-2.5">
                        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                          Sender
                        </div>
                        <div className="mt-0.5 font-mono text-[9px] text-paper/70">
                          {shortAddress(prepared.operation.sender, 10, 6)}
                        </div>
                      </div>
                      <div className="px-3 py-2.5">
                        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                          Nonce
                        </div>
                        <div className="mt-0.5 font-mono text-[9px] text-paper/70">
                          {BigInt(prepared.operation.nonce).toString()}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
                      <div className="px-3 py-2.5">
                        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                          Max fee
                        </div>
                        <div className="mt-0.5 font-mono text-[9px] text-paper/70">
                          {formatGweiValue(prepared.feeQuote.maxFeePerGas)} gwei
                        </div>
                      </div>
                      <div className="px-3 py-2.5">
                        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
                          Priority fee
                        </div>
                        <div className="mt-0.5 font-mono text-[9px] text-paper/70">
                          {formatGweiValue(prepared.feeQuote.maxPriorityFeePerGas)} gwei
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-line">
                      <GasCell
                        label="Call"
                        value={prepared.gas.callGasLimit}
                      />
                      <GasCell
                        label="Verification"
                        value={prepared.gas.verificationGasLimit}
                      />
                      <GasCell
                        label="Pre-verification"
                        value={prepared.gas.preVerificationGas}
                      />
                    </div>
                  </div>

                  {showFailure && attempt?.failure ? (
                    <FailureCard failure={attempt.failure} className="mt-3" />
                  ) : userOpError ? (
                    <Callout tone="coral" className="mt-3" icon={<AlertIcon className="size-3.5" />}>
                      {userOpError}
                    </Callout>
                  ) : null}

                  {demoMode && status !== "confirmed" ? (
                    <div className="mt-4">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        onClick={controller.simulateDemoReceipt}
                      >
                        <ReceiptIcon className="size-4" />
                        Reveal sample receipt
                      </Button>
                      <p className="mt-2 text-center text-[9px] text-amber/80">
                        No wallet, signature, or transaction. This result is
                        sample data, not an on-chain result.
                      </p>
                    </div>
                  ) : null}

                  {!demoMode && (status === "estimated" || status === "idle") ? (
                    <div className="mt-4">
                      {!wallet ? (
                        <div className="mb-3 flex items-center justify-between gap-3 rounded border border-amber/20 bg-amber/[0.035] px-3 py-2.5">
                          <p className="text-[10px] leading-4 text-paper/65">
                            Connect the owner wallet to sign the raw hash.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={controller.connect}
                            loading={controller.walletBusy}
                          >
                            Connect
                          </Button>
                        </div>
                      ) : !walletMatchesOwner ? (
                        <Callout
                          tone="amber"
                          className="mb-3"
                          icon={<AlertIcon className="size-3.5" />}
                        >
                          The connected wallet is not the owner. Switch accounts
                          in the wallet before signing.
                        </Callout>
                      ) : null}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="primary"
                          size="md"
                          className="flex-1"
                          onClick={controller.signOperation}
                          loading={busy === "signing"}
                          disabled={!wallet || !walletMatchesOwner}
                          icon={<LockIcon className="size-4" />}
                        >
                          Sign with owner wallet
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={controller.estimateOperation}
                          loading={busy === "estimating"}
                        >
                          Re-estimate
                        </Button>
                      </div>
                      <p className="mt-2 text-center text-[9px] leading-4 text-muted/65">
                        personal_sign over the raw userOpHash. The signature is
                        held in memory only and never included in the report.
                      </p>
                    </div>
                  ) : null}

                  {!demoMode && status === "signed" ? (
                    <div className="mt-4">
                      <div className="mb-3 rounded border border-lime/20 bg-lime/[0.04] px-3 py-2.5">
                        <div className="flex items-center gap-2 text-[10.5px] text-lime">
                          <LockIcon className="size-3.5" />
                          Signature ready in memory
                        </div>
                        <p className="mt-1 pl-[22px] text-[9.5px] leading-4 text-paper/60">
                          Not written to state or the report. Submit to the
                          bundler when ready.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        onClick={controller.submitSignedOperation}
                        loading={busy === "submitting"}
                        icon={<RouteIcon className="size-4" />}
                      >
                        Submit to bundler
                      </Button>
                    </div>
                  ) : null}

                  {!demoMode &&
                  (status === "pending" ||
                    status === "submitted" ||
                    busy === "polling") ? (
                    <div className="mt-4 rounded-md border border-amber/20 bg-amber/[0.035] p-3.5">
                      <div className="flex items-center gap-2 text-[10.5px] font-medium text-amber">
                        <Spinner className="size-3" />
                        Waiting for a UserOperation receipt
                      </div>
                      <p className="mt-1.5 text-[9.5px] leading-4 text-paper/60">
                        Submitted, not successful. The bundler has not returned
                        a successful receipt.
                        {attempt?.userOpHash
                          ? ` Poll attempts: ${controller.receiptAttempts}.`
                          : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-amber/15 pt-2.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={controller.checkReceiptAgain}
                          loading={busy === "polling"}
                          disabled={!attempt?.userOpHash}
                        >
                          Check receipt now
                        </Button>
                        {attempt?.userOpHash ? (
                          <CopyButton value={attempt.userOpHash} label="Copy hash" compact />
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {status === "confirmed" ? (
                    <div className="mt-4 rounded-md border border-lime/25 bg-lime/[0.04] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-lime">
                          <CheckIcon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-lime">
                            {demoMode
                              ? "Sample receipt shown"
                              : "Receipt verified on chain"}
                          </div>
                          <p className="mt-1 text-[10px] leading-4 text-paper/60">
                            {demoMode
                              ? "This confirms the sample data only. No transaction was signed or broadcast."
                              : "The bundler returned success=true and the outer transaction succeeded. This confirms this UserOperation, not sponsorship."}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-lime/15 pt-3">
                        <ReceiptItem
                          label="Block"
                          value={
                            attempt?.blockNumber !== undefined
                              ? attempt.blockNumber.toLocaleString("en-US")
                              : "—"
                          }
                        />
                        <ReceiptItem
                          label="Gas used"
                          value={attempt?.actualGasUsed ?? "—"}
                          mono
                        />
                        <ReceiptItem
                          label="Gas cost"
                          value={
                            attempt?.actualGasCost
                              ? `${formatBot(attempt.actualGasCost)} BOT`
                              : "—"
                          }
                          mono
                        />
                        <ReceiptItem
                          label="Success flag"
                          value={attempt?.success ? "true" : "false"}
                          mono
                        />
                      </div>
                      {attempt?.transactionHash && !demoMode ? (
                        <a
                          href={explorerTransactionUrl(
                            controller.initialConfig.network.explorerUrl,
                            attempt.transactionHash,
                          )}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-3 flex items-center justify-between gap-2 rounded border border-lime/15 bg-black/15 px-2.5 py-2 font-mono text-[9px] text-paper/65 transition-colors hover:border-lime/30 hover:text-lime"
                        >
                          <span className="truncate">
                            tx {shortHash(attempt.transactionHash, 14, 10)}
                          </span>
                          <ArrowUpRight className="size-3 shrink-0" />
                        </a>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between border-t border-lime/15 pt-2.5">
                        <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/60">
                          {demoMode ? "Demo data · no tx" : "BOT Chain testnet"}
                        </span>
                        <a
                          href="#report"
                          className="text-[9.5px] font-medium text-lime hover:text-[#ddff99]"
                        >
                          View report →
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {status === "failed" && !showFailure ? (
                    <Callout tone="coral" className="mt-3">
                      The operation did not complete. Re-estimate before
                      retrying.
                    </Callout>
                  ) : null}

                  {status === "failed" || (demoMode && status === "confirmed") ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!demoMode && status === "failed" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={controller.estimateOperation}
                          loading={busy === "estimating"}
                        >
                          Re-estimate operation
                        </Button>
                      ) : null}
                      {demoMode && status === "confirmed" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={controller.resetDemoOperation}
                        >
                          Reload demo
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <div className="rounded-lg border border-line bg-panel/40 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <AlertIcon className="mt-0.5 size-3.5 shrink-0 text-amber" />
          <p className="text-[10px] leading-4.5 text-muted">
            A submitted operation is not a confirmed operation. Conform only
            changes the success state after the bundler receipt reports
            success=true and the outer transaction status is successful. Do not
            resubmit a pending hash.
          </p>
        </div>
      </div>
    </ConsoleSection>
  );
}

function GasCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[9px] text-paper/70">
        {BigInt(value).toLocaleString("en-US")}
      </div>
    </div>
  );
}

function ReceiptItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted/55">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-[10px] text-paper/75",
          mono && "font-mono text-[9.5px]",
        )}
      >
        {value}
      </div>
    </div>
  );
}
