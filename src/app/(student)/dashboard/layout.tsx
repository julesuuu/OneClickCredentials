import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { ProfileCompletionBanner } from "@/components/profile-completion-banner";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { isProfileComplete: true },
  });

  const isProfileComplete = studentProfile?.isProfileComplete ?? false;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader />
        <ProfileCompletionBanner isProfileComplete={isProfileComplete} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}
