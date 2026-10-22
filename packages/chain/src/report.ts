import { z } from "zod";
import {
  OFFICIAL_LINKS,
  PRODUCT_NAME,
  PRODUCT_VERSION,
} from "./constants";
import { summarizeChecks } from "./diagnostics";
import type { FailureReport } from "./errors";
import { sanitizeMessage } from "./errors";
import { shortHash } from "./format";
import type {
  CheckStatus,
  DiagnosticRun,
  RunSummary,
  UserOperationAttempt,
} from "./types";

export interface ConformanceReport {
  meta: {
    product: string;
    version: string;
    generatedAt: string;
    source: "live" | "demo";
    network: { name: string; chainId: number };
    configVerifiedAt: string;
    disclaimer: string;
  };
  compatibility: RunSummary;
  config: DiagnosticRun["config"];
  checks: DiagnosticRun["checks"];
  failures: FailureReport[];
  network?: DiagnosticRun["network"];
  bundler?: DiagnosticRun["bundler"];
  contracts?: DiagnosticRun["contracts"];
  account?: DiagnosticRun["account"];
  sponsorship: DiagnosticRun["sponsorship"];
  userOperation: {
    status: UserOperationAttempt["status"];
    mode: "live" | "demo";
    confirmedOnChain: boolean;
    userOpHash?: string;
    transactionHash?: string;
    blockNumber?: number;
    success?: boolean;
    reason?: string;
    actualGasUsed?: string;
    actualGasCost?: string;
    gas?: UserOperationAttempt["gas"];
    walletAddress?: string;
    accountAddress?: string;
    failure?: FailureReport;
    signatureIncluded: false;
  } | null;
  links: typeof OFFICIAL_LINKS;
  limitations: string[];
}

export function buildConformanceReport(input: {
  run: DiagnosticRun;
  userOperation?: UserOperationAttempt | null;
  generatedAt?: string;
}): ConformanceReport {
  const { run, userOperation } = input;
  const compatibility = summarizeChecks(run.checks);
  const confirmedOnChain =
    userOperation?.mode === "live" &&
    userOperation.status === "confirmed" &&
    userOperation.success === true;

  return {
    meta: {
      product: PRODUCT_NAME,
      version: PRODUCT_VERSION,
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      source: run.source,
      network: {
        name: run.config.network.name,
        chainId: run.config.network.id,
      },
      configVerifiedAt: run.config.verifiedAt,
      disclaimer:
        run.source === "demo"
          ? "This report contains labelled demo data. No transaction was signed or broadcast."
          : "This report reflects live BOT Chain testnet responses captured by Conform. A submitted UserOperation is only confirmed when the bundler returns a receipt with success=true and the outer transaction succeeded.",
    },
    compatibility,
    config: run.config,
    checks: run.checks,
    failures: run.failures,
    network: run.network,
    bundler: run.bundler,
    contracts: run.contracts,
    account: run.account,
    sponsorship: run.sponsorship,
    userOperation: userOperation
      ? {
          status: userOperation.status,
          mode: userOperation.mode,
          confirmedOnChain,
          userOpHash: userOperation.userOpHash,
          transactionHash: userOperation.transactionHash,
          blockNumber: userOperation.blockNumber,
          success: userOperation.success,
          reason: userOperation.reason,
          actualGasUsed: userOperation.actualGasUsed,
          actualGasCost: userOperation.actualGasCost,
          gas: userOperation.gas,
          walletAddress: userOperation.walletAddress,
          accountAddress: userOperation.accountAddress,
          failure: userOperation.failure,
          signatureIncluded: false,
        }
      : null,
    links: OFFICIAL_LINKS,
    limitations: [
      "Only the BOT Chain testnet network (chain ID 968) is supported.",
      "Bundler conformance is sampled through required method probes; it is not a full ERC-4337 bundler compliance suite.",
      "Sponsorship is not tested. A configured paymaster is only checked for bytecode and EntryPoint deposit.",
      "EOA Paymaster and EIP-7702 flows are outside the UserOperation path tested here.",
      "No private keys, seed phrases, or UserOperation signatures are included in this report.",
    ],
  };
}

