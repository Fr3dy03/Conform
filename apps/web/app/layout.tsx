import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { BotChainFooter } from "@conform/ui";
import "./globals.css";

function siteUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

const description =
  "A BOT Chain testnet workbench for ERC-4337. Check network identity, bundler methods, deployments, SimpleAccount derivation, and a receipt-backed UserOperation.";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Conform — BOT Chain ERC-4337 conformance",
    template: "%s — Conform",
  },
  description,
  applicationName: "Conform",
  category: "developer tools",
  keywords: [
    "BOT Chain",
    "ERC-4337",
    "account abstraction",
    "EntryPoint v0.7",
    "SimpleAccount",
    "bundler",
    "smart accounts",
    "testnet",
  ],
  authors: [{ name: "Conform" }],
  creator: "Conform",
  openGraph: {
    type: "website",
    siteName: "Conform",
    title: "Conform — BOT Chain ERC-4337 conformance",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conform — BOT Chain ERC-4337 conformance",
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#070907",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-lime focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <div className="flex-1">{children}</div>
        <BotChainFooter />
      </body>
    </html>
  );
}
