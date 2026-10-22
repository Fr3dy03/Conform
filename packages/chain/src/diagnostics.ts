import {
  decodeFunctionResult,
  encodeFunctionData,
  getAddress,
  isAddress,
  zeroAddress,
} from "viem";
import { z } from "zod";
import {
  entryPointV07Abi,
  simpleAccountFactoryAbi,
} from "./abi";
import {
  endpointHost,
  type ConformConfig,
  toPublicConfig,
} from "./config";
import {
  BOT_BUNDLER_EXTENSION,
  DUMMY_SIGNATURE,
  REQUIRED_BUNDLER_METHODS,
  SPONSORSHIP_DISCLOSURE,
} from "./constants";
import {
  findAaCode,
  normalizeFailure,
  sanitizeMessage,
  type FailureReport,
} from "./errors";
import { formatBot, formatGweiValue } from "./format";
import {
  asData,
  assertAddress,
  type JsonRpcTransport,
  quantityToBigInt,
  quantityToNumber,
} from "./rpc";
import type {
  AccountSnapshot,
  BundlerSnapshot,
  CheckDetail,
  CheckResult,
  CheckStatus,
  ContractSnapshot,
  DiagnosticRun,
  FeeQuote,
  NetworkSnapshot,
  RunSummary,
  SponsorshipSnapshot,
} from "./types";

const DummyHash = `0x${"11".repeat(32)}` as const;

interface StageResult<T> {
  checks: CheckResult[];
  failures: FailureReport[];
  snapshot?: T;
}

export interface BundlerProbeResult {
  method: string;
  present: boolean;
  inconclusive: boolean;
  note: string;
  durationMs: number;
  result?: unknown;
  error?: unknown;
}

function now(): string {
  return new Date().toISOString();
}

