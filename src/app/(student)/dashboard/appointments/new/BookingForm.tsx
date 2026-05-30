"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createAppointment } from "../actions";

interface EligibleRequest {
  id: string;
  createdAt: Date;
  documentType: { name: string };
}

type Step = "request" | "datetime" | "confirm";

const STEPS = [
  { key: "request" as Step, label: "Request" },
  { key: "datetime" as Step, label: "Date & Time" },
  { key: "confirm" as Step, label: "Confirm" },
];

const STEP_ORDER: Record<Step, number> = { request: 0, datetime: 1, confirm: 2 };

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIdx = STEP_ORDER[currentStep];

  return (
    <div className="flex items-center gap-2 mb-8 text-sm">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs",
                currentIdx === i && "bg-primary text-primary-foreground",
                currentIdx > i && "bg-primary/20 text-primary",
                currentIdx < i && "bg-muted text-muted-foreground"
              )}
            >
              {currentIdx > i ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "hidden sm:inline",
                currentIdx === i && "text-foreground font-medium",
                currentIdx > i && "text-primary",
                currentIdx < i && "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-px flex-1",
                currentIdx > i ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function BookingFormInner({ eligibleRequests }: { eligibleRequests: EligibleRequest[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselectedId = searchParams.get("requestId");
  const hasValidPreselect =
    preselectedId && eligibleRequests.some((r) => r.id === preselectedId);

  const [step, setStep] = useState<Step>(
    hasValidPreselect ? "datetime" : "request"
  );
  const [selectedRequestId, setSelectedRequestId] = useState(
    hasValidPreselect ? preselectedId! : ""
  );
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  const selectedRequest = eligibleRequests.find(
    (r) => r.id === selectedRequestId
  );

  const handleContinue = useCallback(() => {
    if (step === "request" && selectedRequestId) {
      setStep("datetime");
    } else if (step === "datetime" && date && timeSlot) {
      setStep("confirm");
    }
  }, [step, selectedRequestId, date, timeSlot]);

  const handleBack = useCallback(() => {
    if (step === "datetime") setStep("request");
    else if (step === "confirm") setStep("datetime");
  }, [step]);

  const handleConfirm = useCallback(async () => {
    if (!selectedRequestId || !date || !timeSlot) return;
    setSubmitting(true);
    try {
      await createAppointment(selectedRequestId, date.toISOString(), timeSlot);
      toast.success("Appointment booked successfully!");
      router.push("/dashboard/appointments");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to book appointment"
      );
    } finally {
      setSubmitting(false);
    }
  }, [selectedRequestId, date, timeSlot, router]);

  if (eligibleRequests.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>No Eligible Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You don&apos;t have any requests that are ready for booking.
              Submit a document request first.
            </p>
            <Button asChild>
              <Link href="/dashboard/requests">Create a Request</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

      {step === "request" && (
        <Card>
          <CardHeader>
            <CardTitle>Select a Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={selectedRequestId}
              onValueChange={setSelectedRequestId}
            >
              {eligibleRequests.map((request) => (
                <div
                  key={request.id}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                    selectedRequestId === request.id &&
                      "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <RadioGroupItem
                    value={request.id}
                    id={request.id}
                  />
                  <Label
                    htmlFor={request.id}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <span className="font-medium">
                      {request.documentType.name}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      Requested{" "}
                      {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleContinue}
                disabled={!selectedRequestId}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "datetime" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < today || d > maxDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time Slot</Label>
              <RadioGroup value={timeSlot} onValueChange={setTimeSlot}>
                <div
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                    timeSlot === "AM" && "border-primary bg-primary/5"
                  )}
                  onClick={() => setTimeSlot("AM")}
                >
                  <RadioGroupItem value="AM" id="AM" />
                  <Label
                    htmlFor="AM"
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <span className="font-medium">AM Session</span>
                    <span className="text-muted-foreground ml-2">
                      (8:00 - 12:00)
                    </span>
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                    timeSlot === "PM" && "border-primary bg-primary/5"
                  )}
                  onClick={() => setTimeSlot("PM")}
                >
                  <RadioGroupItem value="PM" id="PM" />
                  <Label
                    htmlFor="PM"
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <span className="font-medium">PM Session</span>
                    <span className="text-muted-foreground ml-2">
                      (1:00 - 5:00)
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleContinue} disabled={!date || !timeSlot}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && selectedRequest && date && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Document</span>
                <span className="font-medium">
                  {selectedRequest.documentType.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(date, "PPP")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">
                  {timeSlot === "AM"
                    ? "AM Session (8:00 - 12:00)"
                    : "PM Session (1:00 - 5:00)"}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={submitting}>
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function BookingForm({
  eligibleRequests,
}: {
  eligibleRequests: EligibleRequest[];
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        </div>
      }
    >
      <BookingFormInner eligibleRequests={eligibleRequests} />
    </Suspense>
  );
}
