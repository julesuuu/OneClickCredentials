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

export interface DocumentRequestStatusEmailProps {
  studentName: string;
  documentName: string;
  quantity: number;
  status: string;
  declineReason?: string | null;
  actionUrl: string;
}

interface StatusCopy {
  preview: string;
  heading: string;
  badgeText: string;
  badgeClassName: string;
  body: string;
  ctaLabel: string;
}

function getStatusCopy(
  status: string,
  documentName: string,
  quantity: number,
): StatusCopy {
  const itemLabel =
    quantity > 1 ? `${quantity} copies of ${documentName}` : documentName;

  switch (status) {
    case "Processing":
      return {
        preview: `Your request for ${documentName} is now being processed`,
        heading: "Request Being Processed",
        badgeText: "Processing",
        badgeClassName: "bg-blue-50 text-blue-700 border border-blue-200",
        body: `Your request for ${itemLabel} is now being processed by the registrar's office. We will send you another update as soon as it is ready.`,
        ctaLabel: "View Request Status",
      };
    case "Ready":
      return {
        preview: `Your ${documentName} request is ready for pickup`,
        heading: "Ready for Pickup",
        badgeText: "Ready for Pickup",
        badgeClassName: "bg-green-50 text-green-700 border border-green-200",
        body: `Great news! Your request for ${itemLabel} is now ready for pickup. Please schedule an appointment to claim your document.`,
        ctaLabel: "Book Pickup Appointment",
      };
    case "Completed":
      return {
        preview: `Your ${documentName} request has been completed`,
        heading: "Request Completed",
        badgeText: "Completed",
        badgeClassName: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        body: `Your request for ${itemLabel} has been marked as completed. Thank you for using OneClickCredentials.`,
        ctaLabel: "View My Requests",
      };
    case "Rejected":
      return {
        preview: `Update on your ${documentName} request`,
        heading: "Request Rejected",
        badgeText: "Rejected",
        badgeClassName: "bg-red-50 text-red-700 border border-red-200",
        body: `Unfortunately, your request for ${itemLabel} could not be approved.`,
        ctaLabel: "View My Requests",
      };
    default:
      return {
        preview: `Your ${documentName} request status was updated to ${status}`,
        heading: "Request Status Updated",
        badgeText: status,
        badgeClassName: "bg-gray-100 text-gray-700 border border-gray-200",
        body: `The status of your request for ${itemLabel} has been updated to ${status}.`,
        ctaLabel: "View My Requests",
      };
  }
}

const DocumentRequestStatusEmail = ({
  studentName,
  documentName,
  quantity,
  status,
  declineReason,
  actionUrl,
}: DocumentRequestStatusEmailProps) => {
  const copy = getStatusCopy(status, documentName, quantity);

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{copy.preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white mx-auto px-8 py-8 rounded-[8px] shadow-sm max-w-[600px]">
            <Section className="text-center mb-6">
              <Text
                className={`inline-block px-3 py-1 rounded-full text-[12px] font-semibold m-0 mb-3 ${copy.badgeClassName}`}
              >
                {copy.badgeText}
              </Text>
              <Heading className="text-[24px] font-bold text-gray-900 m-0">
                {copy.heading}
              </Heading>
            </Section>

            <Section className="mb-6">
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-4">
                Hi {studentName},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-6 m-0 mb-6">
                {copy.body}
              </Text>

              <Section className="bg-gray-50 rounded-[6px] px-5 py-4 mb-6 border border-gray-200">
                <Text className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide m-0 mb-2">
                  Request Summary
                </Text>
                <Text className="text-[14px] text-gray-800 m-0 mb-1">
                  <strong>Document:</strong> {documentName}
                </Text>
                <Text className="text-[14px] text-gray-800 m-0 mb-1">
                  <strong>Quantity:</strong> {quantity}
                </Text>
                <Text className="text-[14px] text-gray-800 m-0">
                  <strong>Status:</strong> {status}
                </Text>
              </Section>

              {status === "Rejected" && declineReason ? (
                <Section className="bg-red-50 rounded-[6px] px-5 py-4 mb-6 border border-red-200">
                  <Text className="text-[13px] font-semibold text-red-700 m-0 mb-1">
                    Rejection Reason
                  </Text>
                  <Text className="text-[14px] text-red-700 m-0">
                    {declineReason}
                  </Text>
                </Section>
              ) : null}
            </Section>

            <Section className="text-center mb-6">
              <Button
                href={actionUrl}
                className="bg-blue-600 text-white px-8 py-3 rounded-[6px] text-[15px] font-semibold no-underline inline-block"
              >
                {copy.ctaLabel}
              </Button>
            </Section>

            <Hr className="border-gray-200 my-6" />

            <Section>
              <Text className="text-[12px] text-gray-400 text-center m-0 mb-1">
                You are receiving this email because you submitted a document
                request on OneClickCredentials.
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

export default DocumentRequestStatusEmail;
