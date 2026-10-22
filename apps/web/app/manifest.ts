import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Conform — BOT Chain ERC-4337 conformance",
    short_name: "Conform",
    description:
      "Run ERC-4337 checks on BOT Chain testnet: network, bundler, contracts, account, and UserOperation receipt.",
    start_url: "/console",
    display: "standalone",
    background_color: "#070907",
    theme_color: "#070907",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
