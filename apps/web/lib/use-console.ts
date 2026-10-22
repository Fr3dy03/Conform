"use client";

import { useMemo, useRef, useState } from "react";
import { getAddress, isAddress, type Hex } from "viem";
import {
  HttpJsonRpcTransport,
  attachSignature,
  createDemoPreparedUserOperation,
  createDemoReceipt,
  createDemoRun,
  isConfirmedReceipt,
  normalizeFailure,
  prepareSimpleAccountUserOperation,
  runAccountDiagnostics,
  runDiagnostics,
  submitUserOperation,
  summarizeChecks,
  waitForUserOperationReceipt,
  type AccountSnapshot,
  type DiagnosticRun,
  type FailureReport,
  type PreparedUserOperation,
  type PublicConfig,
  type RpcUserOperation,
  type RunSummary,
  type UserOperationAttempt,
} from "@conform/chain";
import { clientConfigFromPublic } from "@/lib/client-config";
import {
  connectWallet as connectInjectedWallet,
  readWalletChainId,
  sendNativeTransfer,
  signUserOperationHash,
  switchToBotChain,
  waitForFundingTransaction,
  WalletError,
  type WalletConnection,
} from "@/lib/wallet";

export type ConsoleSource = "live" | "demo";

export type ConsoleBusy =
  | null
  | "deriving"
  | "estimating"
  | "signing"
  | "submitting"
  | "polling";

export interface ConsoleNotice {
  tone: "neutral" | "lime" | "amber" | "coral";
  title: string;
  message: string;
}

export interface FundingState {
  status: "idle" | "submitting" | "pending" | "confirmed" | "failed";
  hash?: Hex;
  blockNumber?: number;
  message?: string;
}

interface DemoBootstrap {
  run: DiagnosticRun;
  prepared: PreparedUserOperation;
}

function makeDemoBootstrap(): DemoBootstrap {
  return {
    run: createDemoRun(),
    prepared: createDemoPreparedUserOperation(),
  };
}

function now(): string {
  return new Date().toISOString();
}

function isAddressLike(value: string): boolean {
  return isAddress(value.trim());
}

function sameAddress(left?: string | null, right?: string | null): boolean {
  if (!left || !right) return false;
  return left.toLowerCase() === right.toLowerCase();
}