function elapsed(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

export async function runNetworkDiagnostics(
  transport: JsonRpcTransport,
  config: ConformConfig,
): Promise<StageResult<NetworkSnapshot>> {
  const checks: CheckResult[] = [];
  const failures: FailureReport[] = [];
  const checkedAt = now();
  const chainStarted = Date.now();

  let chainIdHex: string;
  try {
    chainIdHex = await transport.request<string>("eth_chainId", []);
  } catch (error) {
    const report = normalizeFailure({
      stage: "network",
      method: "eth_chainId",
      error,
      occurredAt: checkedAt,
    });
    failures.push(report);
    checks.push({
      id: "network.chain-id",
      stage: "network",
      label: "Chain ID",
      status: "fail",
      summary: "The RPC endpoint did not return a chain ID.",
      method: "eth_chainId",
      durationMs: elapsed(chainStarted),
      failure: report,
    });
    for (const [id, label] of [
      ["network.block-height", "Block height"],
      ["network.client", "Client version"],
      ["network.latest-block", "Latest block"],
      ["network.latency", "RPC latency"],
    ] as const) {
      checks.push({
        id,
        stage: "network",
        label,
        status: "skip",
        summary: "Skipped because the chain ID request failed.",
      });
    }
    return { checks, failures };
  }

  const latencyMs = elapsed(chainStarted);
  let chainId = Number.NaN;
  try {
    chainId = quantityToNumber(chainIdHex, "chainId");
  } catch {
    chainId = Number.NaN;
  }

  const chainMatches = chainId === config.network.id;
  const chainFailure = !chainMatches
    ? normalizeFailure({
        stage: "network",
        method: "eth_chainId",
        error: new Error(
          `RPC reports chain ID ${Number.isNaN(chainId) ? chainIdHex : chainId}; BOT Chain Testnet requires ${config.network.id}`,
        ),
        occurredAt: checkedAt,
      })
    : undefined;
  if (chainFailure) failures.push(chainFailure);
  checks.push({
    id: "network.chain-id",
    stage: "network",
    label: "Chain ID",
    status: chainMatches ? "pass" : "fail",
    summary: chainMatches
      ? `RPC identifies as BOT Chain Testnet (${config.network.id}).`
      : `Expected ${config.network.id} (0x${config.network.id.toString(16)}) but received ${Number.isNaN(chainId) ? chainIdHex : `${chainId} (${chainIdHex})`}.`,
    method: "eth_chainId",
    durationMs: latencyMs,
    details: [
      { label: "Returned", value: chainIdHex, mono: true },
      { label: "Expected", value: `0x${config.network.id.toString(16)}`, mono: true },
      { label: "Endpoint", value: endpointHost(config.rpcUrl), mono: true },
    ],
    failure: chainFailure,
  });

  const blockSchema = z.object({
    number: z.string(),
    hash: z.string().optional(),
    timestamp: z.string(),
  });

  const [blockNumberResult, clientResult, blockResult] = await Promise.allSettled([
    transport.request<string>("eth_blockNumber", []),
    transport.request<string>("web3_clientVersion", []),
    transport.request<unknown>("eth_getBlockByNumber", ["latest", false]),
  ]);

  let blockNumber = 0;
  if (blockNumberResult.status === "fulfilled") {
    try {
      blockNumber = quantityToNumber(blockNumberResult.value, "blockNumber");
      checks.push({
        id: "network.block-height",
        stage: "network",
        label: "Block height",
        status: "pass",
        summary: `Latest block ${blockNumber.toLocaleString("en-US")}.`,
        method: "eth_blockNumber",
      });
    } catch (error) {
      const report = normalizeFailure({
        stage: "network",
        method: "eth_blockNumber",
        error,
        occurredAt: checkedAt,
      });
      failures.push(report);
      checks.push({
        id: "network.block-height",
        stage: "network",
        label: "Block height",
        status: "fail",
        summary: "The block number response was malformed.",
        method: "eth_blockNumber",
        failure: report,
      });
    }
  } else {
    const report = normalizeFailure({
      stage: "network",
      method: "eth_blockNumber",
      error: blockNumberResult.reason,
      occurredAt: checkedAt,
    });
    failures.push(report);
    checks.push({
      id: "network.block-height",
      stage: "network",
      label: "Block height",
      status: "fail",
      summary: "Could not read the latest block number.",
      method: "eth_blockNumber",
      failure: report,
    });
  }

  let clientVersion = "Unknown";
  if (clientResult.status === "fulfilled" && typeof clientResult.value === "string") {
    clientVersion = sanitizeMessage(clientResult.value, 120);
    checks.push({
      id: "network.client",
      stage: "network",
      label: "Client version",
      status: "pass",
      summary: clientVersion,
      method: "web3_clientVersion",
      details: [{ label: "Node", value: clientVersion, mono: true }],
    });
  } else {
    const error =
      clientResult.status === "rejected"
        ? clientResult.reason
        : new Error("No client version returned");
    const report = normalizeFailure({
      stage: "network",
      method: "web3_clientVersion",
      error,
      occurredAt: checkedAt,
    });
    failures.push(report);
    checks.push({
      id: "network.client",
      stage: "network",
      label: "Client version",
      status: "fail",
      summary: "The RPC did not return a client version.",
      method: "web3_clientVersion",
      failure: report,
    });
  }

  let blockHash: string | undefined;
  let blockTimestamp: number | undefined;
  if (blockResult.status === "fulfilled") {
    const parsed = blockSchema.safeParse(blockResult.value);
    if (parsed.success) {
      blockHash = parsed.data.hash;
      try {
        blockTimestamp = quantityToNumber(parsed.data.timestamp, "block timestamp");
      } catch {
        blockTimestamp = undefined;
      }
      checks.push({
        id: "network.latest-block",
        stage: "network",
        label: "Latest block",
        status: "pass",
        summary: blockHash
          ? `Block ${blockNumber.toLocaleString("en-US")} · ${blockHash.slice(0, 12)}…`
          : `Block ${blockNumber.toLocaleString("en-US")}`,
        method: "eth_getBlockByNumber",
        details: [
          { label: "Block", value: String(blockNumber), mono: true },
          ...(blockHash
            ? [{ label: "Hash", value: blockHash, mono: true }]
            : []),
          ...(blockTimestamp
            ? [
                {
                  label: "Timestamp",
                  value: new Date(blockTimestamp * 1_000).toISOString(),
                  mono: true,
                },
              ]
            : []),
        ],
      });
    } else {
      const report = normalizeFailure({
        stage: "network",
        method: "eth_getBlockByNumber",
        error: new Error("Latest block response did not contain number and timestamp"),
        occurredAt: checkedAt,
      });
      failures.push(report);
      checks.push({
        id: "network.latest-block",
        stage: "network",
        label: "Latest block",
        status: "fail",
        summary: "The latest block response was malformed.",
        method: "eth_getBlockByNumber",
        failure: report,
      });
    }
  } else {
    const report = normalizeFailure({
      stage: "network",
      method: "eth_getBlockByNumber",
      error: blockResult.reason,
      occurredAt: checkedAt,
    });
    failures.push(report);
    checks.push({
      id: "network.latest-block",
      stage: "network",
      label: "Latest block",
      status: "fail",
      summary: "Could not read the latest block.",
      method: "eth_getBlockByNumber",
      failure: report,
    });
  }

  const latencyStatus: CheckStatus = latencyMs > 2_500 ? "warn" : "pass";
  checks.push({
    id: "network.latency",
    stage: "network",
    label: "RPC latency",
    status: latencyStatus,
    summary:
      latencyStatus === "pass"
        ? `${latencyMs} ms for eth_chainId.`
        : `${latencyMs} ms is slow for a testnet check. The endpoint may be degraded.`,
    method: "eth_chainId",
    durationMs: latencyMs,
    details: [{ label: "Measured", value: `${latencyMs} ms`, mono: true }],
  });

  const snapshot: NetworkSnapshot = {
    chainId: Number.isNaN(chainId) ? -1 : chainId,
    chainIdHex,
    blockNumber,
    blockHash,
    blockTimestamp,
    clientVersion,
    latencyMs,
    rpcHost: endpointHost(config.rpcUrl),
    checkedAt,
  };

  return { checks, failures, snapshot };
}

const probeArguments: Record<string, unknown[]> = {
  eth_supportedEntryPoints: [],
  eth_estimateUserOperationGas: [{}, "0x0000000071727De22E5E9d8BAf0edAc6f37da032"],
  eth_sendUserOperation: [{}, "0x0000000071727De22E5E9d8BAf0edAc6f37da032"],
  eth_getUserOperationByHash: [DummyHash],
  eth_getUserOperationReceipt: [DummyHash],
  [BOT_BUNDLER_EXTENSION]: [],
};

export async function probeBundlerMethod(
  transport: JsonRpcTransport,
  method: string,
): Promise<BundlerProbeResult> {
  const startedAt = Date.now();
  try {
    const result = await transport.request(method, probeArguments[method] ?? []);
    return {
      method,
      present: true,
      inconclusive: false,
      note: "Method returned a response. The probe is intentionally read-only or malformed.",
      durationMs: elapsed(startedAt),
      result,
    };
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "number"
        ? (error as { code: number }).code
        : undefined;
    if (code === -32601) {
      return {
        method,
        present: false,
        inconclusive: false,
        note: "Method not found (-32601).",
        durationMs: elapsed(startedAt),
        error,
      };
    }
    if (code === 429) {
      return {
        method,
        present: true,
        inconclusive: true,
        note: "Rate limited. Method presence was not fully confirmed.",
        durationMs: elapsed(startedAt),
        error,
      };
    }
    if (code === -32600 || code === -32602) {
      return {
        method,
        present: true,
        inconclusive: false,
        note: "Method present; the intentionally malformed probe was rejected.",
        durationMs: elapsed(startedAt),
        error,
      };
    }
    if (code === undefined) {
      return {
        method,
        present: false,
        inconclusive: true,
        note: `No JSON-RPC response: ${error instanceof Error ? error.message : "transport error"}.`,
        durationMs: elapsed(startedAt),
        error,
      };
    }
    return {
      method,
      present: true,
      inconclusive: false,
      note: `Method present; probe returned error ${code}.`,
      durationMs: elapsed(startedAt),
      error,
    };
  }
}

export async function runBundlerDiagnostics(
  transport: JsonRpcTransport,
  config: ConformConfig,
): Promise<StageResult<BundlerSnapshot>> {
  const checks: CheckResult[] = [];
  const failures: FailureReport[] = [];
  const checkedAt = now();
  const startedAt = Date.now();

  let chainId: number | undefined;
  let chainIdHex = "—";
  try {
    chainIdHex = await transport.request<string>("eth_chainId", []);
    chainId = quantityToNumber(chainIdHex, "chainId");
  } catch (error) {
    // eth_chainId is useful but not part of the required method matrix.
  }

  const chainMatch = chainId === config.network.id;
  const chainFailure = chainMatch
    ? undefined
    : normalizeFailure({
        stage: "bundler",
        method: "eth_chainId",
        error: new Error(
          `Bundler reports ${chainId ?? "no chain ID"}; expected BOT Chain Testnet ${config.network.id}`,
        ),
        occurredAt: checkedAt,
      });
  if (chainFailure) failures.push(chainFailure);
  checks.push({
    id: "bundler.chain-id",
    stage: "bundler",
    label: "Bundler chain identity",
    status: chainMatch ? "pass" : "fail",
    summary: chainMatch
      ? `Bundler matches BOT Chain Testnet (${config.network.id}).`
      : `Bundler chain identity does not match the chain RPC. Received ${chainId ?? chainIdHex}.`,
    method: "eth_chainId",
    durationMs: elapsed(startedAt),
    details: [
      { label: "Returned", value: chainIdHex, mono: true },
      { label: "Endpoint", value: endpointHost(config.bundlerUrl), mono: true },
    ],
    failure: chainFailure,
  });

  const probes: BundlerProbeResult[] = [];
  for (const method of REQUIRED_BUNDLER_METHODS) {
    probes.push(await probeBundlerMethod(transport, method));
  }
  const extensionProbe = await probeBundlerMethod(transport, BOT_BUNDLER_EXTENSION);
  probes.push(extensionProbe);

  let supportedEntryPoints: `0x${string}`[] = [];
  const supportedProbe = probes.find(
    (probe) => probe.method === "eth_supportedEntryPoints",
  );

  if (supportedProbe?.present && !supportedProbe.inconclusive && Array.isArray(supportedProbe.result)) {
    const parsed = z.array(z.string().regex(/^0x[0-9a-fA-F]{40}$/)).safeParse(
      supportedProbe.result,
    );
    if (parsed.success) {
      supportedEntryPoints = parsed.data.map((entry) =>
        assertAddress(entry, "supported EntryPoint"),
      );
    }
  }

  for (const probe of probes) {
    const isRequired = (REQUIRED_BUNDLER_METHODS as readonly string[]).includes(
      probe.method,
    );
    const isExtension = probe.method === BOT_BUNDLER_EXTENSION;
    const entryPointSupported =
      probe.method === "eth_supportedEntryPoints" &&
      supportedEntryPoints.some(
        (entry) => entry.toLowerCase() === config.entryPoint.toLowerCase(),
      );

    let status: CheckStatus;
    let summary: string;
    let report: FailureReport | undefined;
    let details: CheckDetail[] = [
      { label: "Probe", value: probe.note },
      { label: "Duration", value: `${probe.durationMs} ms`, mono: true },
    ];

    if (probe.method === "eth_supportedEntryPoints" && probe.present) {
      if (entryPointSupported) {
        status = "pass";
        summary = `EntryPoint ${config.entryPoint} is supported.`;
      } else if (supportedProbe?.inconclusive) {
        status = "warn";
        summary = "The supported EntryPoint list could not be confirmed.";
      } else {
        status = "fail";
        summary = "The configured EntryPoint v0.7 address is not in the bundler's supported list.";
        report = normalizeFailure({
          stage: "bundler",
          method: probe.method,
          error: new Error(
            `Bundler does not support EntryPoint ${config.entryPoint}. Supported: ${supportedEntryPoints.join(", ") || "none"}`,
          ),
          occurredAt: checkedAt,
        });
      }
      details = [
        ...details,
        {
          label: "Supported",
          value: supportedEntryPoints.join(", ") || "None returned",
          mono: true,
        },
      ];
    } else if (!probe.present) {
      if (isRequired) {
        status = "fail";
        summary = isExtension
          ? "The BOT bundler fee extension is unavailable."
          : "Required method is missing from this endpoint.";
        report = normalizeFailure({
          stage: "bundler",
          method: probe.method,
          error: probe.error ?? new Error("Method not found"),
          occurredAt: checkedAt,
        });
      } else {
        status = isExtension ? "warn" : "skip";
        summary = isExtension
          ? "skandha_getGasPrice is unavailable. The guided flow cannot quote BOT-specific UserOperation fees."
          : "Optional method is unavailable.";
      }
    } else if (probe.inconclusive) {
      status = "warn";
      summary = probe.note;
    } else {
      status = "pass";
      summary =
        probe.method === "eth_getUserOperationReceipt" ||
        probe.method === "eth_getUserOperationByHash"
          ? "Method present; unknown hash correctly returned null."
          : isExtension
            ? "Method present; returned a UserOperation fee quote."
            : "Method present; probe rejection is expected for a malformed payload.";
    }

    if (report) failures.push(report);
    checks.push({
      id: `bundler.method.${probe.method}`,
      stage: "bundler",
      label: probe.method,
      status,
      summary,
      method: probe.method,
      durationMs: probe.durationMs,
      details,
      failure: report,
    });
  }

  const snapshot: BundlerSnapshot = {
    chainId: chainId ?? -1,
    chainIdHex,
    supportedEntryPoints,
    methods: probes.map((probe) => ({
      method: probe.method,
      present: probe.present,
      required: (REQUIRED_BUNDLER_METHODS as readonly string[]).includes(
        probe.method,
      ),
      note: probe.note,
    })),
    latencyMs: elapsed(startedAt),
    bundlerHost: endpointHost(config.bundlerUrl),
    checkedAt,
  };

  return { checks, failures, snapshot };
}

async function readCode(
  transport: JsonRpcTransport,
  address: `0x${string}`,
): Promise<`0x${string}`> {
  const result = await transport.request<unknown>("eth_getCode", [address, "latest"]);
  if (typeof result !== "string" || !/^0x[0-9a-fA-F]*$/.test(result)) {
    throw new Error(`eth_getCode returned malformed bytecode for ${address}`);
  }
  return result as `0x${string}`;
}

export async function runContractDiagnostics(
  transport: JsonRpcTransport,
  config: ConformConfig,
): Promise<StageResult<ContractSnapshot>> {
  const checks: CheckResult[] = [];
  const failures: FailureReport[] = [];
  const checkedAt = now();

  async function codeCheck(
    id: string,
    label: string,
    address: `0x${string}`,
  ): Promise<{ deployed: boolean; codeSize: number }> {
    try {
      const code = await readCode(transport, address);
      const codeSize = Math.max(0, (code.length - 2) / 2);
      const deployed = code !== "0x";
      const status: CheckStatus = deployed ? "pass" : "fail";
      const report = deployed
        ? undefined
        : normalizeFailure({
            stage: "contracts",
            method: "eth_getCode",
            error: new Error(
              `${label} at ${address} has no bytecode on BOT Chain Testnet`,
            ),
            occurredAt: checkedAt,
          });
      if (report) failures.push(report);
      checks.push({
        id,
        stage: "contracts",
        label,
        status,
        summary: deployed
          ? `${label} is deployed (${codeSize.toLocaleString("en-US")} bytes).`
          : `${label} has no code at the configured address.`,
        method: "eth_getCode",
        details: [
          { label: "Address", value: address, mono: true },
          { label: "Bytecode", value: deployed ? `${codeSize.toLocaleString("en-US")} bytes` : "0x", mono: true },
        ],
        failure: report,
      });
      return { deployed, codeSize };
    } catch (error) {
      const report = normalizeFailure({
        stage: "contracts",
        method: "eth_getCode",
        error,
        occurredAt: checkedAt,
      });
      failures.push(report);
      checks.push({
        id,
        stage: "contracts",
        label,
        status: "fail",
        summary: `Could not read bytecode for ${label}.`,
        method: "eth_getCode",
        failure: report,
      });
      return { deployed: false, codeSize: 0 };
    }
  }

  const [entryPoint, factory, implementation] = await Promise.all([
    codeCheck("contracts.entrypoint", "EntryPoint v0.7", config.entryPoint),
    codeCheck("contracts.factory", "SimpleAccountFactory", config.factory),
    codeCheck("contracts.implementation", "SimpleAccount implementation", config.implementation),
  ]);

  let resolvedImplementation: `0x${string}` | null = null;
  if (factory.deployed) {
    try {
      const data = encodeFunctionData({
        abi: simpleAccountFactoryAbi,
        functionName: "accountImplementation",
      });
      const raw = await transport.request<unknown>("eth_call", [
        { to: config.factory, data },
        "latest",
      ]);
      const decoded = decodeFunctionResult({
        abi: simpleAccountFactoryAbi,
        functionName: "accountImplementation",
        data: asData(
          typeof raw === "string" ? raw : "0x",
          "accountImplementation result",
        ),
      });
      resolvedImplementation = getAddress(decoded);
      const matches =
        resolvedImplementation.toLowerCase() ===
        config.implementation.toLowerCase();
      const report = matches
        ? undefined
        : normalizeFailure({
            stage: "contracts",
            method: "accountImplementation",
            error: new Error(
              `Factory resolves implementation ${resolvedImplementation}, but ${config.implementation} is configured`,
            ),
            occurredAt: checkedAt,
          });
      if (report) failures.push(report);
      checks.push({
        id: "contracts.factory-implementation",
        stage: "contracts",
        label: "Factory implementation",
        status: matches ? "pass" : "fail",
        summary: matches
          ? "SimpleAccountFactory resolves the configured implementation."
          : "Factory and configured implementation do not match.",
        method: "eth_call",
        details: [
          { label: "On-chain", value: resolvedImplementation, mono: true },
          { label: "Configured", value: config.implementation, mono: true },
        ],
        failure: report,
      });
    } catch (error) {
      const report = normalizeFailure({
        stage: "contracts",
        method: "eth_call",
        error,
        occurredAt: checkedAt,
      });
      failures.push(report);
      checks.push({
        id: "contracts.factory-implementation",
        stage: "contracts",
        label: "Factory implementation",
        status: "fail",
        summary: "Could not resolve the factory's account implementation.",
        method: "eth_call",
        failure: report,
      });
    }
  } else {
    checks.push({
      id: "contracts.factory-implementation",
      stage: "contracts",
      label: "Factory implementation",
      status: "skip",
      summary: "Skipped because the factory has no bytecode.",
    });
  }

  if (entryPoint.deployed) {
    try {
      const data = encodeFunctionData({
        abi: entryPointV07Abi,
        functionName: "getNonce",
        args: [zeroAddress, 0n],
      });
      const raw = await transport.request<unknown>("eth_call", [
        { to: config.entryPoint, data },
        "latest",
      ]);
      decodeFunctionResult({
        abi: entryPointV07Abi,
        functionName: "getNonce",
        data: asData(
          typeof raw === "string" ? raw : "0x",
          "getNonce result",
        ),
      });
      checks.push({
        id: "contracts.entrypoint-interface",
        stage: "contracts",
        label: "EntryPoint interface",
        status: "pass",
        summary: "getNonce(address,uint192) responds at the configured EntryPoint.",
        method: "eth_call",
        details: [{ label: "Selector", value: "getNonce(address,uint192)", mono: true }],
      });
    } catch (error) {
      const report = normalizeFailure({
        stage: "contracts",
        method: "eth_call",
        error,
        occurredAt: checkedAt,
      });
      failures.push(report);
      checks.push({
        id: "contracts.entrypoint-interface",
        stage: "contracts",
        label: "EntryPoint interface",
        status: "fail",
        summary: "The EntryPoint does not respond to the v0.7 getNonce interface.",
        method: "eth_call",
        failure: report,
      });
    }
  } else {
    checks.push({
      id: "contracts.entrypoint-interface",
      stage: "contracts",
      label: "EntryPoint interface",
      status: "skip",
      summary: "Skipped because EntryPoint has no bytecode.",
    });
  }

  const snapshot: ContractSnapshot = {
    entryPoint: {
      address: config.entryPoint,
      codeSize: entryPoint.codeSize,
      deployed: entryPoint.deployed,
    },
    factory: {
      address: config.factory,
      codeSize: factory.codeSize,
      deployed: factory.deployed,
      implementation: resolvedImplementation,
    },
    implementation: {
      address: config.implementation,
      codeSize: implementation.codeSize,
      deployed: implementation.deployed,
    },
    checkedAt,
  };

  return { checks, failures, snapshot };
}

export async function runAccountDiagnostics(
  transport: JsonRpcTransport,
  config: ConformConfig,
  owner: string,
  salt = 0n,
): Promise<StageResult<AccountSnapshot>> {
  const checks: CheckResult[] = [];
  const failures: FailureReport[] = [];
  const checkedAt = now();

  if (!isAddress(owner)) {
    const report = normalizeFailure({
      stage: "account",
      method: "SimpleAccountFactory.getAddress",
      error: new Error("Owner address is not a valid 20-byte address"),
      occurredAt: checkedAt,
    });
    failures.push(report);
    checks.push({
      id: "account.derivation",
      stage: "account",
      label: "Account derivation",
      status: "fail",
      summary: "Enter a valid owner address before deriving a SimpleAccount.",
      failure: report,
    });
    return { checks, failures };
  }

  const normalizedOwner = getAddress(owner);
  let address: `0x${string}`;
  try {
    const data = encodeFunctionData({
      abi: simpleAccountFactoryAbi,
      functionName: "getAddress",
      args: [normalizedOwner, salt],
    });
    const raw = await transport.request<unknown>("eth_call", [
      { to: config.factory, data },
      "latest",
    ]);
    address = getAddress(
      decodeFunctionResult({
        abi: simpleAccountFactoryAbi,
        functionName: "getAddress",
        data: asData(
          typeof raw === "string" ? raw : "0x",
          "getAddress result",
        ),
      }),
    );
    checks.push({
      id: "account.derivation",
      stage: "account",
      label: "Account derivation",
      status: "pass",
      summary: `SimpleAccountFactory.getAddress resolves ${address}.`,
      method: "SimpleAccountFactory.getAddress",
      details: [
        { label: "Owner", value: normalizedOwner, mono: true },
        { label: "Salt", value: salt.toString(), mono: true },
        { label: "Smart account", value: address, mono: true },
      ],
    });
  } catch (error) {
    const report = normalizeFailure({
      stage: "account",
      method: "SimpleAccountFactory.getAddress",
      error,
      occurredAt: checkedAt,
    });
    failures.push(report);
    checks.push({
      id: "account.derivation",
      stage: "account",
      label: "Account derivation",
      status: "fail",
      summary: "Could not derive a SimpleAccount for this owner.",
      method: "SimpleAccountFactory.getAddress",
      failure: report,
    });
    return { checks, failures };
  }

  const codePromise = readCode(transport, address);
  const nonceData = encodeFunctionData({
    abi: entryPointV07Abi,
    functionName: "getNonce",
    args: [address, 0n],
  });
  const depositData = encodeFunctionData({
    abi: entryPointV07Abi,
    functionName: "balanceOf",
    args: [address],
  });
  const [codeResult, nonceResult, depositResult, balanceResult] =
    await Promise.allSettled([
      codePromise,
      transport.request<unknown>("eth_call", [
        { to: config.entryPoint, data: nonceData },
        "latest",
      ]),
      transport.request<unknown>("eth_call", [
        { to: config.entryPoint, data: depositData },
        "latest",
      ]),
      transport.request<unknown>("eth_getBalance", [address, "latest"]),
    ]);

  let deployed = false;
  if (codeResult.status === "fulfilled") {
    deployed = codeResult.value !== "0x";
    checks.push({
      id: "account.deployed",
      stage: "account",
      label: "Account deployment",
      status: "pass",
      summary: deployed
        ? "The SimpleAccount has bytecode and can execute UserOperations."
        : "Counterfactual account. The first UserOperation must include factory and factoryData.",
      method: "eth_getCode",
      details: [
        { label: "Address", value: address, mono: true },
        { label: "State", value: deployed ? "Deployed" : "Counterfactual" },
      ],
    });
  } else {
    const report = normalizeFailure({
      stage: "account",
      method: "eth_getCode",
      error: codeResult.reason,
      occurredAt: checkedAt,
    });
    failures.push(report);
    checks.push({
      id: "account.deployed",
      stage: "account",
      label: "Account deployment",
      status: "fail",
      summary: "Could not read the smart-account bytecode.",
      method: "eth_getCode",
      failure: report,
    });
  }

  let nonce = 0n;
  if (nonceResult.status === "fulfilled") {
    try {
      const raw = asData(
        typeof nonceResult.value === "string" ? nonceResult.value : "0x",
        "getNonce result",
      );
      nonce = decodeFunctionResult({
        abi: entryPointV07Abi,
        functionName: "getNonce",
        data: raw,
      });
      checks.push({
        id: "account.nonce",
        stage: "account",
        label: "EntryPoint nonce",
        status: "pass",
        summary: `Nonce key 0 is ${nonce.toString()}.`,
        method: "EntryPoint.getNonce",
        details: [{ label: "Nonce", value: nonce.toString(), mono: true }],
      });
    } catch (error) {
      const report = normalizeFailure({
        stage: "account",
        method: "EntryPoint.getNonce",
        error,
        occurredAt: checkedAt,
      });
      failures.push(report);
      checks.push({
        id: "account.nonce",
        stage: "account",
        label: "EntryPoint nonce",
        status: "fail",
        summary: "The EntryPoint nonce response was malformed.",
        method: "EntryPoint.getNonce",
        failure: report,
      });
    }
  } else {
    const report = normalizeFailure({
      stage: "account",
      method: "EntryPoint.getNonce",
      error: nonceResult.reason,
      occurredAt: checkedAt,
    });
    failures.push(report);
    checks.push({
      id: "account.nonce",
      stage: "account",
      label: "EntryPoint nonce",
      status: "fail",
      summary: "Could not read the EntryPoint nonce.",
      method: "EntryPoint.getNonce",
      failure: report,
    });
  }

  let deposit = 0n;
  if (depositResult.status === "fulfilled") {
    try {
      deposit = decodeFunctionResult({
        abi: entryPointV07Abi,
        functionName: "balanceOf",
        data: asData(
          typeof depositResult.value === "string" ? depositResult.value : "0x",
          "balanceOf result",
        ),
      });
    } catch {
      deposit = 0n;
    }
  }

  let balance = 0n;
  if (balanceResult.status === "fulfilled") {
    try {
      balance = quantityToBigInt(balanceResult.value, "native balance");
    } catch {
      balance = 0n;
    }
  }

  const hasFunds = deposit > 0n || balance > 0n;
  checks.push({
    id: "account.funding",
    stage: "account",
    label: "Gas funding",
    status: hasFunds ? "pass" : "warn",
    summary: hasFunds
      ? `Smart account can cover gas: ${formatBot(balance)} BOT native, ${formatBot(deposit)} BOT EntryPoint deposit.`
      : "No native BOT and no EntryPoint deposit. Fund the smart account before estimating a UserOperation.",
    method: "EntryPoint.balanceOf + eth_getBalance",
    details: [
      { label: "Native BOT", value: `${formatBot(balance)} BOT`, mono: true },
      { label: "EntryPoint deposit", value: `${formatBot(deposit)} BOT`, mono: true },
    ],
  });

  const snapshot: AccountSnapshot = {
    owner: normalizedOwner,
    salt: salt.toString(),
    address,
    deployed,
    nonce: nonce.toString(),
    entryPointDeposit: deposit.toString(),
    nativeBalance: balance.toString(),
    checkedAt,
  };

  return { checks, failures, snapshot };
}

export async function runSponsorshipDiagnostics(
  transport: JsonRpcTransport,
  config: ConformConfig,
): Promise<StageResult<SponsorshipSnapshot>> {
  const checks: CheckResult[] = [];
  const failures: FailureReport[] = [];
  const checkedAt = now();

  if (!config.paymasterAddress) {
    const snapshot: SponsorshipSnapshot = {
      state: "unknown",
      disclosure: SPONSORSHIP_DISCLOSURE,
      checkedAt,
    };
    checks.push({
      id: "sponsorship.status",
      stage: "sponsorship",
      label: "ERC-4337 sponsorship",
      status: "unknown",
      summary: "Unknown. No BOT-compatible paymaster is configured in this workspace.",
      details: [
        {
          label: "Policy",
          value: "No public BOT Chain ERC-4337 paymaster is assumed.",
        },
        {
          label: "Note",
          value:
            "EOA Paymaster documentation describes a different transaction flow, not ERC-4337 sponsorship.",
        },
      ],
    });
    return { checks, failures, snapshot };
  }

  let codePresent = false;
  try {
    const code = await readCode(transport, config.paymasterAddress);
    codePresent = code !== "0x";
    checks.push({
      id: "sponsorship.contract",
      stage: "sponsorship",
      label: "Paymaster contract",
      status: codePresent ? "pass" : "fail",
      summary: codePresent
        ? "A paymaster contract is deployed at the configured address."
        : "No paymaster bytecode exists at the configured address.",
      method: "eth_getCode",
      details: [
        { label: "Address", value: config.paymasterAddress, mono: true },
      ],
    });
    if (!codePresent) {
      const report = normalizeFailure({
        stage: "sponsorship",
        method: "eth_getCode",
        error: new Error("Configured paymaster has no bytecode"),
        occurredAt: checkedAt,
      });
      failures.push(report);
    }
  } catch (error) {
    const report = normalizeFailure({
      stage: "sponsorship",
      method: "eth_getCode",
      error,
      occurredAt: checkedAt,
    });
    failures.push(report);
    checks.push({
      id: "sponsorship.contract",
      stage: "sponsorship",
      label: "Paymaster contract",
      status: "fail",
      summary: "Could not inspect the configured paymaster contract.",
      method: "eth_getCode",
      failure: report,
    });
  }

  let deposit = 0n;
  if (codePresent) {
    try {
      const data = encodeFunctionData({
        abi: entryPointV07Abi,
        functionName: "balanceOf",
        args: [config.paymasterAddress],
      });
      const raw = await transport.request<unknown>("eth_call", [
        { to: config.entryPoint, data },
        "latest",
      ]);
      deposit = decodeFunctionResult({
        abi: entryPointV07Abi,
        functionName: "balanceOf",
        data: asData(
          typeof raw === "string" ? raw : "0x",
          "paymaster deposit",
        ),
      });
      checks.push({
        id: "sponsorship.deposit",
        stage: "sponsorship",
        label: "Paymaster deposit",
        status: deposit > 0n ? "pass" : "warn",
        summary:
          deposit > 0n
            ? `EntryPoint deposit is ${formatBot(deposit)} BOT.`
            : "The paymaster has no EntryPoint deposit and cannot prefund a UserOperation.",
        method: "EntryPoint.balanceOf",
        details: [
          { label: "Deposit", value: `${formatBot(deposit)} BOT`, mono: true },
        ],
      });
    } catch (error) {
      const report = normalizeFailure({
        stage: "sponsorship",
        method: "EntryPoint.balanceOf",
        error,
        occurredAt: checkedAt,
      });
      failures.push(report);
      checks.push({
        id: "sponsorship.deposit",
        stage: "sponsorship",
        label: "Paymaster deposit",
        status: "fail",
        summary: "Could not read the paymaster's EntryPoint deposit.",
        method: "EntryPoint.balanceOf",
        failure: report,
      });
    }
  } else {
    checks.push({
      id: "sponsorship.deposit",
      stage: "sponsorship",
      label: "Paymaster deposit",
      status: "skip",
      summary: "Skipped because no paymaster contract was found.",
    });
  }

  checks.push({
    id: "sponsorship.policy",
    stage: "sponsorship",
    label: "Sponsorship policy",
    status: "unknown",
    summary:
      "Contract presence does not prove a working sponsorship policy. Conform does not submit sponsored UserOperations.",
    details: [
      {
        label: "Requirement",
        value:
          "Payload format, validation, stake and policy must be verified with the paymaster operator.",
      },
    ],
  });

  const snapshot: SponsorshipSnapshot = {
    state: "configured",
    paymasterAddress: config.paymasterAddress,
    codePresent,
    deposit: deposit.toString(),
    disclosure:
      "A paymaster is configured, but sponsorship support remains unconfirmed until a sponsored UserOperation succeeds.",
    checkedAt,
  };

  return { checks, failures, snapshot };
}

export interface RunDiagnosticsOptions {
  config: ConformConfig;
  rpc: JsonRpcTransport;
  bundler: JsonRpcTransport;
  owner?: string;
  salt?: bigint;
  source?: "live" | "demo";
}

export async function runDiagnostics(
  options: RunDiagnosticsOptions,
): Promise<DiagnosticRun> {
  const startedAt = now();
  const { config, rpc, bundler } = options;

  const network = await runNetworkDiagnostics(rpc, config);
  const bundlerResult = await runBundlerDiagnostics(bundler, config);
  const contracts = await runContractDiagnostics(rpc, config);
  const sponsorship = await runSponsorshipDiagnostics(rpc, config);

  let account: StageResult<AccountSnapshot> | undefined;
  if (options.owner) {
    account = await runAccountDiagnostics(
      rpc,
      config,
      options.owner,
      options.salt ?? 0n,
    );
  } else {
    account = {
      checks: [
        {
          id: "account.not-tested",
          stage: "account",
          label: "Smart account path",
          status: "skip",
          summary:
            "No owner address was supplied. Infrastructure checks ran without the account path.",
        },
      ],
      failures: [],
    };
  }

  const checks = [
    ...network.checks,
    ...bundlerResult.checks,
    ...contracts.checks,
    ...account.checks,
    ...sponsorship.checks,
  ];

  return {
    source: options.source ?? "live",
    config: toPublicConfig(config),
    checks,
    network: network.snapshot,
    bundler: bundlerResult.snapshot,
    contracts: contracts.snapshot,
    account: account.snapshot,
    sponsorship: sponsorship.snapshot ?? {
      state: "unknown",
      disclosure: SPONSORSHIP_DISCLOSURE,
      checkedAt: now(),
    },
    failures: [
      ...network.failures,
      ...bundlerResult.failures,
      ...contracts.failures,
      ...account.failures,
      ...sponsorship.failures,
    ],
    startedAt,
    finishedAt: now(),
  };
}

export function summarizeChecks(checks: CheckResult[]): RunSummary {
  const pass = checks.filter((check) => check.status === "pass").length;
  const warn = checks.filter((check) => check.status === "warn").length;
  const fail = checks.filter((check) => check.status === "fail").length;
  const skip = checks.filter((check) => check.status === "skip").length;
  const unknown = checks.filter((check) => check.status === "unknown").length;
  const status =
    fail > 0
      ? "failed"
      : warn > 0 || unknown > 0
        ? "attention"
        : pass > 0
          ? "passed"
          : "incomplete";
  return { status, pass, warn, fail, skip, unknown, total: checks.length };
}

export function findCheck(
  checks: CheckResult[],
  id: string,
): CheckResult | undefined {
  return checks.find((check) => check.id === id);
}

export function checksForStage(
  checks: CheckResult[],
  stage: CheckResult["stage"],
): CheckResult[] {
  return checks.filter((check) => check.stage === stage);
}

export function feeQuoteFromGwei(
  maxFeeGwei: number,
  priorityFeeGwei: number,
): FeeQuote {
  return {
    maxFeePerGas: `0x${BigInt(Math.round(maxFeeGwei * 1e9)).toString(16)}`,
    maxPriorityFeePerGas: `0x${BigInt(Math.round(priorityFeeGwei * 1e9)).toString(16)}`,
  };
}

export function describeFeeQuote(quote: FeeQuote): string {
  return `${formatGweiValue(BigInt(quote.maxFeePerGas))} gwei max · ${formatGweiValue(BigInt(quote.maxPriorityFeePerGas))} gwei priority`;
}

export function hasAaFailure(failures: FailureReport[]): boolean {
  return failures.some((entry) => Boolean(findAaCode(entry.message)));
}

export { DUMMY_SIGNATURE };
