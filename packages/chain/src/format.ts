import { formatEther, formatGwei } from "viem";

export function formatBot(wei: string | bigint, maximumFractionDigits = 5): string {
  try {
    const value = typeof wei === "bigint" ? wei : BigInt(wei);
    const [whole = "0", fraction = ""] = formatEther(value).split(".");
    const trimmed = fraction.slice(0, maximumFractionDigits).replace(/0+$/, "");
    return trimmed.length > 0 ? `${whole}.${trimmed}` : whole;
  } catch {
    return "—";
  }
}

export function formatGweiValue(wei: string | bigint): string {
  try {
    const value = typeof wei === "bigint" ? wei : BigInt(wei);
    const formatted = formatGwei(value);
    return formatted.includes(".") ? formatted.replace(/\.?0+$/, "") : formatted;
  } catch {
    return "—";
  }
}

export function shortAddress(value?: string | null, head = 6, tail = 4): string {
  if (!value) return "—";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function shortHash(value?: string | null, head = 8, tail = 6): string {
  if (!value) return "—";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function formatDuration(milliseconds?: number): string {
  if (milliseconds === undefined) return "—";
  if (milliseconds < 1) return "<1 ms";
  if (milliseconds < 1_000) return `${Math.round(milliseconds)} ms`;
  if (milliseconds < 60_000) {
    return `${(milliseconds / 1_000).toFixed(milliseconds < 10_000 ? 1 : 0)} s`;
  }
  return `${Math.floor(milliseconds / 60_000)}m ${Math.round((milliseconds % 60_000) / 1_000)}s`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

export function formatBlockTime(unixSeconds?: number): string {
  if (!unixSeconds) return "—";
  return formatTimestamp(new Date(unixSeconds * 1_000).toISOString());
}
