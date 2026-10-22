import { encodeFunctionData, getAddress } from "viem";
import { simpleAccountAbi, simpleAccountFactoryAbi } from "./abi";
import { officialConfig, toPublicConfig } from "./config";
import {
  BOT_BUNDLER_EXTENSION,
  REQUIRED_BUNDLER_METHODS,
  SPONSORSHIP_DISCLOSURE,
} from "./constants";
import type {
  CheckResult,
  DiagnosticRun,
  PreparedUserOperation,
  UserOperationReceiptSnapshot,
} from "./types";

const demoOwner = getAddress("0x8ba1f109551bd432803012645ac136ddd64dba72");
const demoAccount = getAddress("0x4c8b6c2a9f0f4f3c2b1a5a3d9e8f7c6b5a4d3e2f");

export const DEMO_USEROP_HASH =
  "0x7f1d3c9a8b2e4f6017a5c3d9e2b8f4a6c1d7e3b9f5a2c8d4e6f1b7a3c9d5e2f8" as const;
export const DEMO_TX_HASH =
  "0x9a4e2c8f1b7d5a3e6f9c2b8d4a7e1f5039c6b2d8a5e4f1c7b3d9a6e2f8c5b1d4" as const;

export function createDemoPreparedUserOperation(): PreparedUserOperation {
  const config = officialConfig();
  const callData = encodeFunctionData({
    abi: simpleAccountAbi,
    functionName: "execute",
    args: [demoOwner, 0n, "0x"],
  });
  const factoryData = encodeFunctionData({
    abi: simpleAccountFactoryAbi,
    functionName: "createAccount",
    args: [demoOwner, 0n],
  });
  const maxFeePerGas = "0x4a817c800";
  const maxPriorityFeePerGas = "0x3b9aca00";
  return {
    operation: {
      sender: demoAccount,
      nonce: "0x0",
      factory: config.factory,
      factoryData,
      callData,
      callGasLimit: "0xef68",
      verificationGasLimit: "0x231f4",
      preVerificationGas: "0xbbf8",
      maxFeePerGas,
      maxPriorityFeePerGas,
      signature: "0x",
    },
    gas: {
      callGasLimit: BigInt("0xef68").toString(),
      verificationGasLimit: BigInt("0x231f4").toString(),
      preVerificationGas: BigInt("0xbbf8").toString(),
      maxFeePerGas: BigInt(maxFeePerGas).toString(),
      maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas).toString(),
    },
    userOpHash: DEMO_USEROP_HASH,
    feeQuote: { maxFeePerGas, maxPriorityFeePerGas },
    target: demoOwner,
    summary:
      "Demo: first UserOperation deploys SimpleAccount · no-value execute() call · no paymaster",
  };
}

export function createDemoReceipt(): UserOperationReceiptSnapshot {
  return {
    userOpHash: DEMO_USEROP_HASH,
    success: true,
    transactionHash: DEMO_TX_HASH,
    blockNumber: 27_418_231,
    outerStatus: "0x1",
    actualGasCost: "579126400000000",
    actualGasUsed: "193842",
  };
}

