import { z } from "zod";

export type FailureStage =
  | "config"
  | "network"
  | "bundler"
  | "contracts"
  | "account"
  | "sponsorship"
  | "simulation"
  | "signature"
  | "submission"
  | "receipt"
  | "report";

export const FailureReportSchema = z.object({
  stage: z.enum([
    "config",
    "network",
    "bundler",
    "contracts",
    "account",
    "sponsorship",
    "simulation",
    "signature",
    "submission",
    "receipt",
    "report",
  ]),
  method: z.string().optional(),
  title: z.string(),
  message: z.string(),
  suggestion: z.string(),
  rpcCode: z.number().optional(),
  aaCode: z.string().optional(),
  occurredAt: z.string(),
});

export type FailureReport = z.infer<typeof FailureReportSchema>;

export class JsonRpcError extends Error {
  readonly code: number;
  readonly data?: unknown;
  readonly method: string;

  constructor(
    method: string,
    code: number,
    message: string,
    data?: unknown,
  ) {
    super(message);
    this.name = "JsonRpcError";
    this.method = method;
    this.code = code;
    this.data = data;
  }
}

export class TransportError extends Error {
  readonly method: string;
  readonly status?: number;

  constructor(method: string, message: string, status?: number) {
    super(message);
    this.name = "TransportError";
    this.method = method;
    this.status = status;
  }
}

const AA_HINTS: Record<string, string> = {
  AA10:
    "The sender already has code. Remove factory and factoryData from the UserOperation and refresh the account state.",
  AA13:
    "The account initialization call failed. Check the factory address, factoryData, and SimpleAccount implementation.",
  AA21:
    "The smart account could not pay its prefund. Send test BOT to the smart-account address or fund its EntryPoint deposit, then re-estimate.",
  AA22:
    "The UserOperation gas limits or time range expired. Re-read the gas quote and estimate again immediately before submitting.",
  AA23:
    "Account validation reverted. Verify the SimpleAccount implementation, owner, nonce and callData, then reproduce the call against the testnet RPC.",
  AA24:
    "The signature did not validate. Confirm the wallet chain, EntryPoint address, chain ID, owner address and userOpHash before signing again.",
  AA25:
    "The EntryPoint nonce is stale or invalid. Re-read getNonce(sender, key) and rebuild the UserOperation.",
  AA31:
    "The paymaster's EntryPoint deposit is too low. Fund the paymaster deposit or continue without sponsorship.",
  AA32:
    "The paymaster validation window is invalid. Ask the paymaster service for a fresh paymasterData payload.",
  AA33:
    "Paymaster validation reverted. Check the sponsorship policy, paymaster signature and configured paymaster address.",
  AA34:
    "The paymaster returned invalid validation data. Verify that it implements EntryPoint v0.7 correctly.",
  AA36:
    "Paymaster validation exceeded its gas limit. Increase paymasterVerificationGasLimit or use a different paymaster.",
  AA93:
    "paymasterAndData is malformed. Omit all paymaster fields, or provide the v0.7 paymaster fields together.",
};

const STAGE_SUGGESTIONS: Record<FailureStage, string> = {
  config:
    "Check the server environment values and restart the app. RPC and bundler URLs must be valid HTTPS endpoints.",
  network:
    "Verify BOT_TESTNET_RPC_URL, then retry the chain ID call. If the endpoint responds with a mismatched chain, do not continue with this workspace.",
  bundler:
    "Verify BOT_TESTNET_BUNDLER_URL and that it points to the BOT Chain testnet bundler, not a mainnet or third-party endpoint.",
  contracts:
    "Confirm the EntryPoint, factory and implementation addresses against the current BOT Chain account-abstraction docs, then check the testnet explorer.",
  account:
    "Recheck the owner address and factory, then call SimpleAccountFactory.getAddress again. A counterfactual account must match the sender in the UserOperation.",
  sponsorship:
    "Leave sponsorship unknown unless you have an independently verified EntryPoint v0.7 paymaster deployed on BOT Chain testnet.",
  simulation:
    "Re-read the EntryPoint nonce and account balances, verify the owner signature path, then run eth_estimateUserOperationGas again.",
  signature:
    "Confirm the wallet is on BOT Chain Testnet (968), the selected account is the SimpleAccount owner, and the message is the raw userOpHash.",
  submission:
    "Do not assume success. Check the bundler-supported EntryPoints, re-estimate gas, and verify the EntryPoint nonce before resubmitting.",
  receipt:
    "The operation may still be pending. Check the bundler receipt method and the BOT Chain testnet explorer before resubmitting.",
  report:
    "Retry the export. If it still fails, copy the readable failure details instead of the JSON report.",
};

function extractCode(error: unknown): number | undefined {
  if (error instanceof JsonRpcError) return error.code;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "number"
  ) {
    return (error as { code: number }).code;
  }
  return undefined;
}

