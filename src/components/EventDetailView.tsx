// @ts-nocheck
"use client";

import React from "react";
import BackLink from "@/components/BackLink";
import { useLocale } from "@/lib/LocaleContext";
import { getLocalizedEventText } from "@/lib/eventLocalization";

function formatDate(dateStr, locale) {
  const date = new Date(dateStr + "T00:00:00");
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return formatter.format(date);
}

export default function EventDetailView({ event }) {
  const { locale } = useLocale();

  const title = getLocalizedEventText(event, "title", locale);
  const fullDescription = getLocalizedEventText(event, "fullDescription", locale);

  return (
    <div className="min-h-screen bg-background text-foreground max-w-5xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <BackLink href="/events" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {event.image && (
          <img
            src={event.image}
            alt={title}
            className="w-full h-auto object-contain"
          />
        )}

        <div>
          <p className="text-sm uppercase tracking-wide text-foreground/50 mb-2">
            {formatDate(event.date, locale)}
            {event.time ? ` \u00b7 ${event.time}` : ""}
          </p>

          <h1 className="text-3xl font-bold mb-6">{title}</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-line mb-8">
            {fullDescription}
          </div>

          {event.links && event.links.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {event.links.map(function (link, index) {
                return React.createElement(
                  "a",
                  {
                    key: index,
                    href: link.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "inline-flex items-center px-4 py-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition text-sm font-medium",
                  },
                  link.label + " \u2197"
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
