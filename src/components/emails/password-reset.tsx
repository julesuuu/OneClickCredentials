import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Tailwind,
} from "@react-email/components";

interface ForgotPasswordEmailProps {
  userEmail: string;
  username: string;
  resetUrl: string;
}

const ForgotPasswordEmail = (props: ForgotPasswordEmailProps) => {
  const { username, userEmail, resetUrl } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white mx-auto px-10 py-10 rounded-[8px] shadow-sm max-w-150">
            {/* Header */}
            <Section className="text-center mb-8">
              <Text className="text-[28px] font-bold text-gray-900 m-0 mb-2">
                Reset Your Password
              </Text>
              <Text className="text-[16px] text-gray-600 m-0">
                We received a request to reset your password
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-8">
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-4">
                Hi there, {username}
              </Text>
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-4">
                Someone requested a password reset for your account associated
                with <strong>{userEmail}</strong>. If this was you, click the
                button below to reset your password.
              </Text>
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-4">
                If you didn't request this, you can safely ignore this email.
                Your password will remain unchanged.
              </Text>
            </Section>

            {/* Reset Button */}
            <Section className="text-center mb-8">
              <Button
                href={resetUrl}
                className="bg-blue-600 text-white px-8 py-3 rounded-[6px] text-[16px] font-semibold no-underline box-border hover:bg-blue-700"
              >
                Reset Password
              </Button>
            </Section>

            {/* Security Notice */}
            <Section className="bg-gray-50 px-6 py-5 rounded-[6px] mb-8">
              <Text className="text-[14px] text-gray-600 m-0 mb-2 font-semibold">
                🔒 Security Notice
              </Text>
              <Text className="text-[14px] text-gray-600 leading-5 m-0">
                This password reset link will expire in 24 hours for your
                security. If you need to reset your password after that, please
                request a new reset link.
              </Text>
            </Section>

            <Hr className="border-gray-200 my-6" />

            {/* Footer */}
            <Section>
              <Text className="text-[12px] text-gray-500 leading-4 m-0 mb-2">
                If you're having trouble clicking the button, copy and paste the
                URL below into your web browser:
              </Text>
              <Text className="text-[12px] text-blue-600 break-all m-0 mb-4">
                {resetUrl}
              </Text>
              <Text className="text-[12px] text-gray-500 leading-4 m-0 mb-2">
                Best regards,
                <br />
                The Security Team
              </Text>
              <Text className="text-[12px] text-gray-400 m-0">
                123 Security Street, Safe City, SC 12345
                <br />
                <a href="#" className="text-gray-400 underline">
                  Unsubscribe
                </a>{" "}
                |
                <a href="#" className="text-gray-400 underline ml-1">
                  Privacy Policy
                </a>
              </Text>
              <Text className="text-[12px] text-gray-400 m-0 mt-2">
                © 2026 Your Company Name. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ForgotPasswordEmail;
