"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/ui/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message ?? "Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        footer={
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Back to login
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{email}</span>,
          we&apos;ve sent a link to reset your password. Check the API server console for the
          stubbed email link.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <span>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Back to login
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <FormBanner variant="error">{error}</FormBanner>}

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Button type="submit" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