export function useConsole(
  initialConfig: PublicConfig,
  configError: string | null,
  initialDemo: boolean,
) {
  const [bootstrap] = useState<DemoBootstrap | null>(() =>
    initialDemo ? makeDemoBootstrap() : null,
  );
  const config = useMemo(
    () => clientConfigFromPublic(initialConfig),
    [initialConfig],
  );
  const rpc = useMemo(
    () =>
      new HttpJsonRpcTransport("/api/rpc", {
        label: "Conform RPC relay",
        timeoutMs: 25_000,
      }),
    [],
  );
  const bundler = useMemo(
    () =>
      new HttpJsonRpcTransport("/api/bundler", {
        label: "Conform bundler relay",
        timeoutMs: 35_000,
      }),
    [],
  );

  const [source, setSource] = useState<ConsoleSource>(
    initialDemo ? "demo" : "live",
  );
  const [run, setRun] = useState<DiagnosticRun | null>(bootstrap?.run ?? null);
  const [account, setAccount] = useState<AccountSnapshot | null>(
    bootstrap?.run.account ?? null,
  );
  const [owner, setOwnerState] = useState(
    bootstrap?.run.account?.owner ?? "",
  );
  const [prepared, setPrepared] = useState<PreparedUserOperation | null>(
    bootstrap?.prepared ?? null,
  );
  const [attempt, setAttempt] = useState<UserOperationAttempt | null>(() => {
    if (!bootstrap) return null;
    return {
      status: "estimated",
      mode: "demo",
      userOpHash: bootstrap.prepared.userOpHash,
      gas: bootstrap.prepared.gas,
      accountAddress: bootstrap.run.account?.address,
      walletAddress: bootstrap.run.account?.owner,
      startedAt: bootstrap.run.startedAt,
      updatedAt: bootstrap.run.finishedAt,
    };
  });

  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState<ConsoleBusy>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [notice, setNotice] = useState<ConsoleNotice | null>(null);
  const [userOpError, setUserOpError] = useState<string | null>(null);
  const [accountFailure, setAccountFailure] = useState<FailureReport | null>(
    null,
  );
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [receiptAttempts, setReceiptAttempts] = useState(0);
  const [fundingAmount, setFundingAmount] = useState("0.05");
  const [funding, setFunding] = useState<FundingState>({ status: "idle" });

  const signedOperationRef = useRef<RpcUserOperation | null>(null);

  const summary: RunSummary | null = run ? summarizeChecks(run.checks) : null;
  const demoMode = source === "demo";
  const ownerValid = owner.trim().length > 0 && isAddressLike(owner);
  const walletMatchesOwner =
    Boolean(wallet) && Boolean(owner) && sameAddress(wallet?.address, owner);

  function clearSignedOperation() {
    signedOperationRef.current = null;
    setReceiptAttempts(0);
  }

  function clearOperation() {
    clearSignedOperation();
    setPrepared(null);
    setAttempt(null);
    setUserOpError(null);
    setAccountFailure(null);
    setFunding({ status: "idle" });
  }

  function setOwner(value: string) {
    setOwnerState(value);
    setAccount(null);
    clearOperation();
  }

  function confirmDiscardPending(): boolean {
    if (
      attempt?.mode === "live" &&
      (attempt.status === "submitted" || attempt.status === "pending")
    ) {
      return window.confirm(
        "A live UserOperation is already submitted and may still be included. Leaving this view clears the local trace, but does not cancel the operation. Continue?",
      );
    }
    return true;
  }

  function populateDemo() {
    const demo = createDemoRun();
    const fixture = createDemoPreparedUserOperation();
    setSource("demo");
    setRun(demo);
    setAccount(demo.account ?? null);
    setOwnerState(demo.account?.owner ?? "");
    setPrepared(fixture);
    setAttempt({
      status: "estimated",
      mode: "demo",
      userOpHash: fixture.userOpHash,
      gas: fixture.gas,
      accountAddress: demo.account?.address,
      walletAddress: demo.account?.owner,
      startedAt: demo.startedAt,
      updatedAt: demo.finishedAt,
    });
    clearSignedOperation();
    setUserOpError(null);
    setAccountFailure(null);
    setNotice(null);
    setFunding({ status: "idle" });
  }

  function switchToDemo() {
    if (!confirmDiscardPending()) return;
    populateDemo();
  }

  function switchToLive() {
    if (!confirmDiscardPending()) return;
    setSource("live");
    setRun(null);
    setAccount(null);
    setOwnerState("");
    clearOperation();
    setNotice(null);
  }

  async function runLiveChecks() {
    if (!confirmDiscardPending()) return;
    const hadDemoState = source === "demo";
    const pending =
      attempt?.mode === "live" &&
      (attempt.status === "submitted" || attempt.status === "pending");

    setSource("live");
    setRunning(true);
    setNotice(null);
    setUserOpError(null);
    if (hadDemoState || !pending) {
      setPrepared(null);
      setAttempt(null);
      clearSignedOperation();
      setFunding({ status: "idle" });
    }

    const trimmedOwner = owner.trim();
    const validOwner =
      trimmedOwner.length > 0 && isAddressLike(trimmedOwner)
        ? getAddress(trimmedOwner)
        : undefined;
    if (trimmedOwner.length > 0 && !validOwner) {
      setNotice({
        tone: "amber",
        title: "Invalid owner address",
        message:
          "The owner field is not a valid 20-byte address, so the run covered infrastructure only. Enter a valid owner to include the account path.",
      });
    }

    try {
      const result = await runDiagnostics({
        config,
        rpc,
        bundler,
        owner: validOwner,
        source: "live",
      });
      setRun(result);
      setAccount(result.account ?? null);
      if (result.account) {
        setOwnerState(result.account.owner);
      }
    } catch (error) {
      const failure = normalizeFailure({
        stage: "network",
        error,
        occurredAt: now(),
      });
      setNotice({
        tone: "coral",
        title: failure.title,
        message: `${failure.message} ${failure.suggestion}`,
      });
    } finally {
      setRunning(false);
    }
  }

  function mergeAccountResult(
    result: Awaited<ReturnType<typeof runAccountDiagnostics>>,
  ) {
    setAccount(result.snapshot ?? null);
    setAccountFailure(result.failures[0] ?? null);
    if (result.snapshot) {
      setOwnerState(result.snapshot.owner);
    }
    setRun((previous) => {
      if (!previous || previous.source !== "live") return previous;
      return {
        ...previous,
        checks: [
          ...previous.checks.filter((check) => check.stage !== "account"),
          ...result.checks,
        ],
        account: result.snapshot,
        failures: [
          ...previous.failures.filter((failure) => failure.stage !== "account"),
          ...result.failures,
        ],
        finishedAt: now(),
      };
    });
  }

  async function deriveAccount(): Promise<AccountSnapshot | null> {
    if (demoMode) {
      const demoAccount = run?.account ?? account;
      if (demoAccount) {
        setAccount(demoAccount);
        setOwnerState(demoAccount.owner);
      }
      return demoAccount ?? null;
    }

    if (!isAddressLike(owner)) {
      setUserOpError(
        "Enter a valid 20-byte owner address, or connect a wallet to fill it.",
      );
      return null;
    }

    clearOperation();
    setBusy("deriving");
    try {
      const result = await runAccountDiagnostics(
        rpc,
        config,
        getAddress(owner),
        0n,
      );
      mergeAccountResult(result);
      if (!result.snapshot) {
        setUserOpError(
          result.failures[0]?.message ??
            "The account could not be derived from this owner.",
        );
      }
      return result.snapshot ?? null;
    } catch (error) {
      const failure = normalizeFailure({
        stage: "account",
        error,
        occurredAt: now(),
      });
      setAccountFailure(failure);
      setUserOpError(failure.message);
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function ensureAccount(): Promise<AccountSnapshot | null> {
    if (!isAddressLike(owner)) {
      setUserOpError(
        "Enter a valid 20-byte owner address, or connect a wallet to fill it.",
      );
      return null;
    }
    if (account && sameAddress(account.owner, owner)) return account;
    return deriveAccount();
  }

  async function estimateOperation() {
    if (demoMode) {
      const demo = createDemoPreparedUserOperation();
      setPrepared(demo);
      setAttempt({
        status: "estimated",
        mode: "demo",
        userOpHash: demo.userOpHash,
        gas: demo.gas,
        accountAddress: run?.account?.address ?? account?.address,
        walletAddress: run?.account?.owner ?? account?.owner,
        startedAt: now(),
        updatedAt: now(),
      });
      setUserOpError(null);
      return;
    }

    setUserOpError(null);
    setBusy("estimating");
    try {
      const snapshot = await ensureAccount();
      if (!snapshot) return;
      const next = await prepareSimpleAccountUserOperation({
        config,
        bundler,
        sender: snapshot.address,
        owner: snapshot.owner,
        deployed: snapshot.deployed,
        nonce: BigInt(snapshot.nonce),
        salt: BigInt(snapshot.salt),
      });
      setPrepared(next);
      clearSignedOperation();
      setAttempt({
        status: "estimated",
        mode: "live",
        userOpHash: next.userOpHash,
        gas: next.gas,
        accountAddress: snapshot.address,
        walletAddress: wallet?.address,
        startedAt: now(),
        updatedAt: now(),
      });
      setUserOpError(null);
    } catch (error) {
      const failure = normalizeFailure({
        stage: "simulation",
        method: "eth_estimateUserOperationGas",
        error,
        occurredAt: now(),
      });
      setAttempt({
        status: "failed",
        mode: "live",
        failure,
        accountAddress: account?.address,
        walletAddress: wallet?.address,
        startedAt: now(),
        updatedAt: now(),
      });
      setUserOpError(failure.message);
    } finally {
      setBusy(null);
    }
  }

  async function connect() {
    setWalletBusy(true);
    setUserOpError(null);
    try {
      const connection = await connectInjectedWallet();
      setWallet(connection);
      if (!owner.trim()) {
        setOwnerState(connection.address);
        setAccount(null);
        clearOperation();
      } else if (!sameAddress(connection.address, owner)) {
        setUserOpError(
          `Connected ${connection.address}, but the configured owner is ${owner.trim()}. Switch accounts in the wallet before signing.`,
        );
      }
    } catch (error) {
      setUserOpError(
        error instanceof WalletError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Wallet connection failed.",
      );
    } finally {
      setWalletBusy(false);
    }
  }

  async function switchChain() {
    setWalletBusy(true);
    setUserOpError(null);
    try {
      await switchToBotChain();
      const chainId = await readWalletChainId();
      setWallet((previous) =>
        previous ? { ...previous, chainId } : previous,
      );
    } catch (error) {
      setUserOpError(
        error instanceof Error ? error.message : "Could not switch networks.",
      );
    } finally {
      setWalletBusy(false);
    }
  }

  function disconnect() {
    setWallet(null);
    setUserOpError(null);
  }

  async function signOperation() {
    if (!prepared) {
      setUserOpError("Estimate a UserOperation before signing.");
      return;
    }
    if (!wallet) {
      setUserOpError(
        "Connect the owner wallet to sign the raw UserOperation hash.",
      );
      return;
    }
    if (!isAddressLike(owner)) {
      setUserOpError("The owner address is invalid.");
      return;
    }
    const normalizedOwner = getAddress(owner);
    if (!sameAddress(wallet.address, normalizedOwner)) {
      setUserOpError(
        `The connected wallet (${wallet.address}) is not the SimpleAccount owner (${normalizedOwner}).`,
      );
      return;
    }

    setBusy("signing");
    setUserOpError(null);
    try {
      const fresh = await runAccountDiagnostics(rpc, config, normalizedOwner, 0n);
      if (!fresh.snapshot) {
        setUserOpError(
          fresh.failures[0]?.message ??
            "Could not refresh the account state before signing.",
        );
        return;
      }
      setAccount(fresh.snapshot);
      const freshNonce = fresh.snapshot.nonce;
      const preparedNonce = BigInt(prepared.operation.nonce).toString();
      if (freshNonce !== preparedNonce) {
        setPrepared(null);
        setAttempt(null);
        clearSignedOperation();
        setUserOpError(
          `The EntryPoint nonce changed from ${preparedNonce} to ${freshNonce}. Re-estimate the UserOperation before signing.`,
        );
        return;
      }
      const hasFactory = Boolean(prepared.operation.factory);
      const staleDeployment =
        (hasFactory && fresh.snapshot.deployed) ||
        (!hasFactory && !fresh.snapshot.deployed);
      if (staleDeployment) {
        setPrepared(null);
        setAttempt(null);
        clearSignedOperation();
        setUserOpError(
          "The account deployment state changed after estimation. Re-estimate the UserOperation.",
        );
        return;
      }

      const signature = await signUserOperationHash(
        prepared.userOpHash as Hex,
        normalizedOwner,
      );
      signedOperationRef.current = attachSignature(prepared, signature);
      setAttempt((previous) =>
        previous
          ? {
              ...previous,
              status: "signed",
              walletAddress: wallet.address,
              failure: undefined,
              updatedAt: now(),
            }
          : previous,
      );
    } catch (error) {
      const failure = normalizeFailure({
        stage: "signature",
        error,
        occurredAt: now(),
      });
      setUserOpError(failure.message);
      setAttempt((previous) =>
        previous
          ? {
              ...previous,
              status: "failed",
              failure,
              walletAddress: wallet.address,
              updatedAt: now(),
            }
          : previous,
      );
    } finally {
      setBusy(null);
    }
  }

  async function pollReceipt(hash: Hex) {
    setBusy("polling");
    setReceiptAttempts(0);
    setAttempt((previous) =>
      previous
        ? {
            ...previous,
            status: "pending",
            userOpHash: hash,
            updatedAt: now(),
          }
        : previous,
    );
    try {
      const result = await waitForUserOperationReceipt(bundler, hash, {
        timeoutMs: 120_000,
        intervalMs: 2_000,
        onPoll: setReceiptAttempts,
      });
      if (result.timedOut) {
        setUserOpError(
          "No receipt after two minutes. The operation may still be pending; check again or inspect the account on the explorer. Do not resubmit blindly.",
        );
        return;
      }
      const receipt = result.receipt;
      if (!receipt) return;
      const confirmed = isConfirmedReceipt(receipt);
      if (confirmed) {
        setAttempt((previous) =>
          previous
            ? {
                ...previous,
                status: "confirmed",
                success: true,
                userOpHash: receipt.userOpHash,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                actualGasUsed: receipt.actualGasUsed,
                actualGasCost: receipt.actualGasCost,
                reason: receipt.reason,
                failure: undefined,
                updatedAt: now(),
              }
            : previous,
        );
        setUserOpError(null);
      } else {
        const failure = normalizeFailure({
          stage: "receipt",
          method: "eth_getUserOperationReceipt",
          error: new Error(
            receipt.reason ||
              `Receipt returned success=${receipt.success}${
                receipt.outerStatus
                  ? ` with outer status ${receipt.outerStatus}`
                  : ""
              }. The UserOperation is not confirmed as successful.`,
          ),
          occurredAt: now(),
        });
        setAttempt((previous) =>
          previous
            ? {
                ...previous,
                status: "failed",
                success: false,
                userOpHash: receipt.userOpHash,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                actualGasUsed: receipt.actualGasUsed,
                actualGasCost: receipt.actualGasCost,
                reason: receipt.reason,
                failure,
                updatedAt: now(),
              }
            : previous,
        );
        setUserOpError(failure.message);
      }
    } catch (error) {
      const failure = normalizeFailure({
        stage: "receipt",
        method: "eth_getUserOperationReceipt",
        error,
        occurredAt: now(),
      });
      setUserOpError(failure.message);
      setAttempt((previous) =>
        previous
          ? {
              ...previous,
              status: "pending",
              failure,
              updatedAt: now(),
            }
          : previous,
      );
    } finally {
      setBusy(null);
    }
  }

  async function submitSignedOperation() {
    if (!signedOperationRef.current) {
      setUserOpError(
        "Sign the UserOperation with the owner wallet before submitting.",
      );
      return;
    }
    setBusy("submitting");
    setUserOpError(null);
    try {
      const result = await submitUserOperation({
        bundler,
        entryPoint: config.entryPoint,
        operation: signedOperationRef.current,
        expectedUserOpHash: prepared?.userOpHash,
      });
      signedOperationRef.current = null;
      setAttempt((previous) =>
        previous
          ? {
              ...previous,
              status: "pending",
              userOpHash: result.userOpHash,
              failure: undefined,
              updatedAt: result.submittedAt,
            }
          : previous,
      );
      await pollReceipt(result.userOpHash);
    } catch (error) {
      signedOperationRef.current = null;
      const failure = normalizeFailure({
        stage: "submission",
        method: "eth_sendUserOperation",
        error,
        occurredAt: now(),
      });
      setUserOpError(failure.message);
      setAttempt((previous) =>
        previous
          ? {
              ...previous,
              status: "failed",
              failure,
              updatedAt: now(),
            }
          : previous,
      );
      setBusy(null);
    }
  }

  async function checkReceiptAgain() {
    const hash = attempt?.userOpHash;
    if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      setUserOpError("No submitted UserOperation hash is available.");
      return;
    }
    await pollReceipt(hash as Hex);
  }

  function simulateDemoReceipt() {
    if (!demoMode) return;
    const receipt = createDemoReceipt();
    setAttempt((previous) => ({
      ...(previous ?? {
        mode: "demo" as const,
        startedAt: now(),
      }),
      status: "confirmed",
      mode: "demo",
      success: true,
      userOpHash: receipt.userOpHash,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      actualGasUsed: receipt.actualGasUsed,
      actualGasCost: receipt.actualGasCost,
      accountAddress: run?.account?.address ?? account?.address,
      walletAddress: run?.account?.owner ?? account?.owner,
      updatedAt: now(),
    }));
    setUserOpError(null);
  }

  function resetDemoOperation() {
    if (!demoMode) return;
    populateDemo();
  }

  async function fundAccount() {
    if (!account) {
      setUserOpError("Derive the smart account before funding it.");
      return;
    }
    if (!wallet) {
      setUserOpError("Connect a wallet before sending a funding transaction.");
      return;
    }
    setUserOpError(null);
    setFunding({ status: "submitting" });
    try {
      if (wallet.chainId !== config.network.id) {
        await switchToBotChain();
        const chainId = await readWalletChainId();
        setWallet((previous) =>
          previous ? { ...previous, chainId } : previous,
        );
      }
      const hash = await sendNativeTransfer({
        from: wallet.address,
        to: account.address,
        amountBot: fundingAmount,
      });
      setFunding({
        status: "pending",
        hash,
        message: "Funding transaction submitted. Waiting for confirmation.",
      });
      const result = await waitForFundingTransaction(rpc, hash);
      if (!result.confirmed) {
        setFunding({
          status: "pending",
          hash,
          message:
            "No funding receipt yet. This transaction is not the UserOperation; check the explorer.",
        });
        return;
      }
      if (!result.success) {
        setFunding({
          status: "failed",
          hash,
          blockNumber: result.blockNumber,
          message: "The funding transaction reverted.",
        });
        return;
      }
      setFunding({
        status: "confirmed",
        hash,
        blockNumber: result.blockNumber,
        message: "Funding transaction confirmed. Account state will refresh.",
      });
      await deriveAccount();
    } catch (error) {
      setFunding({
        status: "failed",
        message:
          error instanceof Error
            ? error.message
            : "The funding transaction failed.",
      });
    }
  }

  return {
    initialConfig,
    config,
    configError,
    source,
    demoMode,
    run,
    summary,
    account,
    owner,
    ownerValid,
    prepared,
    attempt,
    wallet,
    walletMatchesOwner,
    running,
    busy,
    walletBusy,
    notice,
    userOpError,
    accountFailure,
    receiptAttempts,
    funding,
    fundingAmount,
    setFundingAmount,
    setOwner,
    setNotice,
    runLiveChecks,
    switchToDemo,
    switchToLive,
    deriveAccount,
    estimateOperation,
    connect,
    switchChain,
    disconnect,
    signOperation,
    submitSignedOperation,
    checkReceiptAgain,
    simulateDemoReceipt,
    resetDemoOperation,
    fundAccount,
  };
}

export type ConsoleController = ReturnType<typeof useConsole>;
