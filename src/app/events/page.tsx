// @ts-nocheck
import { getUpcomingEvents } from "@/lib/events";
import EventsListView from "@/components/EventsListView";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getUpcomingEvents();
  return <EventsListView events={events} />;
}
