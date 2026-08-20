"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { OAuthButton } from "@/components/ui/OAuthButton";
import { GoogleIcon, GithubIcon } from "@/components/icons/ProviderIcons";
import { useAuth, ApiError } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to your Bazeworks account"
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <OAuthButton provider="google" icon={<GoogleIcon />} label="Continue with Google" />
        <OAuthButton provider="github" icon={<GithubIcon />} label="Continue with GitHub" />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

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

        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
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
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
