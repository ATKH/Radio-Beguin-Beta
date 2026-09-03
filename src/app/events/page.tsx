// @ts-nocheck
import { getUpcomingEvents, getPastEvents } from "@/lib/events";
import EventsListView from "@/components/EventsListView";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [events, pastEvents] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);
  return <EventsListView events={events} pastEvents={pastEvents} />;
}
