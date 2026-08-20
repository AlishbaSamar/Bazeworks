import { forwardRef, type ButtonHTMLAttributes } from "react";

const VARIANT_CLASSES = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-primary/50",
  secondary:
    "bg-white text-foreground border border-border hover:bg-background disabled:text-muted-foreground",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANT_CLASSES;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, disabled, className = "", children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
        {...rest}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
