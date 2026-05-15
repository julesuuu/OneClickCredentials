"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEnumValue } from "@/lib/utils";

interface OnboardingStep3Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onBack: () => void;
}

export const OnboardingStep3 = ({ form, onBack }: OnboardingStep3Props) => {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Review &amp; Submit</CardTitle>
        <CardDescription>
          Please review your information before submitting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form.Subscribe
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          selector={(state: any) => state.values}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(values: any) => (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="font-semibold">Full Name:</div>
              <div>{values.fullName}</div>

              <div className="font-semibold">Gender:</div>
              <div>{formatEnumValue(values.gender)}</div>

              <div className="font-semibold">Birth Date:</div>
              <div>{values.birthDate?.toLocaleDateString()}</div>

              <div className="font-semibold">Phone Number:</div>
              <div>{values.phoneNumber}</div>

              <div className="col-span-2 border-t pt-4"></div>

              <div className="font-semibold">LRN:</div>
              <div>{values.lrn}</div>

              <div className="font-semibold">Student Number:</div>
              <div>{values.studentNumber || "N/A"}</div>

              <div className="font-semibold">Course:</div>
              <div>{values.course}</div>

              <div className="font-semibold">Year Level:</div>
              <div>{formatEnumValue(values.yearLevel)}</div>

              <div className="font-semibold">Proof of Enrollment:</div>
              <div>
                {values.proofOfEnrollmentUrl instanceof File
                  ? values.proofOfEnrollmentUrl.name
                  : "Uploaded"}
              </div>
            </div>
          )}
        </form.Subscribe>
      </CardContent>

      <CardFooter className="flex gap-4 mt-4 justify-center">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => {
            form.handleSubmit();
          }}
        >
          Confirm &amp; Submit
        </Button>
      </CardFooter>
    </Card>
  );
};
