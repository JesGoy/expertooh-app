"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "./lib/cn";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-neutral-300 text-[#FF6B00]",
            "focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {label && <span className="text-sm text-neutral-700">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox, type CheckboxProps };