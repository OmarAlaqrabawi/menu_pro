import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", loading, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] cursor-pointer select-none";

    const variants: Record<string, string> = {
      default: "bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md",
      secondary: "bg-surface-800 text-white hover:bg-surface-700 shadow-sm",
      outline: "border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300",
      ghost: "text-surface-600 hover:bg-surface-100 hover:text-surface-900",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
      success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm",
    };

    const sizes: Record<string, string> = {
      sm: "h-9 px-3.5 text-sm",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