function extractData(error: unknown): unknown {
  if (error instanceof JsonRpcError) return error.data;
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error
  ) {
    return (error as { data?: unknown }).data;
  }
  return undefined;
}

export function findAaCode(error: unknown): string | undefined {
  let haystack = "";
  if (typeof error === "string") {
    haystack = error;
  } else if (error instanceof Error) {
    haystack = `${error.message} ${JSON.stringify(extractData(error) ?? "")}`;
  } else if (error !== undefined) {
    try {
      haystack = JSON.stringify(error);
    } catch {
      haystack = String(error);
    }
  }
  const match = haystack.match(/\bAA\d{2}\b/);
  return match?.[0];
}

function readableError(error: unknown): string {
  if (error instanceof JsonRpcError) {
    return error.message || `JSON-RPC error ${error.code}`;
  }
  if (error instanceof TransportError) {
    return error.message;
  }
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
      .join("; ");
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

export function sanitizeMessage(value: string, maxLength = 600): string {
  let output = value
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[endpoint]")
    .replace(/0x[0-9a-fA-F]{64,}/g, "[hex omitted]")
    .replace(
      /(?:api[-_]?key|apikey|access[-_]?token|secret|authorization)\s*[:=]\s*[^\s,;]+/gi,
      "[credential omitted]",
    )
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [credential omitted]")
    .replace(/\s+/g, " ")
    .trim();
  if (output.length > maxLength) {
    output = `${output.slice(0, maxLength - 1)}…`;
  }
  return output || "No readable error message was returned";
}

function titleFor(stage: FailureStage, code?: number, aaCode?: string): string {
  if (aaCode) return `UserOperation rejected with ${aaCode}`;
  if (code === -32601) return "RPC method not available";
  if (code === -32600 || code === -32602) return "RPC payload rejected";
  if (code === 429) return "RPC endpoint rate limited";
  switch (stage) {
    case "network":
      return "Network check failed";
    case "bundler":
      return "Bundler check failed";
    case "contracts":
      return "Contract check failed";
    case "account":
      return "Account check failed";
    case "sponsorship":
      return "Sponsorship check failed";
    case "simulation":
      return "UserOperation simulation failed";
    case "signature":
      return "Signature request failed";
    case "submission":
      return "Bundler rejected the UserOperation";
    case "receipt":
      return "Receipt verification failed";
    case "report":
      return "Report generation failed";
    case "config":
      return "Configuration error";
  }
}

function suggestionFor(
  stage: FailureStage,
  code: number | undefined,
  aaCode: string | undefined,
  message: string,
): string {
  if (aaCode && AA_HINTS[aaCode]) return AA_HINTS[aaCode] as string;
  if (code === -32601) {
    return "This endpoint does not expose the method. Confirm that the URL is the BOT Chain bundler RPC and that its software supports ERC-4337 v0.7.";
  }
  if (code === -32600 || code === -32602) {
    return "Check the v0.7 UserOperation field set and quantity encoding: all numeric fields must be 0x-prefixed quantities and addresses must be 20 bytes.";
  }
  if (code === 429) {
    return "Wait for the endpoint's rate limit to reset, then run the check again. Do not switch to an unverified RPC endpoint.";
  }
  if (/invalid entrypoint/i.test(message)) {
    return "The bundler does not support the configured EntryPoint. Compare the bundler's eth_supportedEntryPoints result with the BOT Chain v0.7 EntryPoint.";
  }
  if (/chain.?id|network mismatch/i.test(message)) {
    return "The RPC and bundler may be on different networks. Verify that both report chain ID 968 (0x3c8) before retrying.";
  }
  if (/timeout|timed out|abort/i.test(message)) {
    return "The endpoint did not answer in time. Retry once, then verify connectivity to the BOT Chain testnet endpoint before changing payloads.";
  }
  if (/fetch failed|network request failed|econnrefused|enotfound/i.test(message)) {
    return "The endpoint could not be reached from the server. Verify the configured URL, DNS and outbound network access.";
  }
  return STAGE_SUGGESTIONS[stage];
}

export function normalizeFailure(input: {
  stage: FailureStage;
  method?: string;
  error: unknown;
  occurredAt?: string;
}): FailureReport {
  const rpcCode = extractCode(input.error);
  const aaCode = findAaCode(input.error) ?? findAaCode(extractData(input.error));
  const message = sanitizeMessage(readableError(input.error));
  return {
    stage: input.stage,
    method: input.method,
    title: titleFor(input.stage, rpcCode, aaCode),
    message,
    suggestion: suggestionFor(input.stage, rpcCode, aaCode, message),
    rpcCode,
    aaCode,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}

export function formatFailureLine(failure: FailureReport): string {
  const method = failure.method ? ` [${failure.method}]` : "";
  const code = failure.aaCode ?? (failure.rpcCode ? String(failure.rpcCode) : "");
  return `${failure.title}${method}${code ? ` (${code})` : ""}: ${failure.message}`;
}
