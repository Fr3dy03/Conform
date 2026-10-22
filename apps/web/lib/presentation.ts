import type {
  CheckResult,
  CheckStatus,
  DiagnosticStage,
  UserOperationAttempt,
} from "@conform/chain";

export interface CheckAggregate {
  status: CheckStatus;
  pass: number;
  warn: number;
  fail: number;
  skip: number;
  unknown: number;
  total: number;
}

export function aggregateChecks(checks: CheckResult[]): CheckAggregate {
  const counts = {
    pass: checks.filter((check) => check.status === "pass").length,
    warn: checks.filter((check) => check.status === "warn").length,
    fail: checks.filter((check) => check.status === "fail").length,
    skip: checks.filter((check) => check.status === "skip").length,
    unknown: checks.filter((check) => check.status === "unknown").length,
  };
  const status: CheckStatus =
    counts.fail > 0
      ? "fail"
      : counts.warn > 0
        ? "warn"
        : counts.unknown > 0
          ? "unknown"
          : counts.pass > 0
            ? "pass"
            : "skip";
  return {
    status,
    ...counts,
    total: checks.length,
  };
}

export function checksForStage(
  checks: CheckResult[],
  stage: DiagnosticStage,
): CheckResult[] {
  return checks.filter((check) => check.stage === stage);
}

export function stageAggregate(
  checks: CheckResult[],
  stage: DiagnosticStage,
): CheckAggregate {
  return aggregateChecks(checksForStage(checks, stage));
}

export function aggregateLabel(aggregate: CheckAggregate): string {
  if (aggregate.total === 0) return "Not run";
  return `${aggregate.pass}/${aggregate.total}`;
}

export function attemptStatus(
  attempt: UserOperationAttempt | null,
): { label: string; tone: "neutral" | "lime" | "amber" | "coral" } {
  if (!attempt) return { label: "Not started", tone: "neutral" };
  switch (attempt.status) {
    case "confirmed":
      return {
        label: "Confirmed",
        tone: "lime",
      };
    case "failed":
      return { label: "Failed", tone: "coral" };
    case "pending":
    case "submitted":
      return { label: "Awaiting receipt", tone: "amber" };
    case "signed":
      return { label: "Signed", tone: "lime" };
    case "estimated":
      return { label: "Estimated", tone: "neutral" };
    case "estimating":
      return { label: "Estimating", tone: "neutral" };
    case "signing":
      return { label: "Signing", tone: "neutral" };
    case "submitting":
      return { label: "Submitting", tone: "neutral" };
    case "idle":
      return { label: "Not started", tone: "neutral" };
  }
}

export function explorerAddressUrl(
  explorerUrl: string,
  address: string,
): string {
  return `${explorerUrl.replace(/\/$/, "")}/address/${address}`;
}

export function explorerTransactionUrl(
  explorerUrl: string,
  hash: string,
): string {
  return `${explorerUrl.replace(/\/$/, "")}/tx/${hash}`;
}

export function titleCaseStatus(status: CheckStatus): string {
  switch (status) {
    case "pass":
      return "Passed";
    case "warn":
      return "Attention";
    case "fail":
      return "Failed";
    case "skip":
      return "Skipped";
    case "unknown":
      return "Unknown";
  }
}

export function runStatusCopy(
  status: "passed" | "attention" | "failed" | "incomplete",
): { title: string; body: string; tone: "lime" | "amber" | "coral" | "neutral" } {
  switch (status) {
    case "passed":
      return {
        title: "The checks passed.",
        body:
          "Every conclusive check in this run passed. Review the report limits before treating the result as full coverage.",
        tone: "lime",
      };
    case "attention":
      return {
        title: "The run needs review.",
        body:
          "The run completed with warnings or unknowns. Inspect each flagged stage before sharing the result.",
        tone: "amber",
      };
    case "failed":
      return {
        title: "At least one check failed.",
        body:
          "Start with the earliest failure in run order, fix it, then run the checks again.",
        tone: "coral",
      };
    case "incomplete":
      return {
        title: "The run is incomplete.",
        body:
          "No conclusive checks were completed. Verify the server configuration and BOT Chain testnet connectivity.",
        tone: "neutral",
      };
  }
}
