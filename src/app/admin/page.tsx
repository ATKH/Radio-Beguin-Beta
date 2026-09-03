// @ts-nocheck
import { getAllEvents } from "@/lib/events";
import { getAllUpcomingShows } from "@/lib/upcomingShows";
import { fetchPodcastPlaylists } from "@/lib/podcasts";
import AdminEventsForm from "@/components/AdminEventsForm";
import AdminUpcomingShowsForm from "@/components/AdminUpcomingShowsForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const events = await getAllEvents();
  const upcomingShows = await getAllUpcomingShows();
  const playlists = await fetchPodcastPlaylists();

  return (
    <div className="min-h-screen bg-background text-foreground max-w-4xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Émissions à venir</h1>
      <AdminUpcomingShowsForm initialShows={upcomingShows} playlists={playlists} />

      <h1 className="text-2xl font-bold mb-6 mt-16">Édition des événements</h1>
      <AdminEventsForm initialEvents={events} />
    </div>
  );
}
