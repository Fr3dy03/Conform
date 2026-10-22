import { z } from "zod";
import { JsonRpcError, TransportError, sanitizeMessage } from "./errors";

export interface JsonRpcTransport {
  request<T = unknown>(method: string, params?: unknown[]): Promise<T>;
  readonly label: string;
}

const ErrorEnvelopeSchema = z.object({
  jsonrpc: z.string().optional(),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
});

export class HttpJsonRpcTransport implements JsonRpcTransport {
  readonly label: string;
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(
    endpoint: string,
    options: {
      label?: string;
      timeoutMs?: number;
      fetchImpl?: typeof fetch;
    } = {},
  ) {
    this.endpoint = endpoint;
    this.label = options.label ?? new URL(endpoint).host;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async request<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      const reason =
        error instanceof Error && error.name === "TimeoutError"
          ? `Request to ${this.label} timed out after ${this.timeoutMs}ms`
          : `Request to ${this.label} failed: ${error instanceof Error ? error.message : "network error"}`;
      throw new TransportError(method, sanitizeMessage(reason));
    }

    const raw = await response.text();
    let parsed: unknown;
    try {
      parsed = raw.length > 0 ? JSON.parse(raw) : null;
    } catch {
      throw new TransportError(
        method,
        `Endpoint returned non-JSON data (HTTP ${response.status})`,
        response.status,
      );
    }

    const envelope = ErrorEnvelopeSchema.safeParse(parsed);
    if (!envelope.success) {
      throw new TransportError(
        method,
        `Endpoint returned an invalid JSON-RPC envelope (HTTP ${response.status})`,
        response.status,
      );
    }

    if (envelope.data.error) {
      throw new JsonRpcError(
        method,
        envelope.data.error.code,
        sanitizeMessage(envelope.data.error.message),
        envelope.data.error.data,
      );
    }

    if (!Object.hasOwn(envelope.data, "result")) {
      throw new TransportError(
        method,
        `Endpoint returned no result for ${method} (HTTP ${response.status})`,
        response.status,
      );
    }

    if (!response.ok) {
      throw new TransportError(
        method,
        `Endpoint returned HTTP ${response.status} for ${method}`,
        response.status,
      );
    }

    return envelope.data.result as T;
  }
}

const QuantitySchema = z.string().regex(/^0x[0-9a-fA-F]+$/, "Invalid quantity");
const DataSchema = z.string().regex(/^0x[0-9a-fA-F]*$/, "Invalid hex data");

export const QuantityValueSchema = z.union([QuantitySchema, z.number().int().nonnegative()]);
export const DataValueSchema = DataSchema;

export function quantityToBigInt(value: unknown, label: string): bigint {
  const parsed = QuantitySchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} was not a valid hex quantity`);
  }
  return BigInt(parsed.data);
}

export function quantityToNumber(value: unknown, label: string): number {
  const parsed = quantityToBigInt(value, label);
  if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds the safe integer range`);
  }
  return Number(parsed);
}

export function bigIntToQuantity(value: bigint): `0x${string}` {
  if (value < 0n) {
    throw new Error("Cannot encode a negative quantity");
  }
  return `0x${value.toString(16)}`;
}

export function asData(value: unknown, label: string): `0x${string}` {
  const parsed = DataSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} was not valid 0x-prefixed hex data`);
  }
  return parsed.data as `0x${string}`;
}

export function assertAddress(value: unknown, label: string): `0x${string}` {
  if (
    typeof value !== "string" ||
    !/^0x[0-9a-fA-F]{40}$/.test(value)
  ) {
    throw new Error(`${label} was not a valid 20-byte address`);
  }
  return value as `0x${string}`;
}
