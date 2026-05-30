import { getMyAppointments } from "./actions";
import { AppointmentsList } from "./AppointmentsList";

export default async function AppointmentsPage() {
  const appointments = await getMyAppointments();
  return <AppointmentsList appointments={appointments} />;
}
