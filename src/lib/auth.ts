import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP, twoFactor } from "better-auth/plugins";
import { Resend } from "resend";
import ForgotPasswordEmail from "@/components/emails/password-reset";
import OTPVerificationEmail from "@/components/emails/otp-verification";
import DeleteAccountEmail from "@/components/emails/delete-account";
import { passkey } from "@better-auth/passkey";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
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
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/reset-password/email": { window: 60, max: 3 },
      "/otp/send-verification-otp": { window: 60, max: 3 },
      "/two-factor/send-otp": { window: 60, max: 3 },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        await resend.emails.send({
          from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
          to: user.email,
          subject: "Reset your password",
          react: ForgotPasswordEmail({
            username: user.name,
            userEmail: user.email,
            resetUrl: url,
          }),
        });
        console.log(`Password reset email sent to ${user.email}`);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        throw error;
      }
    },
    requireEmailVerification: true,
  },
  user: {
    deleteUser: {
      enabled: true,
      async sendDeleteAccountVerification({ user, url }) {
        try {
          await resend.emails.send({
            from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
            to: user.email,
            subject: "Confirm Account Deletion",
            react: DeleteAccountEmail({
              userEmail: user.email,
              username: user.name || user.email.split("@")[0],
              deleteUrl: url,
            }),
          });
          console.log(`Account deletion verification sent to ${user.email}`);
        } catch (error) {
          console.error("Failed to send deletion verification email:", error);
          throw error;
        }
      },
    },
  },
  session: {
    expiresIn: 3600,
    updateAge: 900,
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://oneclickapp.online",
    "https://one-click-credentials.vercel.app",
  ],
  hooks: {},
  plugins: [
    passkey({
      rpID:
        process.env.NODE_ENV === "production"
          ? "oneclickapp.online"
          : "localhost",
      rpName: "OneClickCredentials",
      origin: process.env.NEXT_PUBLIC_BASE_URL,
    }),
    nextCookies(),
    admin(),
    emailOTP({
      storeOTP: "hashed",
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      otpLength: 6,
      async sendVerificationOTP({ email, otp, type }) {
        try {
          await resend.emails.send({
            from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
            to: email,
            subject:
              type === "sign-in"
                ? "Your Sign-In Code"
                : type === "email-verification"
                  ? "Verify Your Email Address"
                  : "Password Reset Code",
            react: OTPVerificationEmail({
              username: email.split("@")[0],
              otp,
              type,
            }),
          });
          console.log(`OTP ${type} email sent to ${email}`);
        } catch (error) {
          console.error(`Failed to send OTP ${type} email:`, error);
          throw error;
        }
      },
    }),
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }) {
          try {
            await resend.emails.send({
              from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
              to: user.email,
              subject: "Your 2FA Code",
              react: OTPVerificationEmail({
                username: user.name || user.email.split("@")[0],
                otp,
                type: "two-factor",
              }),
            });
            console.log(`2FA OTP sent to ${user.email}`);
          } catch (error) {
            console.error("Failed to send 2FA OTP:", error);
            throw error;
          }
        },
      },
    }),
  ],
});
