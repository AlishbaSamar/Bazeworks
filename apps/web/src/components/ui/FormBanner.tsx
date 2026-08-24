const VARIANT_CLASSES = {
  error: "border-destructive/15 bg-destructive-soft text-destructive",
  success: "border-success/15 bg-success-soft text-success",
} as const;

const ICONS = {
  error: (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-10.3a1 1 0 00-1.4-1.4L9 9.58 7.7 8.3a1 1 0 00-1.4 1.42l2 2a1 1 0 001.4 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
} as const;

export function FormBanner({
  variant,
  children,
}: {
  variant: keyof typeof VARIANT_CLASSES;
  children: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm ${VARIANT_CLASSES[variant]}`}
    >
      {ICONS[variant]}
      <span>{children}</span>
    </div>
  );
}
