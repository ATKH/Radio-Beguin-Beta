// @ts-nocheck
"use client";

import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";
import { getLocalizedEventText } from "@/lib/eventLocalization";

function formatDate(dateStr, locale) {
  const date = new Date(dateStr + "T00:00:00");
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  return formatter.format(date);
}

function EventCard({ event, locale, muted }) {
  const title = getLocalizedEventText(event, "title", locale);
  const shortDescription = getLocalizedEventText(event, "shortDescription", locale);
  return (
    <div className={`flex flex-col items-center text-center ${muted ? "opacity-70" : ""}`}>
      {event.image && (
        <div className="w-full mb-4 flex items-center justify-center">
          <Link href={`/events/${event.slug}`}>
            <img
              src={event.image}
              alt={title}
              className="w-full max-w-xs h-auto object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </Link>
        </div>
      )}
      <div className="w-full">
        <p className="text-xs uppercase tracking-wide text-foreground/50 mb-1">
          {formatDate(event.date, locale)}
          {event.time ? ` \u00b7 ${event.time}` : ""}
        </p>
        <Link href={`/events/${event.slug}`}>
          <h2 className="font-semibold text-lg mb-1 hover:underline">{title}</h2>
        </Link>
        <p className="text-sm text-foreground/70 line-clamp-2">
          {shortDescription}
        </p>
      </div>
    </div>
  );
}

export default function EventsListView({ events, pastEvents }) {
  const { locale } = useLocale();

  return (
    <div className="min-h-screen bg-background text-foreground max-w-7xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {locale === "en" ? "Events" : "Événements"}
      </h1>

      {events.length === 0 ? (
        <p className="text-foreground/60 mb-8">
          {locale === "en"
            ? "No upcoming events at the moment."
            : "Aucun événement à venir pour le moment."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {events.map((event) => (
            <EventCard key={event.id} event={event} locale={locale} />
          ))}
        </div>
      )}

      {pastEvents && pastEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-6 text-foreground/70">
            {locale === "en" ? "Archive" : "Archives"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} locale={locale} muted />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
