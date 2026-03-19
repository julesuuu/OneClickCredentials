import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface VerifyEmailProps {
  username: string;
  verifyUrl: string;
}

const VerifyEmail = (props: VerifyEmailProps) => {
  const { username, verifyUrl } = props;
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Please verify your email address to complete your registration
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white rounded-[8px] p-8 max-w-150 mx-auto">
            {/* Header */}
            <Section className="text-center mb-8">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-4">
                Verify Your Email Address
              </Heading>
              <Text className="text-[16px] text-gray-600 m-0">
                Welcome! Please confirm your email address to get started.
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-8">
              <Text className="text-[16px] text-gray-700 mb-4 m-0">
                Hi there {username},
              </Text>
              <Text className="text-[16px] text-gray-700 mb-6 m-0">
                Thanks for signing up! To complete your registration and start
                using your account, please verify your email address by clicking
                the button below.
              </Text>

              {/* Verification Button */}
              <Section className="text-center mb-6">
                <Button
                  href={verifyUrl}
                  className="bg-blue-600 text-white px-8 py-3 rounded-[6px] text-[16px] font-medium no-underline box-border inline-block"
                >
                  Verify Email Address
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-500 mb-4 m-0">
                If the button doesn't work, you can copy and paste this link
                into your browser:
                <br />
                {verifyUrl}
              </Text>

              <Text className="text-[14px] text-gray-500 mb-4 m-0">
                This verification link will expire in 24 hours for security
                reasons.
              </Text>

              <Text className="text-[14px] text-gray-500 m-0">
                If you didn't create an account, you can safely ignore this
                email.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-t border-solid border-gray-200 pt-6 mt-8">
              <Text className="text-[12px] text-gray-400 text-center m-0 mb-2">
                © 2026 OneClick. All rights reserved.
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

export default VerifyEmail;
