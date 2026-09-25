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
  const artists = event.artists || [];

  return (
    <div className="min-h-screen bg-background text-foreground max-w-5xl mx-auto px-4 md:px-8 pt-2 pb-8 md:pt-3">
      <div className="mb-6">
        <BackLink href="/events" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
        {event.image && (
          <div className="flex justify-center">
            <img
              src={event.image}
              alt={title}
              className="w-full max-w-[280px] md:max-w-sm h-auto object-contain rounded-lg"
            />
          </div>
        )}

        <div>
          <p className="text-sm uppercase tracking-wide text-foreground/50 mb-1 md:mb-2">
            {formatDate(event.date, locale)}
            {event.time ? ` \u00b7 ${event.time}` : ""}
          </p>

          <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-6">{title}</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-line mb-4 md:mb-8">
            {fullDescription}
          </div>

          {artists.length > 0 && (
            <div className="mb-4 md:mb-8">
              <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">
                {locale === "en" ? "The Artists" : "Les Artistes"}
              </h2>
              <p className="text-base leading-relaxed">
                {artists.map(function (artist, index) {
                  const separator = index > 0 ? " \u00b7 " : "";
                  const node = artist.url
                    ? React.createElement(
                        "a",
                        {
                          key: index,
                          href: artist.url,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          className: "font-semibold underline hover:no-underline",
                        },
                        artist.name
                      )
                    : React.createElement(
                        "span",
                        { key: index, className: "font-semibold" },
                        artist.name
                      );
                  return React.createElement(
                    React.Fragment,
                    { key: "wrap-" + index },
                    separator,
                    node
                  );
                })}
              </p>
            </div>
          )}

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