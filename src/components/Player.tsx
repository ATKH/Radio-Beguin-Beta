'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { Play, Pause, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/lib/PlayerContext';
import { useTheme } from '@/lib/ThemeContext';
import Hls from 'hls.js';
import AudioVisualizer from '@/components/ui/AudioVisualizer';
import { useLocale } from '@/lib/LocaleContext';
import type { PodcastEpisode } from '@/lib/podcasts';

const RADIO_STREAM_URL = 'https://play.radioking.io/radio-beguin-1/559828';
const TRACK_INFO_URL = '/api/live-track';
const PLAYBACK_STORAGE_KEY = 'radio-beguin:playback-state';
const USE_SOUNDCLOUD_EMBED = process.env.NEXT_PUBLIC_USE_SC_EMBED === 'true';

const buildLiveStreamUrl = () =>
  `${RADIO_STREAM_URL}${RADIO_STREAM_URL.includes('?') ? '&' : '?'}ts=${Date.now()}`;

type ResolvedStream = {
  url: string;
  protocol: NonNullable<PodcastEpisode["streamProtocol"]>;
};

const detectProtocol = (
  url: string,
  fallback?: PodcastEpisode["streamProtocol"]
): NonNullable<PodcastEpisode["streamProtocol"]> => {
  if (url.includes('.m3u8')) return 'hls';
  return fallback === 'hls' ? 'hls' : 'progressive';
};

async function resolveStreamSource(episode: PodcastEpisode): Promise<ResolvedStream | null> {
  if (!episode?.id) return null;
  const url = `/api/sc-play/${episode.id}?ts=${Date.now()}`;
  return { url, protocol: 'progressive' };
}

