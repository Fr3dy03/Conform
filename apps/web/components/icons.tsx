import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ArrowUpRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 14 14 6M7.5 6H14v6.5" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 10h13M11.5 5l5 5-5 5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4 10.5 3.6 3.6L16 5.7" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 3.2 18 17H2L10 3.2Z" />
      <path d="M10 7.5v4M10 14.3v.2" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 2.5 16.5 5v5.2c0 3.5-2.6 6.1-6.5 7.3-3.9-1.2-6.5-3.8-6.5-7.3V5L10 2.5Z" />
      <path d="m7 10 2.1 2.1L13.4 7.8" />
    </svg>
  );
}

export function TerminalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <path d="m6 8 2.4 2L6 12M10.5 12h3.5" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m10 2.8 7 3.6-7 3.6-7-3.6 7-3.6Z" />
      <path d="m3 10 7 3.6 7-3.6M3 13.6l7 3.6 7-3.6" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z" />
      <path d="M3 7h12.5M13 11h4v3h-4a1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 2.5h10v15l-2-1.4-3 1.4-3-1.4-2 1.4v-15Z" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
    </svg>
  );
}

export function NetworkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="5" cy="5" r="2" />
      <circle cx="15" cy="5" r="2" />
      <circle cx="10" cy="15" r="2" />
      <path d="m6.7 6 2.1 7M13.3 6l-2.1 7M7 5h6" />
    </svg>
  );
}

export function BracesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5H5.5A1.5 1.5 0 0 0 4 5v2.2a2.3 2.3 0 0 1-1.5 2.2v1.2A2.3 2.3 0 0 1 4 12.8V15a1.5 1.5 0 0 0 1.5 1.5H7M13 3.5h1.5A1.5 1.5 0 0 1 16 5v2.2a2.3 2.3 0 0 0 1.5 2.2v1.2a2.3 2.3 0 0 0-1.5 2.2V15a1.5 1.5 0 0 1-1.5 1.5H13" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="8.5" width="12" height="9" rx="2" />
      <path d="M6.5 8.5V6a3.5 3.5 0 1 1 7 0v2.5M10 12v2.2" />
    </svg>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="4.5" cy="15.5" r="2" />
      <circle cx="15.5" cy="4.5" r="2" />
      <path d="M6.5 15.5h4a3 3 0 0 0 3-3v-3M10.5 4.5h-3a3 3 0 0 0-3 3v3" />
    </svg>
  );
}
