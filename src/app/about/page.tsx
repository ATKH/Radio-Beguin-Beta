// src/app/about/page.tsx
'use client';

import React from 'react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-pink-500 px-4 md:px-8 py-12 max-w-5xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-title font-bold mb-8 text-center">
        À propos de Radio Béguin
      </h1>

      {/* Présentation générale */}
      <section className="mb-12 space-y-6">
        <p>
          Radio Béguin est une webradio basée à Lyon qui, à travers sa jungle musicale, donne une place importante à la scène émergente et locale. 7/7 et 24/24, la programmation de Radio Béguin est réfléchie et évolutive pour vous accompagner au fil de vos journées.
        </p>
        <p>
          Ponctuée de nombreuses émissions : talk radios, DJ sets variés et événements en direct, la voix est donnée à celleux que l&apos;on entend que trop rarement. Un espace d&apos;expression qui regorge de nouvelles idées et s&apos;aventure où les rencontres l&apos;amènent à Lyon ou ailleurs. Personne n&apos;est à l&apos;abri d&apos;avoir le béguin !
        </p>
        <p className="italic">
          Radio Béguin is a 7/7 and 24/24 webradio located in Lyon, France. Through its musical jungle, the radio gives an important place to the emerging and local scene. Radio Béguin&apos;s programming is thoughtful and evolving to accompany you throughout your days. Punctuated by numerous broadcasts: talk radio, various DJ sets and live events, the voice is given to those who are rarely heard. A space for safe and free expression that is full of new ideas and ventures where encounters take it to Lyon or elsewhere. “Béguin” is an old word to say “crush” in French!
        </p>
      </section>

      {/* L'équipe */}
      <section className="mb-12 space-y-6">
        <h2 className="text-3xl font-title font-bold mb-4">L&apos;ÉQUIPE</h2>
        <p>
          Radio Béguin est une association constituée d&apos;une équipe bénévole passionnée et s&apos;entoure de nombreuses personnes de tous horizons : artistes résident·es, créateur·ices de contenu sonore...
        </p>
        <p>
          Aucun membre de l&apos;équipe n&apos;est salarié, seules nos motivations et notre temps libre permettent l&apos;existence de Radio Béguin. Merci de le prendre en considération avec indulgence :)
        </p>
        <p>
          <a
            href="https://www.helloasso.com/associations/radio-beguin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition"
          >
            Pour nous soutenir
          </a>
        </p>
      </section>
    </main>
  );
}
