import { z } from "zod";
import {
  BOT_CHAIN_TESTNET,
  ENTRYPOINT_V07,
  OFFICIAL_LINKS,
  SIMPLE_ACCOUNT_FACTORY,
  SIMPLE_ACCOUNT_IMPLEMENTATION,
  VERIFIED_AT,
} from "./constants";

export const AddressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Expected a 20-byte 0x-prefixed address");

export const UrlSchema = z
  .string()
  .trim()
  .url("Expected a valid URL")
  .refine(
    (value) => {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    },
    { message: "Only http and https endpoints are supported" },
  );

const EnvSchema = z.object({
  BOT_TESTNET_RPC_URL: UrlSchema.default(BOT_CHAIN_TESTNET.rpcUrl),
  BOT_TESTNET_BUNDLER_URL: UrlSchema.default(BOT_CHAIN_TESTNET.bundlerUrl),
  BOT_TESTNET_EXPLORER_URL: UrlSchema.default(BOT_CHAIN_TESTNET.explorerUrl),
  BOT_TESTNET_FAUCET_URL: UrlSchema.default(BOT_CHAIN_TESTNET.faucetUrl),
  BOT_TESTNET_ENTRYPOINT: AddressSchema.default(ENTRYPOINT_V07),
  BOT_TESTNET_SIMPLE_ACCOUNT_FACTORY:
    AddressSchema.default(SIMPLE_ACCOUNT_FACTORY),
  BOT_TESTNET_SIMPLE_ACCOUNT_IMPLEMENTATION: AddressSchema.default(
    SIMPLE_ACCOUNT_IMPLEMENTATION,
  ),
  BOT_TESTNET_PAYMASTER_ADDRESS: z
    .union([AddressSchema, z.literal("")])
    .optional(),
});

export interface NetworkConfig {
  id: 968;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  explorerUrl: string;
  faucetUrl: string;
}

export interface ConformConfig {
  network: NetworkConfig;
  rpcUrl: string;
  bundlerUrl: string;
  entryPoint: `0x${string}`;
  factory: `0x${string}`;
  implementation: `0x${string}`;
  paymasterAddress?: `0x${string}`;
  docsUrl: string;
  verifiedAt: string;
}

export interface PublicConfig {
  network: NetworkConfig;
  rpcDisplay: string;
  rpcHost: string;
  bundlerDisplay: string;
  bundlerHost: string;
  entryPoint: `0x${string}`;
  factory: `0x${string}`;
  implementation: `0x${string}`;
  paymaster: {
    configured: boolean;
    address?: `0x${string}`;
  };
  docsUrl: string;
  verifiedAt: string;
}

function normalizeEndpoint(value: string): string {
  const url = new URL(value);
  url.username = "";
  url.password = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function officialConfig(): ConformConfig {
  return {
    network: {
      id: BOT_CHAIN_TESTNET.id,
      name: BOT_CHAIN_TESTNET.name,
      nativeCurrency: { ...BOT_CHAIN_TESTNET.nativeCurrency },
      explorerUrl: BOT_CHAIN_TESTNET.explorerUrl,
      faucetUrl: BOT_CHAIN_TESTNET.faucetUrl,
    },
    rpcUrl: BOT_CHAIN_TESTNET.rpcUrl,
    bundlerUrl: BOT_CHAIN_TESTNET.bundlerUrl,
    entryPoint: ENTRYPOINT_V07,
    factory: SIMPLE_ACCOUNT_FACTORY,
    implementation: SIMPLE_ACCOUNT_IMPLEMENTATION,
    docsUrl: OFFICIAL_LINKS.accountAbstractionDocs,
    verifiedAt: VERIFIED_AT,
  };
}

export function readConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): ConformConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server configuration: ${details}`);
  }

  const paymaster =
    parsed.data.BOT_TESTNET_PAYMASTER_ADDRESS === ""
      ? undefined
      : parsed.data.BOT_TESTNET_PAYMASTER_ADDRESS;

  return {
    network: {
      id: BOT_CHAIN_TESTNET.id,
      name: BOT_CHAIN_TESTNET.name,
      nativeCurrency: { ...BOT_CHAIN_TESTNET.nativeCurrency },
      explorerUrl: normalizeEndpoint(parsed.data.BOT_TESTNET_EXPLORER_URL),
      faucetUrl: normalizeEndpoint(parsed.data.BOT_TESTNET_FAUCET_URL),
    },
    rpcUrl: normalizeEndpoint(parsed.data.BOT_TESTNET_RPC_URL),
    bundlerUrl: normalizeEndpoint(parsed.data.BOT_TESTNET_BUNDLER_URL),
    entryPoint: parsed.data.BOT_TESTNET_ENTRYPOINT as `0x${string}`,
    factory: parsed.data.BOT_TESTNET_SIMPLE_ACCOUNT_FACTORY as `0x${string}`,
    implementation: parsed.data
      .BOT_TESTNET_SIMPLE_ACCOUNT_IMPLEMENTATION as `0x${string}`,
    paymasterAddress: paymaster as `0x${string}` | undefined,
    docsUrl: OFFICIAL_LINKS.accountAbstractionDocs,
    verifiedAt: VERIFIED_AT,
  };
}

export function sanitizeEndpointForDisplay(value: string): string {
  try {
    const url = new URL(value);
    const segments = url.pathname
      .split("/")
      .map((segment) =>
        segment.length > 14 && /[A-Za-z0-9_-]{14,}/.test(segment)
          ? "[redacted]"
          : segment,
      );
    const path = segments.join("/").replace(/\/$/, "");
    return `${url.host}${path === "" ? "" : path}`;
  } catch {
    return "[invalid endpoint]";
  }
}

export function endpointHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return "[invalid endpoint]";
  }
}

export function toPublicConfig(config: ConformConfig): PublicConfig {
  return {
    network: config.network,
    rpcDisplay: sanitizeEndpointForDisplay(config.rpcUrl),
    rpcHost: endpointHost(config.rpcUrl),
    bundlerDisplay: sanitizeEndpointForDisplay(config.bundlerUrl),
    bundlerHost: endpointHost(config.bundlerUrl),
    entryPoint: config.entryPoint,
    factory: config.factory,
    implementation: config.implementation,
    paymaster: config.paymasterAddress
      ? { configured: true, address: config.paymasterAddress }
      : { configured: false },
    docsUrl: config.docsUrl,
    verifiedAt: config.verifiedAt,
  };
}

export function defaultConfig(): ConformConfig {
  return officialConfig();
}
