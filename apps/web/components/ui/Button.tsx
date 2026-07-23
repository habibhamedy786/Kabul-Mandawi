import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500",
  secondary: "bg-ink-900 text-white hover:bg-ink-800 focus-visible:ring-ink-700",
  outline: "border border-ink-200 text-ink-800 hover:bg-ink-50 focus-visible:ring-ink-300",
  ghost: "text-ink-700 hover:bg-ink-100 focus-visible:ring-ink-300",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    const sizeClasses = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-base" }[size];
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
