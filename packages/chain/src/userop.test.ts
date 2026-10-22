import { describe, expect, it } from "vitest";
import type { UserOperationReceiptSnapshot } from "./types";
import { attachSignature, isConfirmedReceipt } from "./userop";
import { createDemoPreparedUserOperation } from "./demo";

function receipt(
  overrides: Partial<UserOperationReceiptSnapshot> = {},
): UserOperationReceiptSnapshot {
  return {
    userOpHash: `0x${"11".repeat(32)}`,
    success: true,
    transactionHash: `0x${"22".repeat(32)}`,
    outerStatus: "0x1",
    ...overrides,
  };
}

describe("isConfirmedReceipt", () => {
  it("requires both inner success and a successful outer status", () => {
    expect(isConfirmedReceipt(receipt())).toBe(true);
    expect(isConfirmedReceipt(receipt({ outerStatus: "success" }))).toBe(true);
    expect(isConfirmedReceipt(receipt({ outerStatus: "0x0" }))).toBe(false);
    expect(isConfirmedReceipt(receipt({ outerStatus: undefined }))).toBe(false);
    expect(isConfirmedReceipt(receipt({ success: false }))).toBe(false);
  });
});

describe("attachSignature", () => {
  it("adds a valid signature without changing the operation", () => {
    const prepared = createDemoPreparedUserOperation();
    const signature = `0x${"ab".repeat(65)}` as const;
    const operation = attachSignature(prepared, signature);
    expect(operation.signature).toBe(signature);
    expect(operation.sender).toBe(prepared.operation.sender);
    expect(operation.callData).toBe(prepared.operation.callData);
  });

  it("rejects empty or malformed signatures", () => {
    const prepared = createDemoPreparedUserOperation();
    expect(() => attachSignature(prepared, "0x")).toThrow("invalid signature");
    expect(() => attachSignature(prepared, "0xnothex" as never)).toThrow(
      "invalid signature",
    );
  });
});
