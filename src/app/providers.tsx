"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
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
        deleteUser={{
          verification: true,
        }}
      >
        {children}
      </AuthUIProvider>
    </QueryClientProvider>
  );
}
