"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_NAME = "rb_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 6 mois

const hasConsent = () => {
  if (typeof document === "undefined") return true;
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${COOKIE_NAME}=true`));
};

const setConsent = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=true; path=/; max-age=${COOKIE_MAX_AGE}`;
};

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!hasConsent()) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setConsent();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div className="flex max-w-2xl flex-col gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--foreground)] shadow-lg">
        <p className="leading-snug">
          Nous utilisons des cookies techniques pour assurer le bon fonctionnement du player et de vos
          préférences.{" "}
          <Link href="/politique-confidentialite" className="underline underline-offset-4">
            En savoir plus
          </Link>
          .
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-medium uppercase tracking-wide text-[var(--primary-foreground)] transition hover:bg-[var(--primary-hover)]"
          >
            J&apos;accepte
          </button>
        </div>
      </div>
    </div>
  );
}
