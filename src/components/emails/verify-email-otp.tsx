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
} from "@react-email/components";

interface VerifyEmailOTPProps {
  username: string;
  otp: string;
}

const VerifyEmailOTP = (props: VerifyEmailOTPProps) => {
  const { username, otp } = props;
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your email verification code for OneClickCredentials
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
                Use the code below to complete your registration
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-8">
              <Text className="text-[16px] text-gray-700 mb-4 m-0">
                Hi there {username},
              </Text>
              <Text className="text-[16px] text-gray-700 mb-6 m-0">
                Thanks for signing up! To complete your registration and start
                using your account, please enter the following verification code.
              </Text>

              {/* OTP Code Display */}
              <Section className="text-center mb-6">
                <Text className="text-[14px] text-gray-600 mb-2 m-0">
                  Your verification code:
                </Text>
                <Text className="text-[32px] font-bold text-gray-900 tracking-[0.2em] m-0">
                  {otp}
                </Text>
              </Section>

              <Text className="text-[14px] text-gray-500 mb-4 m-0">
                This code will expire in 10 minutes for security reasons.
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

export default VerifyEmailOTP;
