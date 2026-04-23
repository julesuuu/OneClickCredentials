/* eslint-disable @typescript-eslint/no-explicit-any, react/no-children-prop */
"use client";

import { course, yearLevel } from "../data";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadWithUrl } from "@/components/upload/upload-with-url";
import { step2Schema } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface OnboardingStep2Props {
  form: any;
  onNext: () => void;
  onBack: () => void;
}

export const OnboardingStep2 = ({
  form,
  onNext,
  onBack,
}: OnboardingStep2Props) => {
  const handleNext = async () => {
    const values = form.state.values;
    const result = step2Schema.safeParse({
      lrn: values.lrn,
      studentNumber: values.studentNumber,
      course: values.course,
      yearLevel: values.yearLevel,
      proofOfEnrollmentUrl: values.proofOfEnrollmentUrl,
    });

    if (result.success) {
      onNext();
    } else {
      form.validateAllFields("submit");
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Student Information</CardTitle>
        <CardDescription>Tell us more about your profile</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <form.Field
              name="lrn"
              validators={{
                onChange: ({ value }: { value: string }) => {
                  const res = step2Schema.shape.lrn.safeParse(value);
                  return res.success ? undefined : res.error.issues[0].message;
                },
              }}
              // eslint-disable-next-line react/no-children-prop
              children={(field: any) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Learner's Reference Number
                  </FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>
                    {field.state.meta.errors ? (
                      <span className="text-destructive">
                        {field.state.meta.errors}
                      </span>
                    ) : (
                      "Must be a 12-digit number."
                    )}
                  </FieldDescription>
                </Field>
              )}
            />

            <form.Field
              name="studentNumber"
              children={(field: any) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Student Number</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>
                    Leave empty if not applicable.
                  </FieldDescription>
                </Field>
              )}
            />

            <form.Field
              name="yearLevel"
              children={(field: any) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Year Level</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Year Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Year Level</SelectLabel>
                        {yearLevel.map((y) => (
                          <SelectItem key={y.value} value={y.value}>
                            {y.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <form.Field
              name="course"
              children={(field: any) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Course</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Course</SelectLabel>
                        {course.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <form.Field
              name="proofOfEnrollmentUrl"
              validators={{
                onChange: ({ value }: { value: any }) => {
                  if (!value) return "Please upload your proof of enrollment";
                  return undefined;
                },
              }}
              children={(field: any) => (
                <Field>
                  <UploadWithUrl
                    endpoint="proofOfEnrollment"
                    field={field}
                    label="Proof of Enrollment"
                    description={
                      <>
                        Acceptable documents include:
                        <span className="block">• Valid Student ID</span>
                        <span className="block">• Current Enrollment Form</span>
                        <span className="block">
                          • Certificate of Registration (COR)
                        </span>
                      </>
                    }
                  />
                  <FieldDescription>
                    {field.state.meta.errors ? (
                      <span className="text-destructive">
                        {field.state.meta.errors}
                      </span>
                    ) : null}
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>
      </CardContent>

      <CardFooter className="flex gap-4 mt-4 justify-center">
        <Button variant={"outline"} onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </CardFooter>
    </Card>
  );
};
