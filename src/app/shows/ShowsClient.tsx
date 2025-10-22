'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/PlayerContext";
import type { PodcastEpisode, PodcastPlaylist } from "@/lib/podcasts.types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";

type TabId = "all" | "playlists" | "tags";

type ApiPayload = {
  episodes?: PodcastEpisode[];
  playlists?: PodcastPlaylist[];
  tags?: string[];
};

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "all", label: "Tous les épisodes" },
  { id: "playlists", label: "Émissions" },
  { id: "tags", label: "Styles" },
];

const PAGE_SIZE = 20;
const SHUFFLE_MAX_COUNT = 48;

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const MOOD_BASE = [
  { id: "talk", label: "Talk", tag: "Talk", image: "/Talk.png" },
  { id: "meditation-core", label: "Meditation Core", tag: "Meditation Core", image: "/Meditation Core.png" },
  { id: "metro-boulot", label: "Métro Boulot", tag: "Métro Boulot", image: "/Metro Boulot.png" },
  { id: "curiosites", label: "Curiosités", tag: "Curiosités", image: "/Curiosites.png" },
  { id: "bain-de-soleil", label: "Bain de Soleil", tag: "Bain de Soleil", image: "/Bain de Soleil.png" },
  { id: "crepuscule", label: "Crépuscule", tag: "Crépuscule", image: "/Singe2.png" },
  { id: "appels-de-phares", label: "Appels de Phares", tag: "Appels de Phares", image: "/Appels de Phares.png" },
  { id: "abysses", label: "Abysses", tag: "Abysses", image: "/Abysses.svg" },
];

const MOOD_IMAGE_CACHE: Record<string, string> = {};
const IDLE_TIMEOUT_MS = 120;

const scheduleIdle = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  const idleFn = (window as any).requestIdleCallback as ((cb: () => void, options?: { timeout?: number }) => number) | undefined;
  if (typeof idleFn === "function") {
    const handle = idleFn(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => {
      const cancel = (window as any).cancelIdleCallback as ((id: number) => void) | undefined;
      if (typeof cancel === "function") {
        cancel(handle);
      }
    };
  }
  const handle = window.setTimeout(callback, IDLE_TIMEOUT_MS);
  return () => window.clearTimeout(handle);
};

const MOOD_VARIANTS = [
  "Appel de Phares",
  "Appel de phares",
  "Appels de Phare",
  "Appels de phare",
  "Appel de Phare",
];

const TALK_TAG_KEY = normalizeText("Talk");
const ACTIVE_TAGS_STORAGE_KEY = "shows:last-active-tags";

const INTENSITY_LEVELS = [0.78, 0.66, 0.55, 0.45, 0.35, 0.25, 0.18, 0.1];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function mixHex(base: string, target: string, ratio: number) {
  const clean = base.replace('#', '');
  const tgt = target.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const tr = parseInt(tgt.slice(0, 2), 16);
  const tg = parseInt(tgt.slice(2, 4), 16);
  const tb = parseInt(tgt.slice(4, 6), 16);
  const blend = (start: number, end: number) => Math.round(start * (1 - ratio) + end * ratio);
  return `#${blend(r, tr).toString(16).padStart(2, "0")}${blend(g, tg).toString(16).padStart(2, "0")}${blend(b, tb).toString(16).padStart(2, "0")}`;
}

function buildMoodFilters(primary: string, accent: string) {
  return MOOD_BASE.map((base, index) => {
    const intensity = INTENSITY_LEVELS[index] ?? 0.4;
    const baseTone = mixHex(primary, '#ffffff', intensity);
    const midTone = mixHex(baseTone, '#ffffff', 0.12);
    const highlight = mixHex(baseTone, '#ffffff', 0.28);
    const depth = mixHex(baseTone, '#000000', clamp(0.1 + (0.32 - intensity) * 0.55));
    const borderTone = mixHex(accent, '#ffffff', clamp(intensity - 0.1, 0, 1));
    const ambient = mixHex(primary, '#ffffff', clamp(intensity + 0.15, 0, 1));

    return {
      ...base,
      gradient: `radial-gradient(circle at 32% 28%, ${highlight} 0%, ${midTone} 42%, ${baseTone} 68%, ${depth} 100%)`,
      accent: borderTone,
      baseTone,
      shadow: `inset 0 0 0.5px rgba(255,255,255,0.55), 0 4px 10px ${ambient}33`,
    };
  });
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}


