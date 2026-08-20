"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormBanner } from "@/components/ui/FormBanner";
import { OAuthButton } from "@/components/ui/OAuthButton";
import { GoogleIcon, GithubIcon } from "@/components/icons/ProviderIcons";
import { PasswordStrengthMeter, scorePassword } from "@/components/ui/PasswordStrengthMeter";
import { useAuth, ApiError } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTermsError(null);

    if (!agreedToTerms) {
      setTermsError("You must accept the Terms of Service to continue");
      return;
    }
    if (scorePassword(password) < 2) {
      setError("Please choose a stronger password");
      return;
    }

    setLoading(true);
    try {
      await signup(fullName, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start building with Bazeworks"
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Log in
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
          label="Full name"
          type="text"
          name="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Work email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <div className="flex flex-col gap-2">
          <Input
            label="Password"
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

        <Checkbox
          name="terms"
          checked={agreedToTerms}
          onChange={(e) => {
            setAgreedToTerms(e.target.checked);
            setTermsError(null);
          }}
          error={termsError ?? undefined}
          label={
            <>
              I agree to the{" "}
              <Link href="#" className="font-medium text-foreground hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-medium text-foreground hover:underline">
                Privacy Policy
              </Link>
            </>
          }
        />

        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
