"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";
import { getLocalizedEventText } from "@/lib/eventLocalization";

type NewsItem = {
  id: string;
  title: string;
  titleEn?: string;
  text: string;
  textEn?: string;
  image?: string;
  link?: string;
  linkLabel?: string;
  linkLabelEn?: string;
};

type Props = {
  news: NewsItem[];
};

const AUTO_ROTATE_MS = 6000;

function LinkButton({ item, locale }: { item: NewsItem; locale: string }) {
  const href = item.link!;
  const isExternal = /^https?:\/\//.test(href);
  const customLabel = getLocalizedEventText(item, "linkLabel", locale);
  const label = customLabel || (locale === "en" ? "Learn more" : "En savoir plus");

  const className =
    "inline-flex items-center gap-1 self-start text-xs font-semibold uppercase tracking-wide px-3 py-0 rounded-full border border-foreground/30 hover:bg-foreground/10 transition-colors mt-3";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

// Le titre de la news est maintenant affiché comme titre de section (dans NewsSection)
function NewsCard({ item, locale }: { item: NewsItem; locale: string }) {
  const title = getLocalizedEventText(item, "title", locale);
  const text = getLocalizedEventText(item, "text", locale);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      {item.image && (
        <div className="w-full sm:w-44 md:w-52 shrink-0 aspect-[4/3] sm:aspect-square rounded-lg overflow-hidden bg-foreground/5">
          <img
            src={item.image}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <p className="text-sm text-foreground/70 line-clamp-5">{text}</p>
        {item.link && <LinkButton item={item} locale={locale} />}
      </div>
    </div>
  );
}

export default function NewsSection({ news }: Props) {
  const { locale } = useLocale();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!news || news.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % news.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(interval);
  }, [news]);

  if (!news || news.length === 0) return null;

  const activeItem = news[activeIndex];

  return (
    <section className="w-full">
      <div key={activeItem.id} className="animate-[fadein_0.4s_ease]">
        {/* Même taille que « Sélection » */}
        <h2 className="text-3xl font-bold mb-4">
          {getLocalizedEventText(activeItem, "title", locale)}
        </h2>
        <NewsCard item={activeItem} locale={locale} />
      </div>
      {news.length > 1 && (
        <div className="flex justify-start gap-1.5 mt-3">
          {news.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Voir la news ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-5 bg-foreground" : "w-1.5 bg-foreground/25"
              }`}
            />
          ))}
        </div>
      )}
      <style jsx>{`
        @keyframes fadein {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}