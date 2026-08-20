const LEVELS = [
  { label: "Too weak", color: "bg-destructive" },
  { label: "Weak", color: "bg-warning" },
  { label: "Fair", color: "bg-warning" },
  { label: "Good", color: "bg-success" },
  { label: "Strong", color: "bg-success" },
];

export function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = scorePassword(password);
  const level = LEVELS[score];

  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              password && i <= score - 1 ? level.color : "bg-border"
            }`}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs text-muted-foreground">{level.label}</p>
      )}
    </div>
  );
}
