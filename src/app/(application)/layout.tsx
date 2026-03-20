import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { RedirectToSignIn } from "@daveyplate/better-auth-ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
      <RedirectToSignIn />
    </SidebarProvider>
  );
}
