import React from "react";
import Link from "next/link";
import Image from "next/image";
import PlayButton from "@/components/PlayButton";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const schedule = [
  { time: "00h", label: "Playlist Nuit" },
  { time: "5h", label: "Playlist Ambient" },
  { time: "8h", label: "Playlist Matin" },
  { time: "13h", label: "Playlist Journée" },
  { time: "19h", label: "Playlist Soirée" },
];

type PodcastEpisode = {
  id: string;
  title: string;
  pubDate: string;
  audioUrl: string;
  link: string;
  description: string;
  artworkUrl: string;
};

export const revalidate = 3600; // ISR 1h

async function getEpisodes(): Promise<PodcastEpisode[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/podcasts`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: PodcastEpisode[] = await res.json();
    return data.slice(0, 10); // 10 derniers
  } catch (error) {
    console.error("Erreur fetch podcasts:", error);
    return [];
  }
}

export default async function HomePage() {
  const episodes = await getEpisodes();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-background text-foreground max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Programme */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3 text-pink-500">Programme</h2>

        <div className="hidden md:grid grid-cols-7 gap-4">
          {days.map((day) => (
            <div key={day}>
              <h3 className="font-semibold text-pink-500 mb-1 text-center">{day}</h3>
              <ul className="space-y-1 text-sm">
                {schedule.map(({ time, label }) => (
                  <li key={time} className="flex justify-center items-center space-x-1">
                    <span className="font-mono text-pink-500">{time}</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="md:hidden flex overflow-x-auto space-x-4 px-2 pb-2">
          {days.map((day) => (
            <div key={day} className="min-w-[60%] flex-shrink-0 text-center">
              <h3 className="font-semibold text-pink-500 mb-1">{day}</h3>
              <ul className="space-y-1 text-xs">
                {schedule.map(({ time, label }) => (
                  <li key={time} className="flex justify-center items-center space-x-1">
                    <span className="font-mono text-pink-500">{time}</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Derniers podcasts */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Derniers podcasts</h2>

        {episodes.length === 0 ? (
          <p className="text-center text-muted-foreground">Aucun podcast disponible.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className="group bg-muted rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-200"
              >
                <div className="relative w-full aspect-square">
                  <Image
                    src={episode.artworkUrl}
                    alt={episode.title}
                    width={300}
                    height={300}
                    className="object-cover rounded-lg"
                    priority
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <PlayButton episode={episode} />
                  </div>
                </div>
                <div className="p-3">
                  <Link
                    href={`/shows/${encodeURIComponent(episode.id)}`}
                    className="block font-semibold text-sm hover:underline line-clamp-2"
                    title={episode.title}
                  >
                    {episode.title}
                  </Link>
                  <time className="text-xs text-muted-foreground" dateTime={episode.pubDate}>
                    {formatDate(episode.pubDate)}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
