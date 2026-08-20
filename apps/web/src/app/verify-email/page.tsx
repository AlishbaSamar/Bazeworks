"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { apiClient, ApiError } from "@/lib/api-client";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing a token.");
      return;
    }
    apiClient
      .post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Verification failed.");
      });
  }, [token]);

  return (
    <AuthCard title="Verify your email">
      {status === "verifying" && (
        <p className="text-sm text-muted-foreground">Verifying your email address…</p>
      )}
      {status === "success" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Your email has been verified. You can now use all Bazeworks features.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">Go to dashboard</Button>
          </Link>
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-destructive">{message}</p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">Back to login</Button>
          </Link>
        </div>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
