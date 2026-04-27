import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-primary-50 text-primary-700 border-primary-200/50",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    warning: "bg-amber-50 text-amber-700 border-amber-200/50",
    danger: "bg-red-50 text-red-700 border-red-200/50",
    info: "bg-blue-50 text-blue-700 border-blue-200/50",
    outline: "bg-transparent text-surface-600 border-surface-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11.5px] font-semibold border leading-relaxed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
