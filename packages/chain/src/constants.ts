import type { Address, Hex } from "viem";

export const PRODUCT_NAME = "Conform";
export const PRODUCT_VERSION = "0.1.0";
export const VERIFIED_AT = "2026-10-21";

export const BOT_CHAIN_TESTNET = {
  id: 968,
  idHex: "0x3c8",
  name: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrl: "https://rpc.bohr.life",
  bundlerUrl: "https://bundler.bohr.life/rpc/",
  explorerUrl: "https://scan.bohr.life",
  faucetUrl: "https://faucet.botchain.ai/basic",
} as const;

export const BOT_CHAIN_MAINNET = {
  id: 677,
  name: "BOT Chain Mainnet",
  rpcUrl: "https://rpc.botchain.ai",
  explorerUrl: "https://scan.botchain.ai",
} as const;

export const ENTRYPOINT_V07 =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as Address;
export const SIMPLE_ACCOUNT_FACTORY =
  "0xBC88d6012b3bf8426C2851d3798cEB5257658332" as Address;
export const SIMPLE_ACCOUNT_IMPLEMENTATION =
  "0xDE15Ab00C52FF37eCe01C384eB42C802721db823" as Address;
export const TESTNET_MULTICALL3 =
  "0x8247F49Ea29fd9251466006812f5D0aF2050AC44" as Address;
export const SIMPLE_ACCOUNT_SALT = 0n;

export const DUMMY_SIGNATURE: Hex =
  "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";

export const REQUIRED_BUNDLER_METHODS = [
  "eth_supportedEntryPoints",
  "eth_estimateUserOperationGas",
  "eth_sendUserOperation",
  "eth_getUserOperationByHash",
  "eth_getUserOperationReceipt",
] as const;

export const BOT_BUNDLER_EXTENSION = "skandha_getGasPrice" as const;

// Skandha bundles sometimes return a verificationGasLimit that is too tight for
// real signature validation (AA26 over verificationGasLimit). Add a 30% buffer.
export const VERIFICATION_GAS_BUFFER_BPS = 3000n;

export const RPC_METHOD_ALLOWLIST = [
  "eth_chainId",
  "eth_blockNumber",
  "eth_getBlockByNumber",
  "web3_clientVersion",
  "eth_getCode",
  "eth_call",
  "eth_getBalance",
  "eth_getTransactionReceipt",
  "eth_gasPrice",
] as const;

export const BUNDLER_METHOD_ALLOWLIST = [
  "eth_chainId",
  "eth_supportedEntryPoints",
  "eth_estimateUserOperationGas",
  "eth_sendUserOperation",
  "eth_getUserOperationByHash",
  "eth_getUserOperationReceipt",
  BOT_BUNDLER_EXTENSION,
] as const;

export const OFFICIAL_LINKS = {
  botChain: "https://www.botchain.ai/en/",
  explorer: "https://scan.botchain.ai",
  developerDocs: "https://dev-docs.botchain.ai/",
  testnetExplorer: BOT_CHAIN_TESTNET.explorerUrl,
  accountAbstractionDocs:
    "https://dev-docs.botchain.ai/docs/Account-Abstraction",
  networkDocs:
    "https://dev-docs.botchain.ai/docs/Account-Abstraction/network-and-endpoints",
  bundlerDocs:
    "https://dev-docs.botchain.ai/docs/Account-Abstraction/erc-4337/bundler-rpc",
  quickGuide:
    "https://dev-docs.botchain.ai/docs/Developers/quick-guide/",
  brandKit:
    "https://www.botchain.ai/static/BOT%20Chain%20Assets/BOT%20Chain%20Brand%20Kit.zip",
} as const;

export const BOT_BRAND = {
  green: "#10A37F",
  lime: "#A4EF6B",
  deep: "#003626",
  white: "#FFFFFF",
} as const;

export const SPONSORSHIP_DISCLOSURE =
  "BOT Chain documentation does not publish a public ERC-4337 paymaster. Sponsorship remains unknown unless an independently verified paymaster is configured, and configuration alone does not prove it.";

export const EIP7702_DISCLOSURE =
  "BOT Chain nodes recognize EIP-7702 type 4 transactions, but the public BOT Chain Bundler does not currently support EIP-7702 UserOperations.";

export const EOA_PAYMASTER_NOTE =
  "The EOA Paymaster described by BOT Chain is a separate transaction-sharing flow and is not an ERC-4337 paymaster. Conform does not treat it as UserOperation sponsorship.";
