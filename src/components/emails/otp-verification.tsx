import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";

type OTPType = "sign-in" | "email-verification" | "forget-password" | "two-factor" | "change-email";

interface OTPVerificationProps {
  username: string;
  otp: string;
  type: OTPType;
}

const getTitle = (type: OTPType) => {
  switch (type) {
    case "sign-in":
      return "Your Sign-In Code";
    case "email-verification":
      return "Verify Your Email Address";
    case "forget-password":
      return "Password Reset Code";
    case "two-factor":
      return "Two-Factor Authentication Code";
    case "change-email":
      return "Email Change Verification Code";
    default:
      return "Verification Code";
  }
};

const getMessage = (type: OTPType, username: string) => {
  switch (type) {
    case "sign-in":
      return `Hi there, ${username}. Use the code below to sign in to your account.`;
    case "email-verification":
      return `Hi there, ${username}. Thanks for signing up! Use the code below to verify your email address.`;
    case "forget-password":
      return `Hi there, ${username}. Someone requested a password reset. Use the code below to reset your password.`;
    case "two-factor":
      return `Hi there, ${username}. Use the code below to complete your sign-in.`;
    case "change-email":
      return `Hi there, ${username}. Use the code below to confirm your new email address.`;
    default:
      return `Hi there, ${username}. Use the code below to complete your action.`;
  }
};

const getIgnoreText = (type: OTPType) => {
  switch (type) {
    case "sign-in":
      return "If you didn't request this code, you can safely ignore this email.";
    case "email-verification":
      return "If you didn't create an account, you can safely ignore this email.";
    case "forget-password":
      return "If you didn't request a password reset, you can safely ignore this email.";
    case "two-factor":
      return "If you didn't request this code, you can safely ignore this email.";
    case "change-email":
      return "If you didn't request this email change, you can safely ignore this email.";
    default:
      return "If you didn't request this code, you can safely ignore this email.";
  }
};

const OTPVerificationEmail = (props: OTPVerificationProps) => {
  const { username, otp, type } = props;
  const title = getTitle(type);
  const message = getMessage(type, username);
  const ignoreText = getIgnoreText(type);

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white rounded-[8px] p-8 max-w-150 mx-auto">
            {/* Header */}
            <Section className="text-center mb-8">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-4">
                {title}
              </Heading>
              <Text className="text-[16px] text-gray-600 m-0">
                Your verification code is below
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-8">
              <Text className="text-[16px] text-gray-700 mb-4 m-0">
                {message}
              </Text>

              {/* OTP Code Display */}
              <Section className="text-center my-8 p-6 bg-gray-50 rounded-[6px]">
                <Text className="text-[14px] text-gray-600 mb-2 m-0 font-medium">
                  Verification Code
                </Text>
                <Text className="text-[36px] font-bold text-gray-900 tracking-[0.3em] m-0">
                  {otp}
                </Text>
              </Section>

              <Text className="text-[14px] text-gray-500 mb-4 m-0">
                ⏱️ This code will expire in <strong>1 minute</strong> for security reasons.
              </Text>

              <Text className="text-[14px] text-gray-500 m-0">
                {ignoreText}
              </Text>
            </Section>

            <Hr className="border-gray-200 my-6" />

            {/* Footer */}
            <Section>
              <Text className="text-[12px] text-gray-400 text-center m-0 mb-2">
                © 2026 OneClick Credentials. All rights reserved.
              </Text>
              <Text className="text-[12px] text-gray-400 text-center m-0 mb-2">
                123 Business Street, Quezon City, Philippines
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OTPVerificationEmail;