export function createDemoRun(now = new Date()): DiagnosticRun {
  const config = officialConfig();
  const started = new Date(now.getTime() - 842);
  const checkedAt = now.toISOString();

  const checks: CheckResult[] = [
    {
      id: "network.chain-id",
      stage: "network",
      label: "Chain ID",
      status: "pass",
      summary: "RPC identifies as BOT Chain Testnet (968).",
      method: "eth_chainId",
      durationMs: 96,
      details: [
        { label: "Returned", value: "0x3c8", mono: true },
        { label: "Expected", value: "0x3c8", mono: true },
      ],
    },
    {
      id: "network.block-height",
      stage: "network",
      label: "Block height",
      status: "pass",
      summary: "Latest block 27,418,224.",
      method: "eth_blockNumber",
      durationMs: 58,
    },
    {
      id: "network.client",
      stage: "network",
      label: "Client version",
      status: "pass",
      summary: "Geth/v1.5.13 (demo)",
      method: "web3_clientVersion",
      durationMs: 61,
    },
    {
      id: "network.latest-block",
      stage: "network",
      label: "Latest block",
      status: "pass",
      summary: "Block 27,418,224 · 0x91d2…",
      method: "eth_getBlockByNumber",
      durationMs: 114,
    },
    {
      id: "network.latency",
      stage: "network",
      label: "RPC latency",
      status: "pass",
      summary: "184 ms for eth_chainId.",
      method: "eth_chainId",
      durationMs: 184,
    },
    {
      id: "bundler.chain-id",
      stage: "bundler",
      label: "Bundler chain identity",
      status: "pass",
      summary: "Bundler matches BOT Chain Testnet (968).",
      method: "eth_chainId",
      durationMs: 221,
    },
    ...REQUIRED_BUNDLER_METHODS.map((method) => ({
      id: `bundler.method.${method}`,
      stage: "bundler" as const,
      label: method,
      status: "pass" as const,
      summary:
        method === "eth_supportedEntryPoints"
          ? "EntryPoint 0x0000000071727De22E5E9d8BAf0edAc6f37da032 is supported."
          : "Method present; probe rejection is expected for a malformed payload.",
      method,
      durationMs: 84,
    })),
    {
      id: `bundler.method.${BOT_BUNDLER_EXTENSION}`,
      stage: "bundler",
      label: BOT_BUNDLER_EXTENSION,
      status: "pass",
      summary: "Method present; returned a UserOperation fee quote.",
      method: BOT_BUNDLER_EXTENSION,
      durationMs: 92,
    },
    {
      id: "contracts.entrypoint",
      stage: "contracts",
      label: "EntryPoint v0.7",
      status: "pass",
      summary: "EntryPoint v0.7 is deployed (16,035 bytes).",
      method: "eth_getCode",
      durationMs: 72,
    },
    {
      id: "contracts.factory",
      stage: "contracts",
      label: "SimpleAccountFactory",
      status: "pass",
      summary: "SimpleAccountFactory is deployed (2,288 bytes).",
      method: "eth_getCode",
      durationMs: 68,
    },
    {
      id: "contracts.implementation",
      stage: "contracts",
      label: "SimpleAccount implementation",
      status: "pass",
      summary: "SimpleAccount implementation is deployed (7,792 bytes).",
      method: "eth_getCode",
      durationMs: 70,
    },
    {
      id: "contracts.factory-implementation",
      stage: "contracts",
      label: "Factory implementation",
      status: "pass",
      summary: "SimpleAccountFactory resolves the configured implementation.",
      method: "eth_call",
      durationMs: 81,
    },
    {
      id: "contracts.entrypoint-interface",
      stage: "contracts",
      label: "EntryPoint interface",
      status: "pass",
      summary: "getNonce(address,uint192) responds at the configured EntryPoint.",
      method: "eth_call",
      durationMs: 76,
    },
    {
      id: "account.derivation",
      stage: "account",
      label: "Account derivation",
      status: "pass",
      summary: `SimpleAccountFactory.getAddress resolves ${demoAccount}.`,
      method: "SimpleAccountFactory.getAddress",
      durationMs: 89,
      details: [
        { label: "Owner", value: demoOwner, mono: true },
        { label: "Salt", value: "0", mono: true },
        { label: "Smart account", value: demoAccount, mono: true },
      ],
    },
    {
      id: "account.deployed",
      stage: "account",
      label: "Account deployment",
      status: "pass",
      summary:
        "Counterfactual account. The first UserOperation must include factory and factoryData.",
      method: "eth_getCode",
      durationMs: 63,
    },
    {
      id: "account.nonce",
      stage: "account",
      label: "EntryPoint nonce",
      status: "pass",
      summary: "Nonce key 0 is 0.",
      method: "EntryPoint.getNonce",
      durationMs: 75,
    },
    {
      id: "account.funding",
      stage: "account",
      label: "Gas funding",
      status: "pass",
      summary:
        "Smart account can cover gas: 0.08 BOT native, 0 BOT EntryPoint deposit.",
      method: "EntryPoint.balanceOf + eth_getBalance",
      durationMs: 94,
    },
    {
      id: "sponsorship.status",
      stage: "sponsorship",
      label: "ERC-4337 sponsorship",
      status: "unknown",
      summary: "Unknown. No BOT-compatible paymaster is configured in this workspace.",
    },
  ];

  return {
    source: "demo",
    config: toPublicConfig(config),
    checks,
    network: {
      chainId: 968,
      chainIdHex: "0x3c8",
      blockNumber: 27_418_224,
      blockHash:
        "0x91d2c4b7f0a3e5d8c1b6a4f2e9d7c3b5a8f6e1d4c2b9a7f3e5d8c6b1a4f2e9d7",
      blockTimestamp: Math.floor(now.getTime() / 1_000) - 2,
      clientVersion: "Geth/v1.5.13 (demo)",
      latencyMs: 184,
      rpcHost: "rpc.bohr.life",
      checkedAt,
    },
    bundler: {
      chainId: 968,
      chainIdHex: "0x3c8",
      supportedEntryPoints: [config.entryPoint],
      methods: [
        ...REQUIRED_BUNDLER_METHODS.map((method) => ({
          method,
          present: true,
          required: true,
          note: "Demo method probe.",
        })),
        {
          method: BOT_BUNDLER_EXTENSION,
          present: true,
          required: false,
          note: "Demo method probe.",
        },
      ],
      latencyMs: 472,
      bundlerHost: "bundler.bohr.life",
      checkedAt,
    },
    contracts: {
      entryPoint: {
        address: config.entryPoint,
        codeSize: 16_035,
        deployed: true,
      },
      factory: {
        address: config.factory,
        codeSize: 2_288,
        deployed: true,
        implementation: config.implementation,
      },
      implementation: {
        address: config.implementation,
        codeSize: 7_792,
        deployed: true,
      },
      checkedAt,
    },
    account: {
      owner: demoOwner,
      salt: "0",
      address: demoAccount,
      deployed: false,
      nonce: "0",
      entryPointDeposit: "0",
      nativeBalance: "80000000000000000",
      checkedAt,
    },
    sponsorship: {
      state: "unknown",
      disclosure: SPONSORSHIP_DISCLOSURE,
      checkedAt,
    },
    failures: [],
    startedAt: started.toISOString(),
    finishedAt: now.toISOString(),
  };
}
