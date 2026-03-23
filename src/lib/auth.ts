import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP, twoFactor } from "better-auth/plugins";
import { getDatabase } from "./mongodb";
import { Resend } from "resend";
import ForgotPasswordEmail from "@/components/emails/password-reset";

const db = await getDatabase();

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const auth = betterAuth({
  database: mongodbAdapter(db),
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
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      otpLength: 6,
      expiresIn: 60,
      async sendVerificationOTP({ email, otp, type }) {
        try {
          const subject =
            type === "sign-in"
              ? "Your Sign-In Code"
              : type === "email-verification"
                ? "Verify Your Email Address"
                : "Password Reset Code";

          await resend.emails.send({
            from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
            to: email,
            subject,
            html: `
              <p>Your verification code is:</p>
              <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
              <p>This code will expire in one minute.</p>
              ${type === "sign-in" ? "<p>If you didn't request this code, please ignore this email.</p>" : ""}
            `,
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
              html: `
              <p >Your verification code is:</p>
              <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
              <p>This code will expire in one minute.</p>
              `,
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
