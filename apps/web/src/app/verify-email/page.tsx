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
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive-soft text-destructive">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-10.3a1 1 0 00-1.4-1.4L9 9.58 7.7 8.3a1 1 0 00-1.4 1.42l2 2a1 1 0 001.4 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
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
