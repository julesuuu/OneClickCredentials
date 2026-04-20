"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { OnboardingStep1 } from "./_components/OnboardingStep1";
import { OnboardingStep2 } from "./_components/OnboardingStep2";
import { OnboardingStep3 } from "./_components/OnboardingStep3";
import { Check, User, GraduationCap, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Personal", icon: User },
  { id: 2, title: "Academic", icon: GraduationCap },
  { id: 3, title: "Review", icon: ClipboardCheck },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = React.useState(1);

  const form = useForm({
    defaultValues: {
      fullName: "",
      gender: "MALE" as const,
      birthDate: new Date(),
      phoneNumber: "",
      lrn: "",
      studentNumber: "",
      course: "BSIT" as const,
      yearLevel: "FIRST_YEAR" as const,
      proofOfEnrollmentUrl: "" as any,
    },
    onSubmit: async ({ value }) => {
      console.log(value);
      alert("Onboarding complete! Your profile has been submitted for review.");
    },
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <div className="w-full max-w-2xl space-y-12 mt-8">
        {/* Onboarding Header / Steps */}
        <div className="relative px-4">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-muted z-0" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 ease-in-out z-0"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />

          <div className="relative flex justify-between w-full">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <div key={step.id} className="flex flex-col items-center group">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 bg-background z-10",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary ring-4 ring-primary/20"
                          : "border-muted text-muted-foreground group-hover:border-muted-foreground",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                    ) : (
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-3 text-xs font-medium transition-colors duration-300",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          {currentStep === 1 && (
            <OnboardingStep1 form={form} onNext={nextStep} />
          )}
          {currentStep === 2 && (
            <OnboardingStep2 form={form} onNext={nextStep} onBack={prevStep} />
          )}
          {currentStep === 3 && (
            <OnboardingStep3 form={form} onBack={prevStep} />
          )}
        </div>
      </div>
    </div>
  );
}
