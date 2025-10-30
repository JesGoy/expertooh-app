"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "./lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  fullWidth?: boolean;
  icon?: string;
  iconAlt?: string;
  iconOpacity?: number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, fullWidth = true, icon, iconAlt, iconOpacity = 0.45, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className={cn("flex flex-col gap-1", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <img
              src={icon}
              alt={iconAlt || "Icon"}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
              style={{ opacity: iconOpacity }}
            />
          )}
          <input
            className={cn(
              "rounded-2xl border border-neutral-200 bg-[#F9F9F9] text-[15px] outline-none transition-colors",
              "placeholder:text-neutral-500",
              "focus:border-[#FF6B00] focus:bg-white",
              "disabled:cursor-not-allowed disabled:opacity-50",
              icon ? "pl-12" : "px-4",
              isPassword ? "pr-12" : "pr-4",
              "py-[14px]",
              error && "border-red-500 focus:border-red-500",
              fullWidth && "w-full",
              className
            )}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-75 transition-opacity"
              tabIndex={-1}
            >
              <img
                src={showPassword ? "/icons/eye-off.svg" : "/icons/eye-on.svg"}
                alt={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="w-[18px] h-[18px] opacity-45"
              />
            </button>
          )}
        </div>
        {error && (
          <span className="text-sm text-red-500" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, type InputProps };