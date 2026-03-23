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
      try {
        await resend.emails.send({
          from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
          to: user.email,
          subject: "Verify your email",
          react: VerifyEmail({ username: user.name, verifyUrl: url }),
        });
        console.log(`Verification email sent to ${user.email}`);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw error;
      }
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
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
        try {
          await resend.emails.send({
            from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
            to: user.email,
            subject: "Your 2FA Code",
            html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
          });
          console.log(`2FA OTP sent to ${user.email}`);
        } catch (error) {
          console.error("Failed to send 2FA OTP:", error);
          throw error;
        }
      },
    }),
  ],
});
