import type { Address, Hex } from "viem";
import type { PublicConfig } from "./config";
import type { FailureReport } from "./errors";

export type DiagnosticStage =
  | "network"
  | "bundler"
  | "contracts"
  | "account"
  | "sponsorship";

export type CheckStatus = "pass" | "warn" | "fail" | "skip" | "unknown";

export type RunStatus = "passed" | "attention" | "failed" | "incomplete";

export interface CheckDetail {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
  tone?: "default" | "positive" | "warning" | "negative";
}

export interface CheckResult {
  id: string;
  stage: DiagnosticStage;
  label: string;
  status: CheckStatus;
  summary: string;
  method?: string;
  durationMs?: number;
  details?: CheckDetail[];
  failure?: FailureReport;
}

export interface NetworkSnapshot {
  chainId: number;
  chainIdHex: string;
  blockNumber: number;
  blockHash?: string;
  blockTimestamp?: number;
  clientVersion: string;
  latencyMs: number;
  rpcHost: string;
  checkedAt: string;
}

export interface BundlerSnapshot {
  chainId: number;
  chainIdHex: string;
  supportedEntryPoints: Address[];
  methods: Array<{
    method: string;
    present: boolean;
    required: boolean;
    note: string;
  }>;
  latencyMs: number;
  bundlerHost: string;
  checkedAt: string;
}

export interface ContractSnapshot {
  entryPoint: {
    address: Address;
    codeSize: number;
    deployed: boolean;
  };
  factory: {
    address: Address;
    codeSize: number;
    deployed: boolean;
    implementation: Address | null;
  };
  implementation: {
    address: Address;
    codeSize: number;
    deployed: boolean;
  };
  checkedAt: string;
}

export interface AccountSnapshot {
  owner: Address;
  salt: string;
  address: Address;
  deployed: boolean;
  nonce: string;
  entryPointDeposit: string;
  nativeBalance: string;
  checkedAt: string;
}

export interface SponsorshipSnapshot {
  state: "unknown" | "configured";
  paymasterAddress?: Address;
  codePresent?: boolean;
  deposit?: string;
  disclosure: string;
  checkedAt: string;
}

export interface FeeQuote {
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
}

export interface RpcUserOperation {
  sender: Address;
  nonce: Hex;
  factory?: Address;
  factoryData?: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  signature: Hex;
  paymaster?: Address;
  paymasterVerificationGasLimit?: Hex;
  paymasterPostOpGasLimit?: Hex;
  paymasterData?: Hex;
}

export interface UserOperationGas {
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface PreparedUserOperation {
  operation: RpcUserOperation;
  gas: UserOperationGas;
  userOpHash: Hex;
  feeQuote: FeeQuote;
  target: Address;
  summary: string;
}

export interface UserOperationReceiptSnapshot {
  userOpHash: Hex;
  success: boolean;
  transactionHash: Hex;
  blockNumber?: number;
  outerStatus?: string;
  actualGasCost?: string;
  actualGasUsed?: string;
  reason?: string;
  paymaster?: Address;
}

export type UserOperationStatus =
  | "idle"
  | "estimating"
  | "estimated"
  | "signing"
  | "signed"
  | "submitting"
  | "submitted"
  | "confirmed"
  | "failed"
  | "pending";

export interface UserOperationAttempt {
  status: UserOperationStatus;
  mode: "live" | "demo";
  userOpHash?: string;
  transactionHash?: string;
  blockNumber?: number;
  success?: boolean;
  reason?: string;
  actualGasUsed?: string;
  actualGasCost?: string;
  gas?: UserOperationGas;
  walletAddress?: string;
  accountAddress?: string;
  startedAt?: string;
  updatedAt?: string;
  failure?: FailureReport;
}

export interface DiagnosticRun {
  source: "live" | "demo";
  config: PublicConfig;
  checks: CheckResult[];
  network?: NetworkSnapshot;
  bundler?: BundlerSnapshot;
  contracts?: ContractSnapshot;
  account?: AccountSnapshot;
  sponsorship: SponsorshipSnapshot;
  failures: FailureReport[];
  startedAt: string;
  finishedAt: string;
}

export interface RunSummary {
  status: RunStatus;
  pass: number;
  warn: number;
  fail: number;
  skip: number;
  unknown: number;
  total: number;
}
