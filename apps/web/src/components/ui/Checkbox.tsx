import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className = "", ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2.5">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={!!error}
            className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border-strong text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${className}`}
            {...rest}
          />
          <label htmlFor={inputId} className="text-sm leading-5 text-muted-foreground">
            {label}
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
