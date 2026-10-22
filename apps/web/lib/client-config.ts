import type { ConformConfig, PublicConfig } from "@conform/chain";

export function clientConfigFromPublic(config: PublicConfig): ConformConfig {
  return {
    network: config.network,
    rpcUrl: `https://${config.rpcHost}`,
    bundlerUrl: `https://${config.bundlerHost}`,
    entryPoint: config.entryPoint,
    factory: config.factory,
    implementation: config.implementation,
    paymasterAddress: config.paymaster.configured
      ? config.paymaster.address
      : undefined,
    docsUrl: config.docsUrl,
    verifiedAt: config.verifiedAt,
  };
}
