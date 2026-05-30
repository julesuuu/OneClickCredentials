import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyAppointments } from "./actions";
import { AppointmentsList } from "./AppointmentsList";

export default async function AppointmentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/auth/sign-in");
  if (session.user.role === "admin") redirect("/admin");

  const appointments = await getMyAppointments();
  return <AppointmentsList appointments={appointments} />;
}
