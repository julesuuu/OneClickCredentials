import { getEligibleRequests } from "../actions";
import { BookingForm } from "./BookingForm";

export default async function NewAppointmentPage() {
  const eligibleRequests = await getEligibleRequests();
  return <BookingForm eligibleRequests={eligibleRequests} />;
}
