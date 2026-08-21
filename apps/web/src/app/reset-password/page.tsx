"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { PasswordStrengthMeter, scorePassword } from "@/components/ui/PasswordStrengthMeter";
import { authClient } from "@/lib/auth-client";

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing a token.");
      return;
    }
    if (scorePassword(password) < 2) {
      setError("Please choose a stronger password");
      return;
    }

    setLoading(true);
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthCard title="Password updated">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Your password has been reset. You can now log in with your new password.
          </p>
          <Button className="w-full" onClick={() => router.push("/login")}>
            Go to login
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      footer={
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Back to login
        </Link>
      }
    >
      {!token ? (
        <FormBanner variant="error">
          This reset link is invalid. Request a new one from the{" "}
          <Link href="/forgot-password" className="underline">
            forgot password
          </Link>{" "}
          page.
        </FormBanner>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {error && <FormBanner variant="error">{error}</FormBanner>}

          <div className="flex flex-col gap-2">
            <Input
              label="New password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Reset password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
