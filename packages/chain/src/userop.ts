import {
  encodeFunctionData,
  getAddress,
  isAddress,
  toHex,
  type Address,
  type Hex,
} from "viem";
import {
  getUserOperationHash,
  type UserOperation,
} from "viem/account-abstraction";
import { z } from "zod";
import { simpleAccountAbi, simpleAccountFactoryAbi } from "./abi";
import type { ConformConfig } from "./config";
import { BOT_BUNDLER_EXTENSION, DUMMY_SIGNATURE, VERIFICATION_GAS_BUFFER_BPS } from "./constants";
import { TransportError } from "./errors";
import { type JsonRpcTransport, quantityToNumber } from "./rpc";
import type {
  FeeQuote,
  PreparedUserOperation,
  RpcUserOperation,
  UserOperationGas,
  UserOperationReceiptSnapshot,
} from "./types";

const QuantitySchema = z.string().regex(/^0x[0-9a-fA-F]+$/, "Invalid quantity");
const HashSchema = z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Invalid 32-byte hash");

const FeeQuoteSchema = z.object({
  maxFeePerGas: QuantitySchema,
  maxPriorityFeePerGas: QuantitySchema,
});

const GasEstimateSchema = z.object({
  callGasLimit: QuantitySchema,
  verificationGasLimit: QuantitySchema.optional(),
  verificationGas: QuantitySchema.optional(),
  preVerificationGas: QuantitySchema,
  maxFeePerGas: QuantitySchema.optional(),
  maxPriorityFeePerGas: QuantitySchema.optional(),
});

const ReceiptSchema = z.object({
  userOpHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  success: z.boolean(),
  reason: z.string().optional().nullable(),
  actualGasCost: z.string().optional(),
  actualGasUsed: z.string().optional(),
  paymaster: z.string().optional().nullable(),
  receipt: z.object({
    transactionHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    blockNumber: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
  }),
});

export interface PrepareUserOperationInput {
  config: ConformConfig;
  bundler: JsonRpcTransport;
  sender: Address;
  owner: Address;
  deployed: boolean;
  nonce: bigint;
  salt?: bigint;
  target?: Address;
}

export interface SubmitUserOperationResult {
  userOpHash: Hex;
  submittedAt: string;
}

export async function getBundlerFeeQuote(
  bundler: JsonRpcTransport,
): Promise<FeeQuote> {
  const raw = await bundler.request<unknown>(BOT_BUNDLER_EXTENSION, []);
  const parsed = FeeQuoteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TransportError(
      BOT_BUNDLER_EXTENSION,
      `${BOT_BUNDLER_EXTENSION} did not return maxFeePerGas and maxPriorityFeePerGas`,
    );
  }
  return {
    maxFeePerGas: parsed.data.maxFeePerGas as Hex,
    maxPriorityFeePerGas: parsed.data.maxPriorityFeePerGas as Hex,
  };
}

