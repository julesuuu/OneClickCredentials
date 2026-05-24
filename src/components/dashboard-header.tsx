"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserButton } from "@daveyplate/better-auth-ui";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Home } from "lucide-react";
const routeLabels: Record<string, string> = {
  onboarding: "Onboarding",
  requests: "Requests",
  documents: "Documents",
  appointments: "Appointments",
  settings: "Settings",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const currentSegment = segments[segments.length - 1];
  const currentLabel = currentSegment ? routeLabels[currentSegment] : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">
                    {currentLabel ? (
                      <>
                        <Home className="h-4 w-4 md:hidden" />
                        <span className="hidden md:inline">Dashboard</span>
                      </>
                    ) : (
                      "Dashboard"
                    )}
                    <span className="sr-only">Dashboard</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {currentLabel && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage> {currentLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          <UserButton size="icon" />
        </div>
      </div>
    </header>
  );
}
