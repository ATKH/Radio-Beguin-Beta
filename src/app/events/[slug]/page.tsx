// @ts-nocheck
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/events";
import EventDetailView from "@/components/EventDetailView";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return <EventDetailView event={event} />;
}