const isReloadNavigation = () => {
  if (typeof window === 'undefined') return false;
  const navEntries = typeof performance.getEntriesByType === 'function'
    ? performance.getEntriesByType('navigation')
    : [];
  if (navEntries && navEntries.length > 0) {
    const entry = navEntries[0] as PerformanceNavigationTiming;
    if (entry && 'type' in entry) {
      return entry.type === 'reload';
    }
  }
  const legacyNav = (performance as Performance & { navigation?: PerformanceNavigation }).navigation;
  if (legacyNav && typeof legacyNav.type === 'number' && typeof legacyNav.TYPE_RELOAD === 'number') {
    return legacyNav.type === legacyNav.TYPE_RELOAD;
  }
  return false;
};

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const { activePlayer, currentEpisode, setCurrentEpisode, playLive } = usePlayer();
  const { theme } = useTheme();
  const { t } = useLocale();
  const isDark = theme === 'dark';

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{ title: string; artist: string } | null>(null);
  const [clockTime, setClockTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const resumeIntentRef = useRef<{ shouldResume: boolean; target: 'live' | 'podcast' | null }>({
    shouldResume: false,
    target: null,
  });
  const initialEpisodeRef = useRef(true);
  const previousEpisodeIdRef = useRef<string | null>(null);
  const lastPlayRequestRef = useRef<number | null>(null);
  const playbackRestoredRef = useRef(false);
  const wasLivePlayingRef = useRef(false);

  const PLAYER_MIN_HEIGHT = 58;
  const HEADER_HEIGHT = 56;
  const LINE_HEIGHT = 2;

  // Horloge
  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Restaurer l'intention de lecture après navigation (live ou podcast)
  useEffect(() => {
    if (typeof window === 'undefined' || playbackRestoredRef.current) return;
    const isReload = isReloadNavigation();
    try {
      const raw = window.sessionStorage.getItem(PLAYBACK_STORAGE_KEY);
      if (raw && !isReload) {
        const parsed = JSON.parse(raw) as { isPlaying?: boolean; activePlayer?: 'live' | 'podcast' };
        if (parsed?.isPlaying && (parsed.activePlayer === 'live' || parsed.activePlayer === 'podcast')) {
          resumeIntentRef.current = { shouldResume: true, target: parsed.activePlayer };
        }
      }
    } catch {
      // ignore
    }
    playbackRestoredRef.current = true;
  }, []);

  // Sauvegarder l'état de lecture (permet de reprendre automatiquement)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(
        PLAYBACK_STORAGE_KEY,
        JSON.stringify({ isPlaying, activePlayer })
      );
    } catch {
      // ignore
    }
  }, [isPlaying, activePlayer]);
  useEffect(() => {
    if (activePlayer === 'live') {
      wasLivePlayingRef.current = isPlaying;
    } else {
      wasLivePlayingRef.current = false;
    }
  }, [activePlayer, isPlaying]);

  // Détecter les changements d'épisode pour relancer automatiquement la lecture
  useEffect(() => {
    const currentId = currentEpisode?.id ?? null;
    if (currentId && currentId !== previousEpisodeIdRef.current) {
      if (initialEpisodeRef.current) {
        initialEpisodeRef.current = false;
      } else {
        resumeIntentRef.current = { shouldResume: true, target: 'podcast' };
      }
    } else if (!currentId && initialEpisodeRef.current) {
      initialEpisodeRef.current = false;
    }
    previousEpisodeIdRef.current = currentId;
  }, [currentEpisode?.id]);

  // Infos morceau live
  useEffect(() => {
    if (activePlayer !== 'live') {
      setCurrentTrack(null);
      return;
    }

    const fetchTrackInfo = async () => {
      try {
        const res = await fetch(TRACK_INFO_URL);
        const data = await res.json();
        if (data) {
          const title = (data.title ?? '').trim();
          const artist = (data.artist ?? '').trim();

          if (title || artist) {
            setCurrentTrack({
              title: title || artist,
              artist: artist && title ? artist : artist && !title ? artist : '',
            });
            return;
          }
        } else {
          setCurrentTrack(null);
        }
      } catch {
        setCurrentTrack(null);
      }
    };

    fetchTrackInfo();
    const interval = setInterval(fetchTrackInfo, 15000);
    return () => clearInterval(interval);
  }, [activePlayer]);

  // Gestion audio (MP3 / HLS / Live)
  useEffect(() => {
    if (USE_SOUNDCLOUD_EMBED && activePlayer === 'podcast') return;
    if (!audioRef.current) return;
    const audio = audioRef.current;
    let hlsInstance: Hls | null = null;
    let cancelled = false;

    const cleanup = () => {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
    };

    const resetResumeIntent = () => {
      resumeIntentRef.current = { shouldResume: false, target: null };
    };

    cleanup();

    const setupPodcastPlayback = async () => {
      if (!currentEpisode) return;
      setCurrentPosition(0);
      setDuration(0);

      const resolved = await resolveStreamSource(currentEpisode);
      if (!resolved || cancelled) {
        console.warn('⚠️ Impossible de récupérer une URL de lecture pour', currentEpisode?.id);
        resetResumeIntent();
        setIsPlaying(false);
        return;
      }

      const { url, protocol } = resolved;
      const playRequestId =
        typeof currentEpisode.playRequestId === 'number' ? currentEpisode.playRequestId : null;
      const isManualRequest =
        playRequestId !== null && playRequestId !== lastPlayRequestRef.current;
      if (isManualRequest) {
        lastPlayRequestRef.current = playRequestId;
      }

      const shouldAutoPlay =
        isManualRequest ||
        (resumeIntentRef.current.shouldResume &&
          resumeIntentRef.current.target === 'podcast');

      const handleAutoPlay = (errorLabel: string) => {
        if (!shouldAutoPlay) {
          setIsPlaying(false);
          resetResumeIntent();
          return;
        }
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error(errorLabel, err);
            setIsPlaying(false);
          })
          .finally(() => {
            resetResumeIntent();
          });
      };

      if (protocol === 'hls') {
        if (Hls.isSupported()) {
          hlsInstance = new Hls();
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(audio);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) {
              handleAutoPlay('❌ Erreur lecture HLS:');
            }
          });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          audio.src = url;
          audio.load();
          handleAutoPlay('❌ Erreur lecture HLS (Safari):');
        } else {
          console.warn('⚠️ HLS non supporté dans ce navigateur');
          resetResumeIntent();
        }
      } else {
        audio.src = url;
        audio.load();
        handleAutoPlay('❌ Erreur lecture MP3:');
      }
    };

    if (activePlayer === 'podcast' && currentEpisode?.audioUrl) {
      setupPodcastPlayback();
      return () => {
        cancelled = true;
        cleanup();
      };
    }

    if (activePlayer === 'live') {
      audio.src = buildLiveStreamUrl();
      audio.load();
      setCurrentPosition(0);
      setDuration(0);

      const shouldAutoPlay =
        (resumeIntentRef.current.shouldResume && resumeIntentRef.current.target === 'live') ||
        wasLivePlayingRef.current;

      if (shouldAutoPlay) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error('⚠️ Erreur lecture live:', err);
            setIsPlaying(false);
          })
          .finally(() => {
            resetResumeIntent();
            wasLivePlayingRef.current = true;
          });
      } else {
        setIsPlaying(false);
        resetResumeIntent();
        wasLivePlayingRef.current = false;
      }

      return () => {
        cleanup();
      };
    }

    resetResumeIntent();

    return () => {
      cleanup();
    };
  }, [activePlayer, currentEpisode]);

  // Events audio
  useEffect(() => {
    if (USE_SOUNDCLOUD_EMBED && activePlayer === 'podcast') return;
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => setCurrentPosition(audio.currentTime);
    const onError = () => {
      if (!audio.src) return;
      const mediaError = audio.error;
      const details = mediaError
        ? { code: mediaError.code, message: mediaError.message, type: mediaError.constructor?.name }
        : null;
      console.warn('⚠️ Erreur audio', details, 'URL:', audio.src);
      setIsPlaying(false);
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
    };
  }, [activePlayer, currentEpisode]);

  const togglePlay = () => {
    if (USE_SOUNDCLOUD_EMBED && activePlayer === 'podcast') return;
    const audio = audioRef.current;
    if (!audio) return;

    if (activePlayer === 'live') {
      if (isPlaying) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        setIsPlaying(false);
      } else {
        audio.src = buildLiveStreamUrl();
        audio.load();
        audio
          .play()
          .then(() => setIsPlaying(true))
        .catch(err => console.warn('⚠️ Erreur lecture live:', err));
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn('⚠️ Erreur lecture:', err));
    }
  };

  const onSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentPosition(time);
  };

  const onClosePodcast = () => {
    playLive();
    setCurrentEpisode(null);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (!body) return;

    body.dataset.player = isPlaying ? 'playing' : 'idle';

    return () => {
      body.dataset.player = 'idle';
    };
  }, [isPlaying]);

  const containerTone = isDark
    ? 'bg-[var(--background)] text-[var(--foreground)] supports-[backdrop-filter]:bg-[var(--background)]/90'
    : 'bg-[var(--background)] text-[var(--foreground)] supports-[backdrop-filter]:bg-[var(--background)]/90';

  useEffect(() => {
    if (typeof window === "undefined") return;

    const computeOffset = () => {
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const offset = HEADER_HEIGHT + LINE_HEIGHT + rect.height;
      document.documentElement.style.setProperty("--player-offset", `${offset}px`);
    };

    const handleResize = () => computeOffset();

    computeOffset();
    window.addEventListener("resize", handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => computeOffset());
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      document.documentElement.style.removeProperty("--player-offset");
    };
  }, []);

  let innerContent: React.ReactNode;
  if (USE_SOUNDCLOUD_EMBED && activePlayer === 'podcast' && currentEpisode) {
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      currentEpisode.link
    )}&auto_play=true&visual=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&color=%232f1c17`;
    innerContent = (
      <div className="container mx-auto px-4 py-2 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={onClosePodcast}
            variant="outline"
            className={`flex items-center space-x-1 border-[var(--primary)]/30 ${
              isDark ? 'text-white hover:bg-white/10' : 'text-[var(--foreground)] hover:bg-[var(--primary)]/10'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">{t('player.backToLive')}</span>
          </Button>
        </div>

        <iframe
          key={currentEpisode.id}
          width="100%"
          height="110"
          allow="autoplay"
          allowFullScreen
          src={embedUrl}
          className="rounded-md border border-white/10"
        />
      </div>
    );
  } else {
    innerContent = (
      <>
        <audio ref={audioRef} preload="metadata" />
        {analyserRef.current && isPlaying ? <AudioVisualizer analyser={analyserRef.current} /> : null}

        <div className="container mx-auto px-4 py-2 flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-4 sm:justify-between">
          {activePlayer === 'live' ? (
          <div className="flex flex-wrap items-center gap-3 w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className={`rounded-full h-10 w-10 flex-shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isPlaying
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90'
                  : isDark
                    ? 'border border-white/15 bg-black text-white hover:bg-white/10'
                    : 'border border-primary/30 bg-[var(--white)] text-[var(--foreground)] hover:bg-[var(--primary)]/10'
              }`}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium">LIVE</span>
              <span className="text-xs opacity-60">|</span>
              <span className="text-xs opacity-70" suppressHydrationWarning>
                {clockTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex-1 min-w-[200px] overflow-hidden">
              <div className="animate-marquee whitespace-nowrap">
                {currentTrack ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {currentTrack.title}
                    </span>
                    {currentTrack.artist ? (
                      <>
                        <span className="text-sm opacity-60">•</span>
                        <span className="text-sm opacity-70">{currentTrack.artist}</span>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : currentEpisode ? (
          <div className="flex flex-col w-full gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                onClick={onClosePodcast}
                variant="outline"
                className={`flex items-center space-x-1 border-[var(--primary)]/30 ${
                  isDark ? 'text-white hover:bg-white/10' : 'text-[var(--foreground)] hover:bg-[var(--primary)]/10'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs">{t("player.backToLive")}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className={`text-xs px-2 py-1 ${isDark ? 'text-white hover:text-[var(--primary)]' : 'text-[var(--foreground)] hover:text-[var(--primary)]'}`}
                aria-label={t("player.soundcloud")}
              >
                <a href={currentEpisode.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span className="hidden sm:inline">{t("player.soundcloud")}</span>
                </a>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className={`rounded-full h-10 w-10 flex-shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  isPlaying
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90'
                    : isDark
                      ? 'border border-white/15 bg-black text-white hover:bg-white/10'
                      : 'border border-primary/30 bg-[var(--white)] text-[var(--foreground)] hover:bg-[var(--primary)]/10'
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>

              <div className="flex-1 min-w-[200px] overflow-hidden">
                <h3 className="text-sm font-medium truncate">{currentEpisode.title}</h3>
                <p className="text-xs opacity-70">
                  {new Date(currentEpisode.pubDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentPosition}
                onChange={onSeek}
                step={0.1}
                className="soundcloud-range flex-1"
                aria-label="Progression du podcast"
              />
              <div className="text-xs w-24 text-right tabular-nums opacity-70">
                {formatDuration(currentPosition)} / {formatDuration(duration)}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      </>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`sticky z-40 border-t backdrop-blur transition-colors border-transparent ${containerTone}`}
      style={{ top: HEADER_HEIGHT + LINE_HEIGHT, minHeight: `${PLAYER_MIN_HEIGHT}px` }}
    >
      {innerContent}
    </div>
  );
}

function formatDuration(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
