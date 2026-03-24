"use client";

import Image from "next/image";
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
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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
        url: "/dashboard/documents",
        icon: FileText,
      },
      {
        title: "Request",
        url: "/dashboard/requests",
        icon: ClipboardList,
      },
      {
        title: "Appointment",
        url: "/dashboard/appointments",
        icon: Calendar,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SignedIn>
        <Sidebar collapsible="icon" variant="floating" >
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  {/* <Link href="/dashboard"> */}
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Image
                      src="/icon.svg"
                      alt="OneClick Credentials"
                      width={20}
                      height={20}
                      className="size-5"
                    />
                  </div>
                  <div className="grid flex-1 text-left leading-tight text-base">
                    <span className="truncate font-semibold">
                      OneClick Credentials
                    </span>
                  </div>
                  {/* </Link> */}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            {mainNavigation.map((group) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title} className="pb-1">
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
                          <SidebarMenuItem key={item.title} className="pb-1">
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
            <UserButton size={isCollapsed ? "icon" : "default"} />
          </SidebarFooter>
        </Sidebar>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
