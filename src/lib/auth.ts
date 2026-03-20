import VerifyEmail from "@/components/emails/verify-email";
import ForgotPasswordEmail from "@/components/emails/password-reset";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin, twoFactor } from "better-auth/plugins";
import { getDatabase } from "./mongodb";
import { Resend } from "resend";

const db = await getDatabase();

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      resend.emails.send({
        from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: "Verify your email",
        react: VerifyEmail({ username: user.name, verifyUrl: url }),
      });
    },
    sendOnSignup: true,
    autoSignInAfterVerification: true,
    async afterEmailVerification(user) {
      console.log(`${user.email} has been successfully verified!`);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      resend.emails.send({
        from: `${process.env.EMAIL_DEFAULT_SENDER}`,
        to: user.email,
        subject: "Reset your password",
        react: ForgotPasswordEmail({
          username: user.name,
          userEmail: user.email,
          resetUrl: url,
        }),
      });
    },
    requireEmailVerification: true,
  },
  plugins: [
    nextCookies(),
    admin(),
    twoFactor({
      issuer: "OneClickCredentials",
      sendOTP: async ({
        user,
        otp,
      }: {
        user: { email: string };
        otp: string;
      }) => {
        await resend.emails.send({
          from: "OneClickCredentials <onboarding@resend.dev>",
          to: user.email,
          subject: "Your 2FA Code",
          html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
        });
      },
    }),
  ],
});
