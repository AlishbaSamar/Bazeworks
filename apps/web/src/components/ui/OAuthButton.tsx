const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function OAuthButton({
  provider,
  icon,
  label,
}: {
  provider: "google" | "github";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={`${API_URL}/auth/${provider}`}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-border bg-white text-sm font-medium text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {icon}
      {label}
    </a>
  );
}
