import {
  getAddress,
  parseEther,
  toHex,
  type Address,
  type EIP1193Provider,
  type Hex,
} from "viem";
import { z } from "zod";
import {
  BOT_CHAIN_TESTNET,
  type JsonRpcTransport,
  quantityToNumber,
} from "@conform/chain";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export class WalletError extends Error {
  readonly code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

export interface WalletConnection {
  address: Address;
  chainId: number;
}

const ReceiptSchema = z.object({
  status: z.string(),
  blockNumber: z.string().optional().nullable(),
  transactionHash: z.string().optional().nullable(),
});

function getProvider(): EIP1193Provider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new WalletError(
      "No injected wallet found. Install or enable a browser wallet such as MetaMask.",
    );
  }
  return window.ethereum;
}

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export function walletErrorCode(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "number"
  ) {
    return (error as { code: number }).code;
  }
  return undefined;
}

export async function connectWallet(): Promise<{
  address: Address;
  chainId: number;
}> {
  try {
    const accounts = await getProvider().request({
      method: "eth_requestAccounts",
    });
    const first =
      Array.isArray(accounts) && typeof accounts[0] === "string"
        ? accounts[0]
        : null;
    if (!first) {
      throw new WalletError("The wallet returned no accounts.");
    }
    const chainIdHex = await getProvider().request({
      method: "eth_chainId",
    });
    return {
      address: getAddress(first),
      chainId: quantityToNumber(chainIdHex, "wallet chain ID"),
    };
  } catch (error) {
    if (error instanceof WalletError) throw error;
    throw new WalletError(
      error instanceof Error ? error.message : "Wallet connection failed.",
      walletErrorCode(error),
    );
  }
}

export async function readWalletChainId(): Promise<number> {
  const chainIdHex = await getProvider().request({
    method: "eth_chainId",
  });
  return quantityToNumber(chainIdHex, "wallet chain ID");
}

export async function switchToBotChain(): Promise<void> {
  const provider = getProvider();
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BOT_CHAIN_TESTNET.idHex }],
    });
  } catch (error) {
    const code = walletErrorCode(error);
    if (code !== 4902 && code !== -32603) {
      throw new WalletError(
        error instanceof Error ? error.message : "Could not switch networks.",
        code,
      );
    }
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BOT_CHAIN_TESTNET.idHex,
            chainName: BOT_CHAIN_TESTNET.name,
            nativeCurrency: BOT_CHAIN_TESTNET.nativeCurrency,
            rpcUrls: [BOT_CHAIN_TESTNET.rpcUrl],
            blockExplorerUrls: [BOT_CHAIN_TESTNET.explorerUrl],
            iconUrls: [],
          },
        ],
      });
    } catch (addError) {
      throw new WalletError(
        addError instanceof Error
          ? addError.message
          : "Could not add BOT Chain Testnet to the wallet.",
        walletErrorCode(addError),
      );
    }
  }
}

export async function signUserOperationHash(
  hash: Hex,
  owner: Address,
): Promise<Hex> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    throw new WalletError("The UserOperation hash is not a 32-byte value.");
  }
  let signature: `0x${string}`;
  try {
    const result = await getProvider().request({
      method: "personal_sign",
      params: [hash, owner],
    });
    if (typeof result !== "string") {
      throw new Error("Wallet returned a non-string signature.");
    }
    signature = result as `0x${string}`;
  } catch (error) {
    throw new WalletError(
      error instanceof Error
        ? error.message
        : "The wallet rejected the signature request.",
      walletErrorCode(error),
    );
  }
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) {
    throw new WalletError(
      "The wallet signature is not 65 bytes. Use an EOA wallet that supports personal_sign over a raw hash.",
    );
  }
  return signature;
}

export async function sendNativeTransfer(input: {
  from: Address;
  to: Address;
  amountBot: string;
}): Promise<Hex> {
  if (!/^\d+(\.\d{1,18})?$/.test(input.amountBot)) {
    throw new WalletError("Enter a positive BOT amount with up to 18 decimals.");
  }
  try {
    const result = await getProvider().request({
      method: "eth_sendTransaction",
      params: [
        {
          from: input.from,
          to: input.to,
          value: toHex(parseEther(input.amountBot)),
        },
      ],
    });
    if (typeof result !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(result)) {
      throw new Error("Wallet returned an invalid transaction hash.");
    }
    return result as Hex;
  } catch (error) {
    throw new WalletError(
      error instanceof Error
        ? error.message
        : "The wallet rejected the funding transaction.",
      walletErrorCode(error),
    );
  }
}

export async function waitForFundingTransaction(
  transport: JsonRpcTransport,
  hash: Hex,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<{ confirmed: boolean; success: boolean; blockNumber?: number }> {
  const timeoutMs = options.timeoutMs ?? 90_000;
  const intervalMs = options.intervalMs ?? 2_000;
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const raw = await transport.request<unknown>("eth_getTransactionReceipt", [
      hash,
    ]);
    if (raw !== null && raw !== undefined) {
      const parsed = ReceiptSchema.safeParse(raw);
      if (!parsed.success) {
        throw new WalletError(
          "The RPC returned a malformed funding transaction receipt.",
        );
      }
      return {
        confirmed: true,
        success: parsed.data.status === "0x1",
        blockNumber: parsed.data.blockNumber
          ? quantityToNumber(parsed.data.blockNumber, "funding block")
          : undefined,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { confirmed: false, success: false };
}
