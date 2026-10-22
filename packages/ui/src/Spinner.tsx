import { cn } from "./cn";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-3.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent",
        className,
      )}
      role="status"
      aria-label={label}
    />
  );
}
