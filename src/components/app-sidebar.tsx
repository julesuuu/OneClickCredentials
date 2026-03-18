"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Calendar,
  Settings,
  Lock,
  Scale,
  ShieldCheck,
  User,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  RedirectToSignIn,
  SignedIn,
  UserButton,
} from "@daveyplate/better-auth-ui";

const mainNavigation = [
  {
    title: "Application",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Document",
        url: "/documents",
        icon: FileText,
      },
      {
        title: "Request",
        url: "/requests",
        icon: ClipboardList,
      },
      {
        title: "Appointment",
        url: "/appointments",
        icon: Calendar,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
      {
        title: "Security",
        url: "/account/security",
        icon: Shield,
      },
    ],
  },
];

const legalNavigation = [
  {
    title: "Legal",
    items: [
      {
        title: "Privacy Policy",
        url: "/privacy-policy",
        icon: Lock,
      },
      {
        title: "Terms of Service",
        url: "/terms-of-service",
        icon: Scale,
      },
      {
        title: "Data Protection",
        url: "/data-protection",
        icon: ShieldCheck,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SignedIn>
        <Sidebar>
          <SidebarContent>
            {mainNavigation.map((group) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link href={item.url}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            <div className="mt-auto">
              {legalNavigation.map((group) => (
                <SidebarGroup key={group.title}>
                  <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const isActive = pathname === item.url;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <Link href={item.url}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </div>
          </SidebarContent>

          <SidebarFooter>
            <UserButton />
          </SidebarFooter>
        </Sidebar>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
