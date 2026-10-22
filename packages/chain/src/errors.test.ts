import { describe, expect, it } from "vitest";
import {
  JsonRpcError,
  findAaCode,
  formatFailureLine,
  normalizeFailure,
  sanitizeMessage,
} from "./errors";

describe("findAaCode", () => {
  it("finds codes in messages and nested RPC data", () => {
    expect(findAaCode(new Error("execution reverted: AA24 signature error"))).toBe(
      "AA24",
    );
    expect(
      findAaCode(
        new JsonRpcError("eth_sendUserOperation", -32500, "rejected", {
          reason: "AA25 invalid account nonce",
        }),
      ),
    ).toBe("AA25");
  });
});

describe("sanitizeMessage", () => {
  it("redacts endpoints, long hex and credentials", () => {
    const message = sanitizeMessage(
      "POST https://rpc.example.test/secret Bearer abc.def.ghi key=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    );
    expect(message).not.toContain("rpc.example.test");
    expect(message).not.toContain("abc.def.ghi");
    expect(message).not.toContain("0x1234567890abcdef");
    expect(message).toContain("[endpoint]");
    expect(message).toContain("[credential omitted]");
    expect(message).toContain("[hex omitted]");
  });

  it("enforces the requested maximum length", () => {
    const message = sanitizeMessage("x".repeat(100), 40);
    expect(message.length).toBeLessThanOrEqual(40);
  });
});

describe("normalizeFailure", () => {
  it("maps AA codes to actionable guidance", () => {
    const failure = normalizeFailure({
      stage: "simulation",
      method: "eth_estimateUserOperationGas",
      error: new Error("AA21 didn't pay prefund"),
      occurredAt: "2026-01-01T00:00:00.000Z",
    });
    expect(failure.aaCode).toBe("AA21");
    expect(failure.title).toContain("AA21");
    expect(failure.suggestion).toContain("EntryPoint deposit");
    expect(failure.occurredAt).toBe("2026-01-01T00:00:00.000Z");
    expect(formatFailureLine(failure)).toContain("AA21");
  });

  it("keeps ordinary RPC errors readable", () => {
    const failure = normalizeFailure({
      stage: "bundler",
      method: "eth_supportedEntryPoints",
      error: new JsonRpcError("eth_supportedEntryPoints", -32601, "no method"),
    });
    expect(failure.rpcCode).toBe(-32601);
    expect(failure.title).toBe("RPC method not available");
  });
});
