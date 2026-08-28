// src/app/about/page.tsx
'use client';

import React from 'react';
import { useLocale } from '@/lib/LocaleContext';

export default function AboutPage() {
  const { locale } = useLocale();

  const paragraphs =
    locale === 'en'
      ? [
          "Radio Béguin is a Lyon-based webradio, broadcasting a carefully curated and constantly evolving programme to accompany your day. With a wide range of shows, including talk radio, DJ sets and live events, it gives a voice to those who are too rarely heard. It is a space for expression, brimming with new ideas and venturing wherever encounters take it, in Lyon or elsewhere.",
          "Radio Béguin is a non-profit association made up of a passionate team of volunteers. It is a project aimed at creating connections, supported by numerous resident artists, sound content creators and music lovers who always put their hearts into it.",
        ]
      : [
          "Radio Béguin est une webradio basée à Lyon diffusant en continu une programmation réfléchie et évolutive pour accompagner vos journées. Ponctuée de nombreuses émissions : talk radios, DJ sets variés et événements en direct, la voix est donnée à celleux que l’on entend que trop rarement. Un espace d’expression qui regorge de nouvelles idées et s’aventure où les rencontres l’amènent à Lyon ou ailleurs. Personne n’est à l’abri d’avoir le béguin !",
          "Radio Béguin est une association à but non lucratif constituée d’une équipe bénévole passionnée. C’est un projet porté dans le but de créer du lien, projet soutenu par de nombreux artistes résident.es, créateur·ices de contenus sonores et mélomanes qui, toujours, y mettent du cœur.",
        ];

  const supportLabel = locale === 'en' ? 'Support us' : 'Pour nous soutenir';

  return (
    <main className="min-h-screen px-4 md:px-8 py-12 max-w-5xl mx-auto text-[var(--foreground)]">
      <section className="mb-12 space-y-6 p-6 md:p-8">
        <h2 className="text-3xl font-serif font-bold mb-4 text-[var(--primary)]">
          Radio Béguin
        </h2>
        {paragraphs.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </section>

      <div className="px-6 md:px-8">
        <a
          href="https://www.helloasso.com/associations/radio-beguin/formulaires/1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold hover:bg-[var(--primary)]/90 transition"
        >
          {supportLabel}
        </a>
      </div>
    </main>
  );
}
