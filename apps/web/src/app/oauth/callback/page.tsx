"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import { apiClient } from "@/lib/api-client";
import { useAuth, type PublicUser } from "@/lib/auth-context";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [error, setError] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");

    if (!accessToken) {
      setError(true);
      return;
    }

    apiClient
      .get<PublicUser>("/auth/me", { accessToken })
      .then((user) => {
        setSession(user, accessToken);
        router.replace("/dashboard");
      })
      .catch(() => setError(true));
  }, [router, setSession]);

  return (
    <AuthCard title="Signing you in">
      <p className="text-sm text-muted-foreground">
        {error
          ? "We couldn't complete sign-in. Please try again from the login page."
          : "Completing sign-in…"}
      </p>
    </AuthCard>
  );
}
