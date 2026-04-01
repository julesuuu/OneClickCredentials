import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  twoFactorClient,
  emailOTPClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,
  plugins: [
    twoFactorClient(),
    adminClient(),
    emailOTPClient(),
    passkeyClient(),
  ],
});
