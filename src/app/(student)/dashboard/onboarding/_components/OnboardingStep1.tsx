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

export const OnboardingStep1 = () => {
  const [open, setOpen] = React.useState(false);
  const [birthDate, setBirthDate] = React.useState<Date | undefined>(undefined);
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Tell us about yourself</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Name</FieldLabel>
              <Input id="fullName" placeholder="John Doe" />
              <FieldDescription>Enter your full name</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
              <Input
                id="phoneNumber"
                type="number"
                placeholder="09XX XXX XXXX"
              />
            </Field>
            <div className="flex gap-4 mt-4 w-full">
              <Field className="flex-1">
                <FieldLabel htmlFor="birthDate">Date of Birth</FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="birthDate"
                      className="justify-start font-normal w-full"
                    >
                      {birthDate
                        ? birthDate.toLocaleDateString()
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={birthDate}
                      defaultMonth={birthDate}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setBirthDate(date);
                        setOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="gender">Gender</FieldLabel>
                <Select>
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
            </div>
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
