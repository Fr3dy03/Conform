import type { Metadata } from "next";
import { ConsoleWorkbench } from "@/components/console/console-workbench";
import { loadPublicConfig } from "@/lib/server-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conformance console",
  description:
    "Run BOT Chain testnet ERC-4337 checks, derive a SimpleAccount, sign a UserOperation with your wallet, and verify the receipt.",
  alternates: {
    canonical: "/console",
  },
  openGraph: {
    title: "Conform conformance console",
    description:
      "Network, bundler, contracts, account, UserOperation, and receipt evidence for BOT Chain testnet.",
    url: "/console",
  },
};

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string | string[] }>;
}) {
  const params = await searchParams;
  const demoParam = Array.isArray(params.demo) ? params.demo[0] : params.demo;
  const loaded = loadPublicConfig();

  return (
    <ConsoleWorkbench
      publicConfig={loaded.config}
      configError={loaded.configError}
      initialDemo={demoParam === "1"}
    />
  );
}
