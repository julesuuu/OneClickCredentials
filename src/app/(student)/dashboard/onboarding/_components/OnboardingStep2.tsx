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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const OnboardingStep2 = () => {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Student Information</CardTitle>
        <CardDescription>Tell us more about your profile</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lrn">Learner's Reference Number</FieldLabel>
              <Input id="lrn" type="number" />
              <FieldDescription>Must be a 12-digit number.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="studentNumber">Student Number</FieldLabel>
              <Input id="studentNumber" />
              <FieldDescription>
                Leave empty if not applicable.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="yearLevel">Year Level</FieldLabel>
              <Select>
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

            <Field>
              <FieldLabel htmlFor="course">Course</FieldLabel>
              <Select>
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
            <Field>
              <FieldLabel htmlFor="proofOfEnrollmentUrl">
                Proof of Enrollment
              </FieldLabel>
              <Input
                id="proofOfEnrollmentUrl"
                type="file"
                accept="image/*,.pdf"
              />
              <FieldDescription>
                Acceptable documents include:
                <span className="block">• Valid Student ID</span>
                <span className="block">• Current Enrollment Form</span>
                <span className="block">
                  • Certificate of Registration (COR)
                </span>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>

      <CardFooter className="flex gap-4 mt-4 justify-center">
        <Button type="reset" variant={"outline"}>
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </CardFooter>
    </Card>
  );
};
