// @ts-nocheck
import { getAllEvents } from "@/lib/events";
import { getAllUpcomingShows } from "@/lib/upcomingShows";
import { fetchPodcastPlaylists } from "@/lib/podcasts";
import { getActiveStreamSource } from "@/lib/streamConfig";
import { getAllNews } from "@/lib/news";
import AdminEventsForm from "@/components/AdminEventsForm";
import AdminUpcomingShowsForm from "@/components/AdminUpcomingShowsForm";
import AdminStreamForm from "@/components/AdminStreamForm";
import AdminNewsForm from "@/components/AdminNewsForm";
import AdminTabs from "@/components/AdminTabs";
import TickerAdmin from "@/components/TickerAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const events = await getAllEvents();
  const upcomingShows = await getAllUpcomingShows();
  const playlists = await fetchPodcastPlaylists();
  const activeStreamSource = await getActiveStreamSource();
  const news = await getAllNews();

  const tabs = [
    {
      id: "flux",
      label: "Flux Radio",
      content: (
        <>
          <h2 className="text-2xl font-bold mb-6">Flux radio actif</h2>
          <AdminStreamForm initialSource={activeStreamSource} />
        </>
      ),
    },
    {
      id: "shows",
      label: "Upcoming Shows",
      content: (
        <>
          <h2 className="text-2xl font-bold mb-6">Émissions à venir</h2>
          <AdminUpcomingShowsForm
            initialShows={upcomingShows}
            playlists={playlists}
          />
        </>
      ),
    },
    {
      id: "events",
      label: "Events",
      content: (
        <>
          <h2 className="text-2xl font-bold mb-6">Édition des événements</h2>
          <AdminEventsForm initialEvents={events} />
        </>
      ),
    },
    {
      id: "news",
      label: "News",
      content: (
        <>
          <h2 className="text-2xl font-bold mb-6">News (accueil)</h2>
          <AdminNewsForm initialNews={news} />
        </>
      ),
    },
    {
      id: "ticker",
      usesPassword: false,
      label: "Ticker Message validation",
      content: <TickerAdmin />,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground max-w-4xl mx-auto px-4 md:px-8 py-8">
      <AdminTabs tabs={tabs} />
    </div>
  );
}