export const ShareSummarySchema = z.object({
  v: z.literal(1),
  product: z.literal("Conform"),
  generatedAt: z.string(),
  source: z.enum(["live", "demo"]),
  network: z.object({
    name: z.string(),
    chainId: z.number().int(),
  }),
  result: z.enum(["passed", "attention", "failed", "incomplete"]),
  counts: z.object({
    pass: z.number().int().nonnegative(),
    warn: z.number().int().nonnegative(),
    fail: z.number().int().nonnegative(),
    skip: z.number().int().nonnegative(),
    unknown: z.number().int().nonnegative(),
  }),
  checks: z
    .array(
      z.object({
        label: z.string().max(120),
        stage: z.string().max(40),
        status: z.enum(["pass", "warn", "fail", "skip", "unknown"]),
      }),
    )
    .max(40),
  sponsorship: z.enum(["unknown", "configured"]),
  userOperation: z
    .object({
      status: z.string().max(40),
      mode: z.enum(["live", "demo"]),
      confirmedOnChain: z.boolean(),
      userOpHash: z.string().max(40).optional(),
      transactionHash: z.string().max(40).optional(),
      blockNumber: z.number().int().nonnegative().optional(),
    })
    .nullable(),
  failures: z
    .array(
      z.object({
        stage: z.string().max(40),
        method: z.string().max(120).optional(),
        code: z.string().max(20).optional(),
        message: z.string().max(320),
        suggestion: z.string().max(500),
      }),
    )
    .max(5),
  links: z.object({
    botChain: z.string().url(),
    explorer: z.string().url(),
    developerDocs: z.string().url(),
  }),
});

export type ShareSummary = z.infer<typeof ShareSummarySchema>;

function statusRows(run: DiagnosticRun): ShareSummary["checks"] {
  return run.checks.slice(0, 40).map((check) => ({
    label: check.label.slice(0, 120),
    stage: check.stage.slice(0, 40),
    status: check.status,
  }));
}

export function buildShareSummary(
  run: DiagnosticRun,
  userOperation?: UserOperationAttempt | null,
  generatedAt = new Date().toISOString(),
): ShareSummary {
  const summary = summarizeChecks(run.checks);
  const failures: ShareSummary["failures"] = [
    ...run.failures,
    ...(userOperation?.failure ? [userOperation.failure] : []),
  ]
    .slice(0, 5)
    .map((failure) => ({
      stage: failure.stage,
      method: failure.method,
      code: failure.aaCode ?? (failure.rpcCode ? String(failure.rpcCode) : undefined),
      message: sanitizeMessage(failure.message, 300),
      suggestion: sanitizeMessage(failure.suggestion, 480),
    }));

  const confirmedOnChain =
    userOperation?.mode === "live" &&
    userOperation.status === "confirmed" &&
    userOperation.success === true;

  return {
    v: 1,
    product: "Conform",
    generatedAt,
    source: run.source,
    network: {
      name: run.config.network.name,
      chainId: run.config.network.id,
    },
    result: summary.status,
    counts: {
      pass: summary.pass,
      warn: summary.warn,
      fail: summary.fail,
      skip: summary.skip,
      unknown: summary.unknown,
    },
    checks: statusRows(run),
    sponsorship: run.sponsorship.state,
    userOperation: userOperation
      ? {
          status: userOperation.status,
          mode: userOperation.mode,
          confirmedOnChain,
          userOpHash: shortHash(userOperation.userOpHash, 10, 8),
          transactionHash: shortHash(userOperation.transactionHash, 10, 8),
          blockNumber: userOperation.blockNumber,
        }
      : null,
    failures,
    links: {
      botChain: OFFICIAL_LINKS.botChain,
      explorer: OFFICIAL_LINKS.explorer,
      developerDocs: OFFICIAL_LINKS.developerDocs,
    },
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function encodeShareSummary(summary: ShareSummary): string {
  const json = JSON.stringify(summary);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeShareSummary(encoded: string): ShareSummary | null {
  if (!encoded || encoded.length > 8_000) return null;
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const withPadding = padded.padEnd(
      padded.length + ((4 - (padded.length % 4)) % 4),
      "=",
    );
    const bytes = base64ToBytes(withPadding);
    const json = new TextDecoder().decode(bytes);
    const parsed = ShareSummarySchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function shareUrlFor(encoded: string, origin: string): string {
  const url = new URL("/report", origin);
  url.searchParams.set("d", encoded);
  return url.toString();
}

export function countStatus(
  checks: DiagnosticRun["checks"],
  status: CheckStatus,
): number {
  return checks.filter((check) => check.status === status).length;
}
