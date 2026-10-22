import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  BUNDLER_METHOD_ALLOWLIST,
  RPC_METHOD_ALLOWLIST,
  readConfigFromEnv,
  sanitizeMessage,
} from "@conform/chain";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_REQUESTS_PER_MINUTE = 180;

const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0").optional(),
  id: z.union([z.string().max(80), z.number(), z.null()]).optional(),
  method: z.string().min(1).max(96),
  params: z.array(z.unknown()).max(32).default([]),
});

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return candidate.slice(0, 80);
}

function withinRateLimit(key: string): boolean {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    lastSweep = now;
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_MINUTE) return false;
  current.count += 1;
  return true;
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === request.nextUrl.host;
    } catch {
      return false;
    }
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  return fetchSite !== "cross-site" && fetchSite !== "same-site";
}

function rpcError(
  id: string | number | null,
  code: number,
  message: string,
  status: number,
) {
  return NextResponse.json(
    { jsonrpc: "2.0", id, error: { code, message } },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}

export async function handleJsonRpcProxy(
  request: NextRequest,
  kind: "rpc" | "bundler",
): Promise<NextResponse> {
  if (!sameOrigin(request)) {
    return rpcError(null, -32600, "Cross-origin requests are not allowed.", 403);
  }

  if (!withinRateLimit(`${kind}:${clientKey(request)}`)) {
    return rpcError(
      null,
      -32005,
      "Conform relay rate limit exceeded. Wait a minute before retrying.",
      429,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return rpcError(null, -32600, "Request body is too large.", 413);
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return rpcError(null, -32600, "Could not read the request body.", 400);
  }
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return rpcError(null, -32600, "Request body is too large.", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return rpcError(null, -32700, "Request body must be valid JSON.", 400);
  }

  const parsed = JsonRpcRequestSchema.safeParse(body);
  if (!parsed.success) {
    return rpcError(
      null,
      -32600,
      "Expected a single JSON-RPC 2.0 request with a method and array params.",
      400,
    );
  }

  const payload = parsed.data;
  const id = payload.id ?? null;
  const allowlist: readonly string[] =
    kind === "rpc" ? RPC_METHOD_ALLOWLIST : BUNDLER_METHOD_ALLOWLIST;

  if (!allowlist.includes(payload.method)) {
    return rpcError(
      id,
      -32601,
      `Method ${payload.method} is not allowed by the Conform ${kind} relay.`,
      403,
    );
  }

  let config;
  try {
    config = readConfigFromEnv();
  } catch (error) {
    return rpcError(
      id,
      -32603,
      sanitizeMessage(
        error instanceof Error ? error.message : "Invalid server configuration.",
        240,
      ),
      500,
    );
  }

  const endpoint = kind === "rpc" ? config.rpcUrl : config.bundlerUrl;
  const timeoutMs = kind === "rpc" ? 20_000 : 30_000;

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method: payload.method,
        params: payload.params,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return rpcError(
      id,
      -32603,
      `The BOT Chain ${kind} endpoint could not be reached.`,
      502,
    );
  }

  const raw = await upstream.text();
  let upstreamJson: unknown;
  try {
    upstreamJson = JSON.parse(raw);
  } catch {
    return rpcError(
      id,
      -32603,
      `The BOT Chain ${kind} endpoint returned a non-JSON response.`,
      502,
    );
  }

  const envelope = z
    .object({
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
    })
    .safeParse(upstreamJson);

  if (!envelope.success) {
    return rpcError(
      id,
      -32603,
      `The BOT Chain ${kind} endpoint returned an invalid JSON-RPC response.`,
      502,
    );
  }

  return NextResponse.json(envelope.data, {
    status: upstream.status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-conform-relay": kind,
    },
  });
}
