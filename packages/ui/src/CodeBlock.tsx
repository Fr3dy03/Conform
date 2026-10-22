import type { ReactNode } from "react";
import { CopyButton } from "./CopyButton";
import { cn } from "./cn";

export function CodeBlock({
  code,
  label,
  copyable = true,
  className,
  children,
}: {
  code: string;
  label?: ReactNode;
  copyable?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-[#080b09]",
        className,
      )}
    >
      {label || copyable ? (
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
            {label ?? "Code"}
          </span>
          {copyable ? <CopyButton value={code} compact /> : null}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-5 text-paper/85">
        <code>{children ?? code}</code>
      </pre>
    </div>
  );
}
