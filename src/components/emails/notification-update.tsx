import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export type NotificationTone = "info" | "success" | "danger";

export interface NotificationEmailDetail {
  label: string;
  value: string;
}

export interface NotificationUpdateEmailProps {
  studentName: string;
  title: string;
  message: string;
  tone?: NotificationTone;
  badgeText?: string;
  details?: NotificationEmailDetail[];
  reason?: string | null;
  actionLabel?: string;
  actionUrl: string;
}

const toneClasses: Record<NotificationTone, string> = {
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  success: "bg-green-50 text-green-700 border border-green-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
};

const NotificationUpdateEmail = ({
  studentName,
  title,
  message,
  tone = "info",
  badgeText,
  details,
  reason,
  actionLabel = "Open Dashboard",
  actionUrl,
}: NotificationUpdateEmailProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white mx-auto px-8 py-8 rounded-[8px] shadow-sm max-w-[600px]">
            <Section className="text-center mb-6">
              {badgeText ? (
                <Text
                  className={`inline-block px-3 py-1 rounded-full text-[12px] font-semibold m-0 mb-3 ${toneClasses[tone]}`}
                >
                  {badgeText}
                </Text>
              ) : null}
              <Heading className="text-[24px] font-bold text-gray-900 m-0">
                {title}
              </Heading>
            </Section>

            <Section className="mb-6">
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-4">
                Hi {studentName},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-6">
                {message}
              </Text>

              {details && details.length > 0 ? (
                <Section className="bg-gray-50 rounded-[6px] px-5 py-4 mb-6 border border-gray-200">
                  {details.map((detail, index) => (
                    <Text
                      key={detail.label}
                      className={`text-[14px] text-gray-800 m-0 ${
                        index < details.length - 1 ? "mb-1" : ""
                      }`}
                    >
                      <strong>{detail.label}:</strong> {detail.value}
                    </Text>
                  ))}
                </Section>
              ) : null}

              {reason ? (
                <Section className="bg-red-50 rounded-[6px] px-5 py-4 mb-6 border border-red-200">
                  <Text className="text-[13px] font-semibold text-red-700 m-0 mb-1">
                    Reason
                  </Text>
                  <Text className="text-[14px] text-red-700 m-0">{reason}</Text>
                </Section>
              ) : null}
            </Section>

            <Section className="text-center mb-6">
              <Button
                href={actionUrl}
                className="bg-blue-600 text-white px-8 py-3 rounded-[6px] text-[15px] font-semibold no-underline inline-block"
              >
                {actionLabel}
              </Button>
            </Section>

            <Hr className="border-gray-200 my-6" />

            <Section>
              <Text className="text-[12px] text-gray-400 text-center m-0 mb-1">
                This is an automated notification from OneClickCredentials.
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

export default NotificationUpdateEmail;
