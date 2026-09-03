// @ts-nocheck
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/LocaleContext";
import { getLocalizedEventText } from "@/lib/eventLocalization";
import { useState, useEffect } from "react";

function formatEventDate(dateStr, locale) {
  const date = new Date(dateStr + "T00:00:00");
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return formatter.format(date);
}

export default function UpcomingEventsSection({ events = [] }) {
  const { locale } = useLocale();

  // Si `events` est vide ou undefined, ne rien afficher
  if (!events || events.length === 0) {
    return null;
  }

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentEventIndex((prevIndex) =>
          prevIndex === events.length - 1 ? 0 : prevIndex + 1
        );
        setIsFading(false);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, [events.length]);

  const currentEvent = events[currentEventIndex];
  const title = getLocalizedEventText(currentEvent, "title", locale);
  const shortDescription = getLocalizedEventText(currentEvent, "shortDescription", locale);

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-3xl font-bold text-foreground">
          {locale === "en" ? "Events" : "Événements"}
        </h2>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="tag-pill tag-pill-sm group flex items-center gap-2 px-4 py-2 uppercase text-[10px] tracking-[0.22em] font-semibold transition-all duration-200 hover:bg-primary hover:text-white border-primary text-primary"
        >
          <Link href="/events" className="flex items-center gap-2">
            <span className="relative">
              {locale === "en" ? "See all" : "Voir tout"}
            </span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      {/* Carrousel SANS encadré */}
      <div className="relative min-h-[420px]">
        <div
          className={`flex flex-col md:flex-row gap-6 transition-opacity duration-500 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Image à gauche */}
          {currentEvent.image && (
            <div className="w-full md:w-1/2">
              <Link href={`/events/${currentEvent.slug}`}>
                <img
                  src={currentEvent.image}
                  alt={title}
                  className="w-full h-full object-cover min-h-[420px] md:min-h-0 rounded-lg"
                />
              </Link>
            </div>
          )}

          {/* Infos à droite */}
          <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
            <p className="text-sm uppercase tracking-wide text-foreground/70 mb-3">
              {formatEventDate(currentEvent.date, locale)}
              {currentEvent.time ? ` \u00b7 ${currentEvent.time}` : ""}
            </p>
            <Link href={`/events/${currentEvent.slug}`}>
              <h3 className="text-3xl font-bold mb-4 text-foreground hover:underline">
                {title}
              </h3>
            </Link>
            <p className="text-foreground/80 mb-6">{shortDescription}</p>

            {/* Tags */}
            {currentEvent.tags && currentEvent.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentEvent.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}