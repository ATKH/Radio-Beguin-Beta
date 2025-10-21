'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type ScheduleSlot = {
  time: string;
  label: string;
  highlight?: boolean;
};

export type WeeklyScheduleConfig = Record<string, ScheduleSlot[]>;

const DAY_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function formatDayLabel(date: Date) {
  const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date);
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function getOrderedDays(schedule: WeeklyScheduleConfig) {
  const ordered = DAY_ORDER.filter(day => (schedule[day] ?? []).length > 0).map(day => ({ day, slots: schedule[day]! }));
  if (ordered.length > 0) return ordered;
  return Object.entries(schedule)
    .filter(([, slots]) => slots.length > 0)
    .map(([day, slots]) => ({ day, slots }));
}

function getTodayIndex(days: Array<{ day: string; slots: ScheduleSlot[] }>) {
  const today = new Date();
  const jsDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  const frenchDay = DAY_ORDER[(jsDay + 6) % 7]; // align with array starting Monday
  const index = days.findIndex(({ day }) => day === frenchDay);
  return index >= 0 ? index : 0;
}

const normalizeTitle = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractShowName = (label: string) => {
  if (!label) return '';
  const bulletIndex = label.indexOf('•');
  if (bulletIndex >= 0) return label.slice(0, bulletIndex).trim();
  const dashIndex = label.indexOf(' - ');
  if (dashIndex >= 0) return label.slice(0, dashIndex).trim();
  return label.trim();
};

export default function WeeklySchedule({
  schedule,
  highlightTargets,
}: {
  schedule: WeeklyScheduleConfig;
  highlightTargets?: Record<string, string>;
}) {
  const days = useMemo(() => getOrderedDays(schedule), [schedule]);
  const initialIndex = useMemo(() => getTodayIndex(days), [days]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (days.length === 0) {
    return null;
  }

  const safeIndex = Math.min(Math.max(currentIndex, 0), days.length - 1);
  const { day, slots } = days[safeIndex];

  const formatDateLabel = (label: string) => {
    const baseDate = new Date();
    const todayName = formatDayLabel(baseDate);
    let targetDate: Date | undefined;

    if (label === todayName) {
      targetDate = baseDate;
    } else {
      for (let i = 1; i < 7; i++) {
        const candidate = new Date(baseDate);
        candidate.setDate(baseDate.getDate() + i);
        if (formatDayLabel(candidate) === label) {
          targetDate = candidate;
          break;
        }
      }
    }

    if (!targetDate) return label;

    const formatter = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    });

    return `${label} ${formatter.format(targetDate).replace(/\//g, '.')}`;
  };

  const goPrev = () => {
    setCurrentIndex(prev => (prev - 1 + days.length) % days.length);
  };

  const goNext = () => {
    setCurrentIndex(prev => (prev + 1) % days.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-[var(--foreground)]">
          Programme
        </h2>
        <div className="flex items-center justify-center gap-3 sm:justify-end">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-primary/10 transition"
            aria-label="Jour précédent"
          >
            <ChevronLeft className="h-4 w-4 text-primary" />
          </button>
          <h3 className="text-lg font-bold uppercase tracking-[0.1em] text-[var(--foreground)] sm:text-xl">
            {formatDateLabel(day)}
          </h3>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-primary/10 transition"
            aria-label="Jour suivant"
          >
            <ChevronRight className="h-4 w-4 text-primary" />
          </button>
        </div>
      </div>

      <ul className="space-y-2 text-sm md:text-base">
        {slots.map((slot, slotIndex) => {
          const baseShowName = slot.highlight ? extractShowName(slot.label) : '';
          const normalizedShowName = slot.highlight ? normalizeTitle(baseShowName) : '';
          const playlistId =
            slot.highlight && normalizedShowName
              ? highlightTargets?.[normalizedShowName]
              : undefined;
          const queryValue = baseShowName || slot.label;
          const highlightHref = slot.highlight
            ? playlistId
              ? `/shows/playlist/${encodeURIComponent(playlistId)}`
              : queryValue
                ? `/shows?query=${encodeURIComponent(queryValue)}`
                : '/shows'
            : null;

          return (
            <li key={`${day}-${slot.time}-${slotIndex}`} className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs md:text-sm text-primary/70">{slot.time}</span>
              <span className="flex-1 text-right md:text-left leading-snug">
                {slot.highlight && highlightHref ? (
                  <Link
                    href={highlightHref}
                    className="inline-flex items-center gap-1 font-semibold schedule-highlight hover:underline"
                  >
                    <span>{slot.label}</span>
                    <span aria-hidden="true">↗</span>
                    <span className="sr-only">
                      {`Voir l'émission ${baseShowName || slot.label}`}
                    </span>
                  </Link>
                ) : (
                  slot.label
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-primary/60">
        {days.map((item, index) => (
          <button
            key={item.day}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              index === safeIndex ? '' : 'bg-primary/20 hover:bg-primary/35'
            }`}
            style={index === safeIndex ? { backgroundColor: 'var(--primary)' } : undefined}
            aria-label={`Voir le programme du ${item.day}`}
          />
        ))}
      </div>
    </div>
  );
}