export async function prepareSimpleAccountUserOperation(
  input: PrepareUserOperationInput,
): Promise<PreparedUserOperation> {
  if (!isAddress(input.sender) || !isAddress(input.owner)) {
    throw new Error("Sender and owner must be valid addresses");
  }
  const sender = getAddress(input.sender);
  const owner = getAddress(input.owner);
  const target = input.target ? getAddress(input.target) : owner;
  const salt = input.salt ?? 0n;

  const callData = encodeFunctionData({
    abi: simpleAccountAbi,
    functionName: "execute",
    args: [target, 0n, "0x"],
  });

  const factoryFields: { factory?: Address; factoryData?: Hex } = input.deployed
    ? {}
    : {
        factory: input.config.factory,
        factoryData: encodeFunctionData({
          abi: simpleAccountFactoryAbi,
          functionName: "createAccount",
          args: [owner, salt],
        }),
      };

  const feeQuote = await getBundlerFeeQuote(input.bundler);
  const estimateOperation: RpcUserOperation = {
    sender,
    nonce: toHex(input.nonce),
    ...factoryFields,
    callData,
    callGasLimit: "0x0",
    verificationGasLimit: "0x0",
    preVerificationGas: "0x0",
    maxFeePerGas: feeQuote.maxFeePerGas,
    maxPriorityFeePerGas: feeQuote.maxPriorityFeePerGas,
    signature: DUMMY_SIGNATURE,
  };

  const estimateRaw = await input.bundler.request<unknown>(
    "eth_estimateUserOperationGas",
    [estimateOperation, input.config.entryPoint],
  );
  const estimate = GasEstimateSchema.safeParse(estimateRaw);
  if (!estimate.success) {
    throw new TransportError(
      "eth_estimateUserOperationGas",
      "Bundler returned an invalid gas estimate",
    );
  }
  const verificationGasLimit =
    estimate.data.verificationGasLimit ?? estimate.data.verificationGas;
  if (!verificationGasLimit) {
    throw new TransportError(
      "eth_estimateUserOperationGas",
      "Bundler did not return verificationGasLimit or verificationGas",
    );
  }

  const bufferedVerificationGas =
    (BigInt(verificationGasLimit) * (10_000n + VERIFICATION_GAS_BUFFER_BPS)) /
    10_000n;

  const finalMaxFeePerGas =
    estimate.data.maxFeePerGas ?? feeQuote.maxFeePerGas;
  const finalPriorityFee =
    estimate.data.maxPriorityFeePerGas ?? feeQuote.maxPriorityFeePerGas;

  const operation: RpcUserOperation = {
    ...estimateOperation,
    callGasLimit: estimate.data.callGasLimit as Hex,
    verificationGasLimit: toHex(bufferedVerificationGas),
    preVerificationGas: estimate.data.preVerificationGas as Hex,
    maxFeePerGas: finalMaxFeePerGas as Hex,
    maxPriorityFeePerGas: finalPriorityFee as Hex,
    signature: "0x",
  };

  const sdkOperation: UserOperation<"0.7"> = {
    sender,
    nonce: input.nonce,
    ...(factoryFields.factory
      ? { factory: factoryFields.factory, factoryData: factoryFields.factoryData }
      : {}),
    callData,
    callGasLimit: BigInt(operation.callGasLimit),
    verificationGasLimit: BigInt(operation.verificationGasLimit),
    preVerificationGas: BigInt(operation.preVerificationGas),
    maxFeePerGas: BigInt(operation.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(operation.maxPriorityFeePerGas),
    signature: "0x",
  };

  const userOpHash = getUserOperationHash({
    userOperation: sdkOperation,
    entryPointAddress: input.config.entryPoint,
    entryPointVersion: "0.7",
    chainId: input.config.network.id,
  });

  const gas: UserOperationGas = {
    callGasLimit: BigInt(operation.callGasLimit).toString(),
    verificationGasLimit: BigInt(operation.verificationGasLimit).toString(),
    preVerificationGas: BigInt(operation.preVerificationGas).toString(),
    maxFeePerGas: BigInt(operation.maxFeePerGas).toString(),
    maxPriorityFeePerGas: BigInt(operation.maxPriorityFeePerGas).toString(),
  };

  return {
    operation,
    gas,
    userOpHash,
    feeQuote,
    target,
    summary: input.deployed
      ? "Existing SimpleAccount · no-value execute() call · no paymaster"
      : "First UserOperation will deploy SimpleAccount · no paymaster",
  };
}

export function attachSignature(
  prepared: PreparedUserOperation,
  signature: Hex,
): RpcUserOperation {
  if (!/^0x[0-9a-fA-F]{2,}$/.test(signature)) {
    throw new Error("Wallet returned an invalid signature");
  }
  return { ...prepared.operation, signature };
}

export async function submitUserOperation(input: {
  bundler: JsonRpcTransport;
  entryPoint: Address;
  operation: RpcUserOperation;
  expectedUserOpHash?: Hex;
}): Promise<SubmitUserOperationResult> {
  const raw = await input.bundler.request<unknown>("eth_sendUserOperation", [
    input.operation,
    input.entryPoint,
  ]);
  const parsed = HashSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TransportError(
      "eth_sendUserOperation",
      "Bundler did not return a 32-byte userOpHash",
    );
  }
  if (
    input.expectedUserOpHash &&
    parsed.data.toLowerCase() !== input.expectedUserOpHash.toLowerCase()
  ) {
    throw new Error(
      "Bundler returned a different userOpHash than the locally computed hash",
    );
  }
  return {
    userOpHash: parsed.data as Hex,
    submittedAt: new Date().toISOString(),
  };
}

export async function fetchUserOperationReceipt(
  bundler: JsonRpcTransport,
  userOpHash: Hex,
): Promise<UserOperationReceiptSnapshot | null> {
  const raw = await bundler.request<unknown>("eth_getUserOperationReceipt", [
    userOpHash,
  ]);
  if (raw === null || raw === undefined) return null;
  const parsed = ReceiptSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TransportError(
      "eth_getUserOperationReceipt",
      "Bundler returned a malformed UserOperation receipt",
    );
  }
  if (parsed.data.userOpHash.toLowerCase() !== userOpHash.toLowerCase()) {
    throw new TransportError(
      "eth_getUserOperationReceipt",
      "Receipt userOpHash does not match the submitted hash",
    );
  }

  let blockNumber: number | undefined;
  if (parsed.data.receipt.blockNumber) {
    try {
      blockNumber = quantityToNumber(
        parsed.data.receipt.blockNumber,
        "receipt block number",
      );
    } catch {
      blockNumber = undefined;
    }
  }

  return {
    userOpHash: parsed.data.userOpHash as Hex,
    success: parsed.data.success,
    transactionHash: parsed.data.receipt.transactionHash as Hex,
    blockNumber,
    outerStatus: parsed.data.receipt.status ?? undefined,
    actualGasCost: parsed.data.actualGasCost,
    actualGasUsed: parsed.data.actualGasUsed,
    reason: parsed.data.reason ?? undefined,
    paymaster:
      parsed.data.paymaster &&
      /^0x[0-9a-fA-F]{40}$/.test(parsed.data.paymaster)
        ? (parsed.data.paymaster as Address)
        : undefined,
  };
}

export interface WaitForReceiptOptions {
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
  onPoll?: (attempt: number) => void;
}

export async function waitForUserOperationReceipt(
  bundler: JsonRpcTransport,
  userOpHash: Hex,
  options: WaitForReceiptOptions = {},
): Promise<{
  receipt: UserOperationReceiptSnapshot | null;
  attempts: number;
  timedOut: boolean;
}> {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 2_000;
  const startedAt = Date.now();
  let attempts = 0;

  while (Date.now() - startedAt < timeoutMs) {
    if (options.signal?.aborted) {
      throw new Error("Receipt polling was cancelled");
    }
    attempts += 1;
    options.onPoll?.(attempts);
    const receipt = await fetchUserOperationReceipt(bundler, userOpHash);
    if (receipt) {
      return { receipt, attempts, timedOut: false };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { receipt: null, attempts, timedOut: true };
}

export function isConfirmedReceipt(
  receipt: UserOperationReceiptSnapshot,
): boolean {
  return (
    receipt.success === true &&
    (receipt.outerStatus === "0x1" || receipt.outerStatus === "success")
  );
}
