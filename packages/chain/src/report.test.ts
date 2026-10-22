import { describe, expect, it } from "vitest";
import { createDemoPreparedUserOperation, createDemoRun } from "./demo";
import {
  buildConformanceReport,
  buildShareSummary,
  decodeShareSummary,
  encodeShareSummary,
} from "./report";

describe("conformance report", () => {
  it("labels demo evidence and excludes the demo signature", () => {
    const run = createDemoRun(new Date("2026-10-21T12:00:00.000Z"));
    const prepared = createDemoPreparedUserOperation();
    const report = buildConformanceReport({
      run,
      generatedAt: "2026-10-21T12:00:00.000Z",
    });
    const serialized = JSON.stringify(report);

    expect(report.meta.source).toBe("demo");
    expect(report.meta.disclaimer).toContain("demo data");
    expect(report.userOperation).toBeNull();
    expect(prepared.operation.signature).toBe("0x");
    expect(serialized).not.toContain('"signature":');
    expect(serialized).not.toContain("signatureIncluded\":true");
  });

  it("marks a demo UserOperation as not confirmed on-chain", () => {
    const run = createDemoRun();
    const report = buildConformanceReport({
      run,
      userOperation: {
        status: "confirmed",
        mode: "demo",
        success: true,
        userOpHash: createDemoPreparedUserOperation().userOpHash,
      },
    });
    expect(report.userOperation?.confirmedOnChain).toBe(false);
    expect(report.userOperation?.signatureIncluded).toBe(false);
  });
});

describe("share summary", () => {
  it("round-trips a validated unsigned summary", () => {
    const run = createDemoRun(new Date("2026-10-21T12:00:00.000Z"));
    const summary = buildShareSummary(
      run,
      null,
      "2026-10-21T12:00:00.000Z",
    );
    const encoded = encodeShareSummary(summary);
    const decoded = decodeShareSummary(encoded);

    expect(decoded).toEqual(summary);
    expect(decoded?.checks.length).toBeLessThanOrEqual(40);
    expect(JSON.stringify(decoded)).not.toContain("signature");
    expect(decoded?.source).toBe("demo");
  });

  it("rejects malformed or oversized payloads", () => {
    expect(decodeShareSummary("")).toBeNull();
    expect(decodeShareSummary("not-base64!")).toBeNull();
    expect(decodeShareSummary("A".repeat(8_001))).toBeNull();
  });

  it("rejects valid base64 that is not a share summary", () => {
    const encoded = btoa(JSON.stringify({ v: 2 }));
    expect(decodeShareSummary(encoded)).toBeNull();
  });
});
