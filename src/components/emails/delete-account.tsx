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

interface DeleteAccountEmailProps {
  userEmail: string;
  username: string;
  deleteUrl: string;
}

const DeleteAccountEmail = (props: DeleteAccountEmailProps) => {
  const { username, userEmail, deleteUrl } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white mx-auto px-10 py-10 rounded-[8px] shadow-sm max-w-150">
            {/* Title */}
            <Section className="text-center mb-8">
              <Text className="text-[32px] font-bold text-red-600 m-0 mb-2">
                Delete Account
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-8">
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-4 text-center">
                Hi {username},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-4 text-center">
                We received a request to permanently delete your account
                associated with <strong>{userEmail}</strong>.
              </Text>
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-4 text-center">
                If you didn&apos;t request this, you can safely ignore this
                email.
              </Text>
            </Section>

            {/* Delete Button */}
            <Section className="text-center mb-8">
              <Button
                href={deleteUrl}
                className="bg-red-600 text-white px-10 py-3 rounded-[6px] text-[16px] font-semibold no-underline box-border hover:bg-red-700 inline-block"
              >
                Delete Account
              </Button>
            </Section>

            {/* Warning Notice */}
            <Section className="bg-red-50 px-6 py-5 rounded-[6px] mb-8">
              <Text className="text-[14px] text-red-700 leading-5 m-0 text-center">
                This link will expire in 24 hours for your security.
              </Text>
            </Section>

            <Hr className="border-gray-200 my-6" />

            {/* Footer */}
            <Section>
              <Text className="text-[12px] text-gray-500 leading-4 m-0 mb-2 text-center">
                Having trouble? Copy and paste this URL into your browser:
              </Text>
              <Text className="text-[12px] text-blue-600 break-all m-0 mb-4 text-center">
                {deleteUrl}
              </Text>
              <Text className="text-[12px] text-gray-400 text-center m-0">
                © 2026 OneClickCredentials. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DeleteAccountEmail;
