"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ProfileCompletionBannerProps {
  isProfileComplete: boolean;
}

export function ProfileCompletionBanner({
  isProfileComplete,
}: ProfileCompletionBannerProps) {
  const pathname = usePathname();

  if (isProfileComplete || pathname === "/dashboard/onboarding") {
    return null;
  }

  return (
    <div className="w-full px-4 pt-2 pb-1 sm:px-6 sm:pt-3 sm:pb-1">
      <Card className="w-full border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 overflow-hidden">
        {/* Mobile: compact single line */}
        <div className="flex sm:hidden items-center justify-between px-3 py-1.5 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-medium text-amber-900 dark:text-amber-100 truncate">
              Complete your profile
            </span>
          </div>
          <Button
            asChild
            size="sm"
            className="shrink-0 h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Link href="/dashboard/onboarding">
              <span>Setup</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Desktop: full version */}
        <div className="hidden sm:flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-amber-900 dark:text-amber-100">
                Complete your profile to unlock all features
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300/90 mt-0.5">
                Finish setting up your student information to request documents
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="ml-3 shrink-0 h-9 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500 transition-colors"
          >
            <Link
              href="/dashboard/onboarding"
              className="flex items-center gap-1.5"
            >
              <span>Setup Profile</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
