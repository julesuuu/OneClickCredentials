"use client";

import * as React from "react";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { gender } from "../data";
import { step1Schema } from "../types";

interface OnboardingStep1Props {
  form: any;
  onNext: () => void;
}

export const OnboardingStep1 = ({ form, onNext }: OnboardingStep1Props) => {
  const [open, setOpen] = React.useState(false);

  const handleNext = async () => {
    // Validate fields for Step 1
    const values = form.state.values;
    const result = step1Schema.safeParse({
      fullName: values.fullName,
      gender: values.gender,
      birthDate: values.birthDate,
      phoneNumber: values.phoneNumber,
    });

    if (result.success) {
      onNext();
    } else {
      // Trigger field level validation to show errors
      form.validateAllFields("submit");
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Tell us about yourself</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <form.Field
              name="fullName"
              validators={{
                onChange: ({ value }: { value: string }) => {
                  const res = step1Schema.shape.fullName.safeParse(value);
                  return res.success ? undefined : res.error.issues[0].message;
                },
              }}
              children={(field: any) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="John Doe"
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
                      "Enter your full name"
                    )}
                  </FieldDescription>
                </Field>
              )}
            />

            <form.Field
              name="phoneNumber"
              validators={{
                onChange: ({ value }: { value: string }) => {
                  const res = step1Schema.shape.phoneNumber.safeParse(value);
                  return res.success ? undefined : res.error.issues[0].message;
                },
              }}
              children={(field: any) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="09XX XXX XXXX"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors && (
                    <span className="text-xs text-destructive">
                      {field.state.meta.errors}
                    </span>
                  )}
                </Field>
              )}
            />

            <div className="flex gap-4 mt-4 w-full">
              <form.Field
                name="birthDate"
                children={(field: any) => (
                  <Field className="flex-1">
                    <FieldLabel htmlFor={field.name}>Date of Birth</FieldLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id={field.name}
                          className="justify-start font-normal w-full"
                        >
                          {field.state.value
                            ? field.state.value.toLocaleDateString()
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.state.value}
                          defaultMonth={field.state.value}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            field.handleChange(date);
                            setOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                )}
              />

              <form.Field
                name="gender"
                children={(field: any) => (
                  <Field className="flex-1">
                    <FieldLabel htmlFor={field.name}>Gender</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Gender</SelectLabel>
                          {gender.map((g) => (
                            <SelectItem key={g.name} value={g.value}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </FieldSet>
      </CardContent>

      <CardFooter className="flex gap-4 mt-4 justify-center">
        <Button
          type="reset"
          variant={"outline"}
          onClick={() => form.reset()}
        >
          Reset
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </CardFooter>
    </Card>
  );
};
