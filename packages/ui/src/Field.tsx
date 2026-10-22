"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "./cn";

const controlClasses =
  "w-full rounded-md border border-line-strong bg-[#0b0f0c] px-3 text-[12.5px] text-paper placeholder:text-muted/50 transition-colors hover:border-line-bright focus:border-lime/60 focus:outline-none focus:ring-2 focus:ring-lime/20 disabled:cursor-not-allowed disabled:opacity-50";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
  optional,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  htmlFor: string;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-baseline justify-between gap-2 text-[11.5px] font-medium text-paper/90"
      >
        <span>{label}</span>
        {optional ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            optional
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[11px] leading-4 text-coral" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[11px] leading-4 text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  mono?: boolean;
}

export function TextInput({
  label,
  hint,
  error,
  optional,
  mono,
  id,
  className,
  ...props
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={inputId}
      optional={optional}
    >
      <input
        id={inputId}
        className={cn(
          controlClasses,
          "h-10",
          mono && "font-mono text-[11px]",
          Boolean(error) &&
            "border-coral/50 focus:border-coral/70 focus:ring-coral/15",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
    </Field>
  );
}

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
}

export function SelectInput({
  label,
  hint,
  error,
  optional,
  id,
  className,
  children,
  ...props
}: SelectInputProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={selectId}
      optional={optional}
    >
      <select
        id={selectId}
        className={cn(
          controlClasses,
          "h-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%238A978D%22%20stroke-width%3D%221.2%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat pr-9",
          Boolean(error) && "border-coral/50",
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}
