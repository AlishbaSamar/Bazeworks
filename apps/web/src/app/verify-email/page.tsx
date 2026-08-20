"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";

function VerifyEmailContent() {
  const params = useSearchParams();
  const error = params.get("error");

  if (error) {
    return (
      <AuthCard title="Verification failed">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-destructive">
            This verification link is invalid or has expired.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Back to login
            </Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Email verified">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Your email has been verified and you&apos;re signed in. You can now use all Bazeworks
          features.
        </p>
        <Link href="/dashboard">
          <Button className="w-full">Go to dashboard</Button>
        </Link>
      </div>
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
