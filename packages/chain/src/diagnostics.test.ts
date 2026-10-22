import { describe, expect, it } from "vitest";
import {
  checksForStage,
  feeQuoteFromGwei,
  findCheck,
  summarizeChecks,
} from "./diagnostics";
import type { CheckResult, CheckStatus } from "./types";

function check(
  id: string,
  status: CheckStatus,
  stage: CheckResult["stage"] = "network",
): CheckResult {
  return {
    id,
    stage,
    label: id,
    status,
    summary: `status ${status}`,
  };
}

describe("summarizeChecks", () => {
  it("treats unknown checks as attention, not success", () => {
    const summary = summarizeChecks([
      check("a", "pass"),
      check("b", "unknown"),
    ]);
    expect(summary.status).toBe("attention");
    expect(summary.unknown).toBe(1);
    expect(summary.total).toBe(2);
  });

  it("prioritizes failures over warnings", () => {
    const summary = summarizeChecks([
      check("a", "pass"),
      check("b", "warn"),
      check("c", "fail"),
    ]);
    expect(summary.status).toBe("failed");
    expect(summary.fail).toBe(1);
  });

  it("returns incomplete when nothing executable ran", () => {
    expect(summarizeChecks([check("a", "skip")]).status).toBe("incomplete");
    expect(summarizeChecks([]).status).toBe("incomplete");
  });

  it("returns passed only when every check passed", () => {
    expect(summarizeChecks([check("a", "pass"), check("b", "pass")]).status).toBe(
      "passed",
    );
  });
});

describe("check helpers", () => {
  it("finds checks by id and stage", () => {
    const checks = [
      check("network.chain-id", "pass"),
      check("bundler.chain-id", "warn", "bundler"),
    ];
    expect(findCheck(checks, "bundler.chain-id")?.status).toBe("warn");
    expect(checksForStage(checks, "bundler")).toHaveLength(1);
  });

  it("converts gwei quotes to quantity hex", () => {
    expect(feeQuoteFromGwei(1.5, 0.25)).toEqual({
      maxFeePerGas: "0x59682f00",
      maxPriorityFeePerGas: "0xee6b280",
    });
  });
});