const textContainsTokens = (haystack: string, tokens: string[]) =>
  tokens.every(token => haystack.includes(token));

const CARD_ARTWORK_SIZES =
  "(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 768px) 36vw, 90vw";

const ENABLE_STYLE_CATEGORIES = true;
const STYLE_GROUP_COUNT = 4;

const FALLBACK_STYLE_GROUP = {
  id: "others",
  label: "Autres styles",
};

const EpisodeCard = React.memo(function EpisodeCard({
  episode,
  onPlay,
  onTagClick,
  activeTagSet,
  hiddenTagSet,
  onBeforeTagClick,
  onClearMood,
}: {
  episode: PodcastEpisode;
  onPlay: (episode: PodcastEpisode) => void;
  onTagClick: (tag: string) => void;
  activeTagSet: Set<string>;
  hiddenTagSet: Set<string>;
  onBeforeTagClick?: (tag: string) => void;
  onClearMood: () => void;
}) {
  const isTagActive = useCallback((tag: string) => activeTagSet.has(normalizeText(tag)), [activeTagSet]);
  const displayTags = useMemo(
    () => (episode.tags ?? []).filter(tag => !hiddenTagSet.has(normalizeText(tag))),
    [episode.tags, hiddenTagSet]
  );

  return (
    <div className="bg-muted rounded-lg overflow-hidden transition-all duration-200 group w-full max-w-[320px] mx-auto">
      <div className="relative w-full aspect-square">
        <Image
          src={episode.artworkUrl}
          alt={episode.title}
          fill
          sizes={CARD_ARTWORK_SIZES}
          className="object-cover"
          loading="lazy"
        />
        {/* ✅ Bouton play */}
        <div className="podcast-card-overlay absolute inset-0 flex items-center justify-center transition-opacity duration-200">
          <Button
            size="lg"
            onClick={() => onPlay(episode)}
            className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
          >
            <Play className="h-6 w-6 ml-1" />
          </Button>
        </div>
      </div>
      <div className="px-3 py-2 space-y-1.5 sm:py-3 sm:space-y-2">
        <Link
          href={`/shows/${encodeURIComponent(episode.id)}`}
          className="block font-semibold text-sm hover:underline line-clamp-2 text-[var(--foreground)]"
          title={episode.title}
        >
          {episode.title}
        </Link>
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {displayTags.map((tag, tagIndex) => {
              const key = `${normalizeText(tag)}-${tagIndex}`;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onBeforeTagClick?.(tag);
                    onClearMood();
                    onTagClick(tag);
                  }}
                  className={`tag-pill tag-pill-xs${isTagActive(tag) ? " active" : ""}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

const PlaylistCard = React.memo(
  function PlaylistCard({
    playlist,
    latestEpisode,
    tags,
    tagsKey,
    activeTagSet,
    onPlay,
    onTagClick,
    onBeforeTagClick,
  }: {
    playlist: PodcastPlaylist;
    latestEpisode?: PodcastEpisode;
    tags: string[];
    tagsKey: string;
    activeTagSet: Set<string>;
    onPlay: (episode: PodcastEpisode) => void;
    onTagClick: (tag: string) => void;
    onBeforeTagClick?: (tag: string) => void;
  }) {
    const displayTags = useMemo(() => tags.slice(0, 6), [tags]);

    return (
      <div className="group bg-muted rounded-lg overflow-hidden transition-all duration-200 w-full max-w-[320px] mx-auto">
        <div className="relative w-full aspect-square">
          <Image
            src={playlist.artworkUrl}
            alt={playlist.title}
            fill
            sizes={CARD_ARTWORK_SIZES}
            className="object-cover"
            loading="lazy"
          />
          {latestEpisode && (
            <div className="podcast-card-overlay absolute inset-0 flex items-center justify-center transition-opacity duration-200">
              <Button
                size="lg"
                onClick={() => onPlay(latestEpisode)}
                className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
              >
                <Play className="h-6 w-6 ml-1" />
              </Button>
            </div>
          )}
        </div>
        <div className="px-3 py-2 space-y-1.5 sm:py-3 sm:space-y-2">
          <Link
            href={`/shows/playlist/${encodeURIComponent(playlist.id)}`}
            className="block font-semibold text-sm hover:underline line-clamp-2 text-[var(--foreground)]"
            title={playlist.title}
          >
            {playlist.title}
          </Link>
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag, tagIndex) => {
                const key = `${normalizeText(tag)}-${tagIndex}`;
                const isActive = activeTagSet.has(normalizeText(tag));
                return (
                  <button
                    key={`${tagsKey}-${key}`}
                    type="button"
                    onClick={() => {
                      onBeforeTagClick?.(tag);
                      onTagClick(tag);
                    }}
                    className={`tag-pill tag-pill-xs${isActive ? " active" : ""}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.playlist.id === next.playlist.id &&
    (prev.latestEpisode?.id ?? null) === (next.latestEpisode?.id ?? null) &&
    prev.tagsKey === next.tagsKey &&
    prev.onPlay === next.onPlay &&
    prev.onTagClick === next.onTagClick &&
    prev.onBeforeTagClick === next.onBeforeTagClick &&
    prev.activeTagSet === next.activeTagSet
);

export default function ShowsClient() {
  const { palette, theme } = useTheme();
  const moodFilters = useMemo(() => buildMoodFilters(palette.primary, palette.accent), [palette]);
  const moodKeys = useMemo(() => {
    const keys = new Set(moodFilters.map(filter => normalizeText(filter.tag)));
    MOOD_VARIANTS.forEach(variant => keys.add(normalizeText(variant)));
    return keys;
  }, [moodFilters]);
  const hiddenMoodTags = useMemo(() => {
    const set = new Set(moodKeys);
    set.delete(TALK_TAG_KEY);
    return set;
  }, [moodKeys]);

  const { playPodcast } = usePlayer();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lastAppliedQueryKey = useRef<string | null>(null);
  const shuffleTimeoutRef = useRef<number | null>(null);
  const hasRestoredTags = useRef(false);

  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [playlists, setPlaylists] = useState<PodcastPlaylist[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [shuffledEpisodes, setShuffledEpisodes] = useState<PodcastEpisode[] | null>(null);
  const [shuffledPlaylists, setShuffledPlaylists] = useState<PodcastPlaylist[] | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeTagsRef = useRef<string[]>([]);
  const [processedMoodImages, setProcessedMoodImages] = useState<Record<string, string>>(() => ({ ...MOOD_IMAGE_CACHE }));
  const [activeMoodBounceId, setActiveMoodBounceId] = useState<string | null>(null);
  const moodBounceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const processPng = (source: string) =>
      new Promise<string | null>(resolve => {
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];
              if (a === 0) continue;
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const brightness = (r + g + b) / 3;
              const colorVariance = max - min;
              const isNearWhite = brightness > 232 && colorVariance < 64;
              const isVeryLightNeutral = brightness > 242 && colorVariance < 96;
              if (isNearWhite || isVeryLightNeutral) {
                data[i + 3] = 0;
              }
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (err) {
            console.warn("Impossible de post-traiter l'image mood", source, err);
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = source;
      });

    const processImage = async (src: string): Promise<string | null> => {
      const lower = src.toLowerCase();
      if (lower.endsWith('.svg')) {
        try {
          const response = await fetch(src);
          const svgText = await response.text();
          const match = svgText.match(/base64,([^"']+)/i);
          if (match) {
            const dataUrl = `data:image/png;base64,${match[1]}`;
            return await processPng(dataUrl);
          }
        } catch (err) {
          console.warn('Impossible de lire le SVG mood', src, err);
        }
        return null;
      }
      return processPng(src);
    };

    const unique = Array.from(new Set(MOOD_BASE.map(base => base.image).filter(Boolean) as string[]));
    const toProcess = unique.filter(src => !MOOD_IMAGE_CACHE[src]);

    if (toProcess.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    const processAll = async () => {
      const results = await Promise.all(toProcess.map(async src => [src, await processImage(src)] as const));
      if (cancelled) return;
      const map: Record<string, string> = {};
      results.forEach(([src, dataUrl]) => {
        if (dataUrl) {
          map[src] = dataUrl;
          MOOD_IMAGE_CACHE[src] = dataUrl;
        }
      });
      if (process.env.NODE_ENV !== "production") {
        console.debug("Mood images traitées", map);
      }
      if (Object.keys(map).length > 0) {
        setProcessedMoodImages(prev => ({ ...prev, ...map }));
      }
    };

    const cancelIdle = scheduleIdle(() => {
      if (!cancelled) {
        processAll().catch(err => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Échec traitement mood images", err);
          }
        });
      }
    });

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);

  useEffect(() => {
    activeTagsRef.current = activeTags;
  }, [activeTags]);
  
  useEffect(() => {
    return () => {
      if (moodBounceTimeoutRef.current) {
        window.clearTimeout(moodBounceTimeoutRef.current);
        moodBounceTimeoutRef.current = null;
      }
    };
  }, []);

  const updateQueryFromTags = useCallback(
    (tags: string[]) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tag");
      tags.forEach(value => params.append("tag", value));
      const queryString = params.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (activeTags.length > 0) {
        window.sessionStorage.setItem(ACTIVE_TAGS_STORAGE_KEY, JSON.stringify(activeTags));
      } else {
        window.sessionStorage.removeItem(ACTIVE_TAGS_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [activeTags]);

  // ✅ Lecture avec proxy
  const handlePlay = useCallback(
    (episode: PodcastEpisode) => {
      const audioUrl = `/api/podcast-stream/${episode.id}?ts=${Date.now()}`;
      playPodcast({
        ...episode,
        audioUrl,
        streamProtocol: episode.streamProtocol,
      });
    },
    [playPodcast]
  );

  // Chargement JSON podcasts
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch("/data/podcasts.json")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((payload: ApiPayload | PodcastEpisode[]) => {
        if (!isMounted) return;
        if (Array.isArray(payload)) {
          setEpisodes(payload);
          setPlaylists([]);
        } else {
          setEpisodes(payload.episodes ?? []);
          setPlaylists(payload.playlists ?? []);
        }
      })
      .catch(err => {
        console.error("Erreur fetch podcasts:", err);
        if (isMounted) setError("Impossible de charger les podcasts");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Tags actifs depuis URL
  useEffect(() => {
    const params = searchParams.getAll("tag").map(tag => tag.trim()).filter(Boolean);
    const normalized = params.map(t => normalizeText(t)).sort();
    const key = normalized.join("|");

    if (lastAppliedQueryKey.current !== key) {
      lastAppliedQueryKey.current = key;
      activeTagsRef.current = params;
      setActiveTags(params);
      if (params.length > 0 && activeTab !== "tags") setActiveTab("all");
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    if (hasRestoredTags.current) return;
    if (typeof window === "undefined") return;
    if (activeTags.length > 0) {
      hasRestoredTags.current = true;
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(ACTIVE_TAGS_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        if (Array.isArray(stored) && stored.length > 0) {
          activeTagsRef.current = stored;
          setActiveTags(stored);
          if (activeTab !== "tags") {
            setActiveTab("all");
          }
          updateQueryFromTags(stored);
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      hasRestoredTags.current = true;
    }
  }, [activeTab, activeTags.length, updateQueryFromTags]);

  useEffect(() => {
    const queryValue = searchParams.get("query");
    const trimmed = queryValue ? queryValue.trim() : "";
    setSearch(trimmed);
  }, [searchParams]);

  const activeTagsNormalized = useMemo(() => activeTags.map(tag => normalizeText(tag)), [activeTags]);
  const activeTagSet = useMemo(() => new Set(activeTagsNormalized), [activeTagsNormalized]);
  const activeTagsKey = useMemo(() => activeTagsNormalized.join("|"), [activeTagsNormalized]);
  const activeMood = useMemo(
    () => moodFilters.find(mood => activeTagSet.has(normalizeText(mood.tag))),
    [activeTagSet, moodFilters]
  );

  const styleTagEntries = useMemo(() => {
    const counters = new Map<string, { label: string; count: number }>();

    const register = (tag?: string | null) => {
      if (!tag) return;
      const key = normalizeText(tag);
      if (!key || moodKeys.has(key)) return;
      const existing = counters.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counters.set(key, { label: tag, count: 1 });
      }
    };

    episodes.forEach(ep => ep.tags?.forEach(register));
    return Array.from(counters.entries())
      .map(([normalized, entry]) => ({
        label: entry.label,
        normalized,
        count: entry.count,
      }))
      .filter(entry => entry.count > 0)
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  }, [episodes, moodKeys]);

  const availableStyleTags = useMemo(
    () => styleTagEntries.map(entry => entry.label),
    [styleTagEntries]
  );

  const styleGroups = useMemo(() => {
    if (!ENABLE_STYLE_CATEGORIES) return [];
    if (styleTagEntries.length === 0) return [];

    const alphaEntries: typeof styleTagEntries = [];
    const specialEntries: typeof styleTagEntries = [];

    styleTagEntries.forEach(entry => {
      if (/[a-z]/.test(entry.normalized)) {
        alphaEntries.push(entry);
      } else {
        specialEntries.push(entry);
      }
    });

    if (alphaEntries.length === 0) {
      return [
        {
          id: FALLBACK_STYLE_GROUP.id,
          label: FALLBACK_STYLE_GROUP.label,
          tags: styleTagEntries.map(entry => entry.label),
        },
      ];
    }

    const groupCount = Math.min(STYLE_GROUP_COUNT, alphaEntries.length);
    const baseSize = Math.floor(alphaEntries.length / groupCount);
    let remainder = alphaEntries.length % groupCount;

    const groups: Array<{ id: string; label: string; tags: string[] }> = [];
    let cursor = 0;

    for (let index = 0; index < groupCount; index += 1) {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      const sliceSize = baseSize + extra;
      const slice = alphaEntries.slice(cursor, cursor + sliceSize);
      cursor += sliceSize;

      if (slice.length === 0) continue;

      const firstLetter = slice[0].normalized.match(/[a-z]/)?.[0]?.toUpperCase() ?? slice[0].label.charAt(0).toUpperCase();
      const lastLetter =
        slice[slice.length - 1].normalized.match(/[a-z]/)?.[0]?.toUpperCase() ??
        slice[slice.length - 1].label.charAt(0).toUpperCase();
      const label = firstLetter === lastLetter ? firstLetter : `${firstLetter} - ${lastLetter}`;

      groups.push({
        id: `letters-${firstLetter}${lastLetter}-${index}`,
        label,
        tags: slice.map(entry => entry.label),
      });
    }

    if (groups.length === 0) {
      return [
        {
          id: FALLBACK_STYLE_GROUP.id,
          label: FALLBACK_STYLE_GROUP.label,
          tags: styleTagEntries.map(entry => entry.label),
        },
      ];
    }

    if (specialEntries.length > 0) {
      specialEntries.forEach((entry, index) => {
        const targetGroup = groups[index % groups.length];
        targetGroup.tags.push(entry.label);
      });
    }

    groups.forEach(group => {
      group.tags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    });

    return groups;
  }, [styleTagEntries]);
  const stickySelectionTone =
    theme === "dark"
      ? "bg-black text-white supports-[backdrop-filter]:bg-black/85"
      : "bg-white text-[var(--foreground)] supports-[backdrop-filter]:bg-white/80";

  const searchTokens = useMemo(() => {
    const normalized = normalizeText(search);
    return normalized ? normalized.split(' ') : [];
  }, [search]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem("shows:last-query", window.location.search ?? "");
    } catch {
      // ignore storage errors
    }
  }, [activeTagsKey, search, activeTab]);

  // Filtrage épisodes
  const filteredEpisodes = useMemo(() => {
    return episodes.filter(ep => {
      const tagsNormalized = (ep.tags ?? []).map(tag => normalizeText(tag));
      const combined = `${normalizeText(ep.title)} ${tagsNormalized.join(' ')}`.trim();
      const matchesSearch = searchTokens.length === 0
        ? true
        : textContainsTokens(combined, searchTokens);
      const matchesTags = activeTagsNormalized.length > 0
        ? activeTagsNormalized.every(tag => tagsNormalized.includes(tag))
        : true;
      return matchesSearch && matchesTags;
    });
  }, [episodes, searchTokens, activeTagsNormalized]);

  const filteredPlaylists = useMemo(() => {
    return playlists.filter(pl => {
      const tagsNormalized = (pl.tags ?? []).map(tag => normalizeText(tag));
      const combined = `${normalizeText(pl.title)} ${tagsNormalized.join(' ')}`.trim();
      const matchesSearch = searchTokens.length === 0
        ? true
        : textContainsTokens(combined, searchTokens);
      const matchesTags = activeTagsNormalized.length > 0
        ? activeTagsNormalized.every(tag => tagsNormalized.includes(tag))
        : true;
      return matchesSearch && matchesTags;
    });
  }, [playlists, searchTokens, activeTagsNormalized]);

  const sourceEpisodes = shuffledEpisodes ?? filteredEpisodes;
  const sourceLength = sourceEpisodes.length;

  const items = sourceEpisodes.slice(0, displayCount);
  const hasMore = displayCount < sourceLength;

  const playlistsToRender = shuffledPlaylists ?? filteredPlaylists;

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + PAGE_SIZE, sourceLength));
  }, [sourceLength]);

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    setShuffledEpisodes(null);
    setShuffledPlaylists(null);
    setIsShuffling(false);
    if (shuffleTimeoutRef.current) {
      window.clearTimeout(shuffleTimeoutRef.current);
      shuffleTimeoutRef.current = null;
    }
  }, [search, activeTagsKey]);

  const showEpisodes = activeTab === "all" || activeTab === "tags";

  const toggleTag = useCallback(
    (tag: string, options: { exclusive?: boolean } = {}) => {
      const normalized = normalizeText(tag);
      const previous = activeTagsRef.current;
      const hasTag = previous.some(existing => normalizeText(existing) === normalized);
      let next: string[];

      if (options.exclusive) {
        const withoutMoods = previous.filter(existing => !moodKeys.has(normalizeText(existing)));
        next = hasTag ? withoutMoods : [...withoutMoods, tag];
      } else {
        next = hasTag
          ? previous.filter(existing => normalizeText(existing) !== normalized)
          : [...previous, tag];
      }

      activeTagsRef.current = next;
      setActiveTags(next);
      if (activeTab !== "tags") {
        setActiveTab("all");
      }
      setDisplayCount(PAGE_SIZE);
      updateQueryFromTags(next);
    },
    [activeTab, moodKeys, updateQueryFromTags]
  );

  const handleClearTags = useCallback(() => {
    activeTagsRef.current = [];
    setActiveTags([]);
    updateQueryFromTags([]);
  }, [updateQueryFromTags]);

  const handleClearMood = useCallback(() => {
    const filtered = activeTagsRef.current.filter(tag => !moodKeys.has(normalizeText(tag)));
    activeTagsRef.current = filtered;
    setActiveTags(filtered);
    updateQueryFromTags(filtered);
  }, [moodKeys, updateQueryFromTags]);

  const handleMoodClick = useCallback(
    (filterId: string, tag: string) => {
      if (moodBounceTimeoutRef.current) {
        window.clearTimeout(moodBounceTimeoutRef.current);
      }
      setActiveMoodBounceId(filterId);
      moodBounceTimeoutRef.current = window.setTimeout(() => {
        setActiveMoodBounceId(current => (current === filterId ? null : current));
        moodBounceTimeoutRef.current = null;
      }, 600);
      toggleTag(tag, { exclusive: true });
    },
    [toggleTag]
  );

  const handleShuffleEpisodes = useCallback(() => {
    if (activeTab === "playlists") {
      if (filteredPlaylists.length === 0) {
        return;
      }
      setIsShuffling(true);
      if (shuffleTimeoutRef.current) {
        window.clearTimeout(shuffleTimeoutRef.current);
      }
      const randomizedPlaylists = shuffleArray(filteredPlaylists);
      setShuffledPlaylists(randomizedPlaylists);
      setShuffledEpisodes(null);
      shuffleTimeoutRef.current = window.setTimeout(() => {
        setIsShuffling(false);
        shuffleTimeoutRef.current = null;
      }, 600);
      return;
    }

    if (filteredEpisodes.length === 0) {
      return;
    }

    setIsShuffling(true);
    if (shuffleTimeoutRef.current) {
      window.clearTimeout(shuffleTimeoutRef.current);
    }
    const randomized = shuffleArray(filteredEpisodes);
    const limited = randomized.slice(0, Math.min(randomized.length, SHUFFLE_MAX_COUNT));
    setShuffledEpisodes(limited);
    setShuffledPlaylists(null);
    setDisplayCount(Math.min(PAGE_SIZE, limited.length));
    shuffleTimeoutRef.current = window.setTimeout(() => {
      setIsShuffling(false);
      shuffleTimeoutRef.current = null;
    }, 600);
  }, [activeTab, filteredEpisodes, filteredPlaylists, setShuffledEpisodes, setShuffledPlaylists, setDisplayCount]);

  useEffect(() => {
    return () => {
      if (shuffleTimeoutRef.current) {
        window.clearTimeout(shuffleTimeoutRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">
              Shows
            </h1>
            <button
              type="button"
              onClick={handleShuffleEpisodes}
              className={`singe-beguin flex-shrink-0 ${isShuffling ? "active animate-bounce-once" : ""}`}
              aria-label="Shuffle des podcasts"
              title="Shuffle des podcasts"
              disabled={
                (activeTab === "playlists" && filteredPlaylists.length === 0) ||
                (activeTab !== "playlists" && filteredEpisodes.length === 0)
              }
            >
              <Image
                src="/Singe1.png"
                alt=""
                width={42}
                height={42}
                draggable={false}
                priority={false}
                className={`object-contain transition-all duration-300 ${
                  isShuffling ? "filter-none scale-110" : "grayscale contrast-125 brightness-90"
                }`}
              />
            </button>
          </div>
          <input
            type="search"
            placeholder="Rechercher un podcast, une émission ou un tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            inputMode="search"
            className="w-full sm:w-72 pl-3 pr-3 py-2 text-base sm:text-sm rounded-lg border border-muted bg-muted/20 text-foreground"
          />
        </div>

      </div>

      {activeTags.length > 0 && (
        <div
          className={`sticky z-30 border-t border-transparent backdrop-blur transition-colors ${stickySelectionTone}`}
          style={{ top: "calc(var(--player-offset, 140px) - 4px)" }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-1.5 md:px-8">
            {activeTags.map((tag, index) => (
              <button
                key={`${normalizeText(tag)}-${index}`}
                type="button"
                onClick={() => toggleTag(tag)}
                className="tag-pill tag-pill-sm active flex items-center gap-1"
              >
                <span>{tag}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={handleClearTags}
            >
              Tout effacer
            </button>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(prev => {
                  if (tab.id === "tags" && prev === "tags") {
                    setDisplayCount(PAGE_SIZE);
                    return "all";
                  }
                  if (tab.id === "all" || tab.id === "tags") {
                    setDisplayCount(PAGE_SIZE);
                  }
                  return tab.id;
                });
              }}
              className={`tag-pill tag-pill-sm${activeTab === tab.id ? " active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:gap-4">
          <div className="flex items-center justify-end">
            {activeMood ? (
              <button
                type="button"
                onClick={handleClearMood}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                aria-label={`Retirer le mood ${activeMood.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex w-full justify-between gap-3 overflow-x-auto overflow-y-visible px-2 py-1 sm:justify-end sm:gap-4 sm:px-0">
            {moodFilters.map(filter => {
              const isActive = activeTagSet.has(normalizeText(filter.tag));
              const imageSrc = filter.image ?? "/logocoeur.webp";
              const processedSrc = processedMoodImages[imageSrc];
              const needsProcessing = imageSrc.toLowerCase().endsWith(".png");
              const displaySrc = processedSrc ?? imageSrc;
              const isReady = Boolean(processedSrc) || !needsProcessing;
              return (
                <div key={filter.id} className="flex flex-col items-center gap-1 text-center">
                <button
                  type="button"
                  onClick={() => handleMoodClick(filter.id, filter.tag)}
                  title={filter.label}
                  className={`relative flex h-[42px] w-[42px] items-center justify-center bg-transparent p-0 border-0 shadow-none hover:bg-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${
                    isActive ? "scale-[1.05]" : ""
                  }${activeMoodBounceId === filter.id ? " animate-bounce-once" : ""}`}
                >
                  <img
                    src={displaySrc}
                    alt=""
                    className={`h-full w-full max-h-[42px] max-w-[42px] object-contain mood-icon${isActive ? " mood-icon--active" : ""}`}
                    style={{ opacity: isReady ? 1 : 0, transition: "opacity 0.2s ease-in-out" }}
                    loading="lazy"
                  />
                  <span className="sr-only">{filter.label}</span>
                </button>
                <span className={`mood-label text-[9px] leading-3 uppercase tracking-[0.14em] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {filter.label}
                </span>
              </div>
            );
          })}
          </div>
        </div>
      </div>

    {activeTab === "tags" && (
      <section className="mb-6">
        {ENABLE_STYLE_CATEGORIES ? (
          styleGroups.length > 0 ? (
            <>
              <div className="flex gap-3 overflow-x-auto pb-2 sm:hidden">
                {styleGroups.map(group => (
                  <div key={`mobile-${group.id}`} className="min-w-[220px] space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {group.tags.map(tag => {
                        const isActive = activeTagSet.has(normalizeText(tag));
                        return (
                          <button
                            key={`${normalizeText(tag)}-${group.id}`}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`tag-pill tag-pill-xs${isActive ? " active" : ""}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                {styleGroups.map(group => (
                  <div key={group.id} className="space-y-2">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {group.tags.map(tag => {
                        const isActive = activeTagSet.has(normalizeText(tag));
                        return (
                          <button
                            key={`${normalizeText(tag)}-${group.id}`}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`tag-pill tag-pill-xs${isActive ? " active" : ""}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun style disponible.</p>
          )
        ) : availableStyleTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun style disponible.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {availableStyleTags.map((tag, index) => {
              const isActive = activeTagSet.has(normalizeText(tag));
              return (
                <button
                  key={`${normalizeText(tag)}-${index}`}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`tag-pill tag-pill-xs${isActive ? " active" : ""}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </section>
    )}

      {error && (
        <div className="mb-6 text-sm text-destructive">{error}</div>
      )}

      {/* Episodes */}
      {showEpisodes && (
        <section>
          {loading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucun épisode trouvé.</p>
          ) : (
            <InfiniteScroll
              dataLength={items.length}
              next={handleLoadMore}
              hasMore={hasMore}
              loader={<h4 className="text-center py-4">Chargement…</h4>}
              endMessage={null}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map(episode => (
                  <EpisodeCard
                    key={episode.id}
                    episode={episode}
                    onPlay={handlePlay}
                    onTagClick={toggleTag}
                    activeTagSet={activeTagSet}
                    hiddenTagSet={hiddenMoodTags}
                    onBeforeTagClick={handleClearMood}
                    onClearMood={handleClearMood}
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </section>
      )}

      {/* Playlists */}
      {activeTab === "playlists" && (
        <section>
          {loading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : filteredPlaylists.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucune émission trouvée.</p>
          ) : (
            <div className="grid grid-cols-1 justify-items-center sm:justify-items-stretch sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {playlistsToRender.map(pl => {
                const latestEpisode = pl.latestEpisode;
                const tags = (pl.tags ?? []).filter(tag => !hiddenMoodTags.has(normalizeText(tag)));
                const tagsKey = tags.map(tag => normalizeText(tag)).join("|");
                return (
                  <PlaylistCard
                    key={pl.id}
                    playlist={pl}
                    latestEpisode={latestEpisode}
                    tags={tags}
                    tagsKey={tagsKey}
                    activeTagSet={activeTagSet}
                    onPlay={handlePlay}
                    onTagClick={toggleTag}
                    onBeforeTagClick={handleClearMood}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

    </main>
  );
}
