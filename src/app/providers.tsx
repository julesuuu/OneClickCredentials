"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => {
        router.refresh();
      }}
      redirectTo="/dashboard"
      social={{
        providers: ["google", "github"],
      }}
      emailOTP
      emailVerification={{
        otp: true,
      }}
      twoFactor={["otp", "totp"]}
      Link={Link}
      passkey
      deleteUser={{
        verification: true,
      }}
    >
      {children}
    </AuthUIProvider>
  );
}
