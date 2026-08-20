const VARIANT_CLASSES = {
  error: "border-destructive/20 bg-destructive/5 text-destructive",
  success: "border-success/20 bg-success/5 text-success",
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
      className={`rounded-md border px-3.5 py-2.5 text-sm ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </div>
  );
}
