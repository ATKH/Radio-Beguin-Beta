// @ts-nocheck
"use client";

import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";

function formatDayHeading(dateStr, locale) {
  const date = new Date(dateStr + "T00:00:00");
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  return formatter.format(date).replace(/\.$/, "");
}

function groupShowsByDate(shows) {
  const groups = [];
  const indexByDate = new Map();
  shows.forEach((show) => {
    if (!indexByDate.has(show.date)) {
      indexByDate.set(show.date, groups.length);
      groups.push({ date: show.date, shows: [] });
    }
    groups[indexByDate.get(show.date)].shows.push(show);
  });
  return groups;
}

function ShowLine({ show }) {
  const tags = show.tags && show.tags.length ? show.tags : null;

  return (
    <div className="flex items-center gap-3 py-2 group">
      {show.image && (
        <div className="w-20 h-20 rounded overflow-hidden bg-foreground/5 shrink-0">
          {show.link ? (
            <Link href={show.link}>
              <img
                src={show.image}
                alt={show.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.parentElement.parentElement.style.display = "none";
                }}
              />
            </Link>
          ) : (
            <img
              src={show.image}
              alt={show.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.parentElement.style.display = "none";
              }}
            />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        {show.link ? (
          <Link href={show.link} className="block">
            <p className="text-sm truncate">
              <span className="font-mono text-sm font-semibold text-foreground/70 mr-2">
                {show.time || ""}
              </span>
              <span className="font-semibold group-hover:underline">{show.title}</span>
            </p>
          </Link>
        ) : (
          <p className="text-sm truncate">
            <span className="font-mono text-sm font-semibold text-foreground/70 mr-2">
              {show.time || ""}
            </span>
            <span className="font-semibold">{show.title}</span>
          </p>
        )}
        {tags && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag, i) => (
              <Link
                key={i}
                href={`/shows?tag=${encodeURIComponent(tag)}`}
                className="tag-pill tag-pill-xs"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UpcomingShowsSection({ shows }) {
  const { locale } = useLocale();
  const groups = groupShowsByDate(shows || []);

  return (
    <section>
      <h2 className="text-3xl font-bold mb-4">
        {locale === "en" ? "Upcoming shows" : "Émissions à venir"}
      </h2>

      {groups.length === 0 ? (
        <p className="text-foreground/60 text-sm">
          {locale === "en"
            ? "No upcoming shows announced yet."
            : "Aucune émission à venir annoncée pour le moment."}
        </p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-2 space-y-3">
          {groups.map((group) => (
            <div key={group.date} className="border-b border-foreground/10 pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {group.shows.map((show) => (
                    <ShowLine key={show.id} show={show} />
                  ))}
                </div>
                <p className="text-xl font-bold text-right shrink-0 pt-1">
                  {formatDayHeading(group.date, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
