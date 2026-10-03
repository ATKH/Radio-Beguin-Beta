'use client';

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Pause, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/lib/PlayerContext';
import { useTheme } from '@/lib/ThemeContext';
import Hls from 'hls.js';
import AudioVisualizer from '@/components/ui/AudioVisualizer';
import { useLocale } from '@/lib/LocaleContext';
import type { PodcastEpisode } from '@/lib/podcasts';
import PlaylistMenu, { PlaylistIcon } from '@/components/PlaylistMenu';
import { getOnDemandMeta, getPlaylistName, nextEpisode, peekNext } from '@/lib/onDemandQueue';
import { playlistLabel, usePlaylistLang } from '@/lib/playlistMeta';

const DEFAULT_RADIO_STREAM_URL = 'https://stream.radiobeguin.com/listen/radio_b%C3%A9guin/radio.mp3';
const RADIO_STREAM_AAC_URL: string | null = null;
const RADIO_STREAM_HLS_URL = null;
const TRACK_INFO_URL = '/api/live-track';
const PLAYBACK_STORAGE_KEY = 'radio-beguin:playback-state';
const USE_SOUNDCLOUD_EMBED = process.env.NEXT_PUBLIC_USE_SC_EMBED === 'true';

// Taille de l'image externe à gauche du widget SoundCloud (= hauteur de l'iframe)
const SC_WIDGET_HEIGHT = 120;
// Si SoundCloud ignore show_artwork=false, mets ici la largeur (en px) de sa pochette (ex: 120)
// pour la rogner. Laisser à 0 tant que show_artwork=false fonctionne.
const SC_ARTWORK_CROP_PX = 0;

// Page de l'épisode sur le site
const getEpisodePageUrl = (episode: PodcastEpisode) => `/shows/${episode.id}`;

const buildLiveStreamUrl = (baseUrl: string) =>
  `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}ts=${Date.now()}`;

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
  // Épisodes à la demande AzuraCast : l'URL audio est directe
  if (episode.id.startsWith('az:')) return { url: episode.audioUrl, protocol: 'progressive' };
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
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const { activePlayer, currentEpisode, setCurrentEpisode, playLive } = usePlayer();
  const { theme } = useTheme();
  const { t } = useLocale();
  const lang = usePlaylistLang();
  const isDark = theme === 'dark';
  // Épisode issu des playlists AzuraCast (jamais affiché dans le widget SoundCloud)
  const isOnDemand = !!currentEpisode?.id?.startsWith('az:');
  const showScEmbed = USE_SOUNDCLOUD_EMBED && activePlayer === 'podcast' && !isOnDemand;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{ title: string; artist: string } | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [liveStreamUrl, setLiveStreamUrl] = useState(DEFAULT_RADIO_STREAM_URL);
  const resumeIntentRef = useRef<{ shouldResume: boolean; target: 'live' | 'podcast' | null }>({
    shouldResume: false,
    target: null,
  });
  const initialEpisodeRef = useRef(true);
  const previousEpisodeIdRef = useRef<string | null>(null);
  const lastPlayRequestRef = useRef<number | null>(null);
  const playbackRestoredRef = useRef(false);
  const wasLivePlayingRef = useRef(false);
  const lastLiveUrlRef = useRef<string | null>(null);
  const lastLiveBaseUrlRef = useRef<string | null>(null);
  const lastLivePauseAtRef = useRef<number | null>(null);

  const failedSkipsRef = useRef(0);
  const resumeAttemptsRef = useRef(0);
  const resumePositionRef = useRef(0);

  // Annule le téléchargement du titre suivant s'il est en cours (changement de playlist, retour au direct)
  const abortPreload = () => {
    const p = preloadRef.current;
    if (p && p.getAttribute('src')) {
      p.removeAttribute('src');
      p.load();
    }
  };

  // Playlist à la demande : si un titre est illisible, on passe au suivant (3 essais d'affilée maximum)
  const skipBrokenTrack = (episodeId: string) => {
    failedSkipsRef.current += 1;
    if (failedSkipsRef.current > 3) {
      failedSkipsRef.current = 0;
      return;
    }
    const next = nextEpisode(episodeId);
    if (next) setCurrentEpisode(next);
  };

  // Playlist à la demande : si la lecture se coupe en cours de route (connexion qui lâche),
  // on recharge le même fichier et on reprend à la même seconde (2 essais max).
  // On ne passe au titre suivant que si la reprise échoue ou si le titre n'a jamais démarré.
  const handleOnDemandFailure = (audio: HTMLAudioElement, episodeId: string) => {
    const position = audio.currentTime;
    if (position > 2 && resumeAttemptsRef.current < 2) {
      resumeAttemptsRef.current += 1;
      resumePositionRef.current = position;
      audio.addEventListener(
        'loadedmetadata',
        () => {
          audio.currentTime = position;
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        },
        { once: true }
      );
      audio.load();
      return;
    }
    resumeAttemptsRef.current = 0;
    skipBrokenTrack(episodeId);
  };

  const getLiveUrl = useCallback(() => {
    return buildLiveStreamUrl(liveStreamUrl);
  }, [liveStreamUrl]);

  const PLAYER_MIN_HEIGHT = 58;

  // Titre et artiste affichés dans la barre : ceux du direct, ou de la playlist en cours
  const onDemandMeta = isOnDemand ? getOnDemandMeta(currentEpisode) : null;
  const displayTrack = onDemandMeta
    ? { title: onDemandMeta.trackTitle, artist: onDemandMeta.artist }
    : currentTrack;
  const HEADER_HEIGHT = 56;
  const LINE_HEIGHT = 2;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stream-config')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.url) {
          setLiveStreamUrl(data.url);
        }
      })
      .catch((err) => console.warn('⚠️ Impossible de récupérer la config du flux:', err));
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (showScEmbed) return;
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

    if (activePlayer === 'live') {
      const liveUrl = getLiveUrl();
      const shouldSwitch = !audio.src || lastLiveBaseUrlRef.current !== liveStreamUrl;
      if (shouldSwitch) {
        lastLiveBaseUrlRef.current = liveStreamUrl;
        lastLiveUrlRef.current = liveUrl;
        audio.src = liveUrl;
        audio.load();
      }
    }

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
      // Le lecteur n'est plus sur le flux direct : force son rechargement au retour en live
      lastLiveBaseUrlRef.current = null;
      resumeAttemptsRef.current = 0;
      // Si on lance autre chose que le titre préchargé, on annule ce téléchargement
      if (preloadRef.current && preloadRef.current.src !== url) abortPreload();
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
            // Annulation normale quand on change de titre : rien à signaler
            if (err?.name === 'AbortError') return;
            console.error(errorLabel, err, 'URL:', url);
            setIsPlaying(false);
            if (err?.name === 'NotSupportedError' && currentEpisode.id.startsWith('az:')) {
              skipBrokenTrack(currentEpisode.id);
            }
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
      const liveUrl = getLiveUrl();
      if (!audio.src || lastLiveBaseUrlRef.current !== liveStreamUrl) {
        lastLiveBaseUrlRef.current = liveStreamUrl;
        lastLiveUrlRef.current = liveUrl;
        audio.src = liveUrl;
      }
      audio.load();
      setCurrentPosition(0);
      setDuration(0);

      const shouldAutoPlay =
        (resumeIntentRef.current.shouldResume && resumeIntentRef.current.target === 'live') ||
        wasLivePlayingRef.current;

      setIsPlaying(false);
      resetResumeIntent();
      wasLivePlayingRef.current = false;

      return () => {
        cleanup();
      };
    }

    resetResumeIntent();

    return () => {
      cleanup();
    };
  }, [activePlayer, currentEpisode, liveStreamUrl]);

  useEffect(() => {
    if (showScEmbed) return;
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => {
      setCurrentPosition(audio.currentTime);
      // Après une reprise, si la lecture avance bien pendant 30 s, on repart à zéro :
      // un fichier d'une heure peut ainsi être repris plusieurs fois sans être abandonné
      if (resumeAttemptsRef.current > 0 && audio.currentTime - resumePositionRef.current > 30) {
        resumeAttemptsRef.current = 0;
      }
      // Playlist à la demande : on ne précharge le titre suivant que dans les 45 dernières secondes
      if (
        currentEpisode?.id?.startsWith('az:') &&
        Number.isFinite(audio.duration) &&
        audio.duration - audio.currentTime < 45
      ) {
        const nxt = peekNext(currentEpisode.id);
        if (nxt) {
          preloadRef.current ??= new Audio();
          preloadRef.current.preload = 'auto';
          if (preloadRef.current.src !== nxt.audioUrl) preloadRef.current.src = nxt.audioUrl;
        }
      }
    };
    const onError = () => {
      if (!audio.src) return;
      const mediaError = audio.error;
      const details = mediaError
        ? { code: mediaError.code, message: mediaError.message, type: mediaError.constructor?.name }
        : null;
      console.warn('⚠️ Erreur audio', details, 'URL:', audio.src, {
        currentTime: audio.currentTime,
        duration: audio.duration,
        networkState: audio.networkState,
      });
      setIsPlaying(false);
      setIsBuffering(false);
      if (currentEpisode?.id?.startsWith('az:') && mediaError && mediaError.code !== 1) {
        handleOnDemandFailure(audio, currentEpisode.id);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      // Playlist à la demande : on enchaîne automatiquement sur le titre suivant
      if (currentEpisode?.id?.startsWith('az:')) {
        // Fin anormale (le flux s'arrête bien avant la durée annoncée) : on tente de reprendre
        if (Number.isFinite(audio.duration) && audio.duration - audio.currentTime > 10) {
          console.warn('⚠️ Lecture interrompue avant la fin', {
            currentTime: audio.currentTime,
            duration: audio.duration,
          });
          handleOnDemandFailure(audio, currentEpisode.id);
          return;
        }
        const next = nextEpisode(currentEpisode.id);
        if (next) setCurrentEpisode(next);
      }
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      failedSkipsRef.current = 0;
    };
    const onCanPlay = () => setIsBuffering(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [activePlayer, currentEpisode]);

  const togglePlay = () => {
    if (showScEmbed) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (activePlayer === 'live') {
      if (isPlaying) {
        audio.pause();
        lastLivePauseAtRef.current = Date.now();
        setIsPlaying(false);
        setIsBuffering(false);
      } else {
        setIsBuffering(true);
        const pausedAt = lastLivePauseAtRef.current;
        const shouldRefresh = pausedAt ? Date.now() - pausedAt > 10000 : false;
        if (!audio.src || shouldRefresh) {
          const liveUrl = getLiveUrl();
          lastLiveUrlRef.current = liveUrl;
          audio.src = liveUrl;
        }
        audio.muted = false;
        audio.load();
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.warn('⚠️ Erreur lecture live:', err);
            setIsBuffering(false);
          });
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
    abortPreload();
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
  if (showScEmbed && currentEpisode) {
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      currentEpisode.link
    )}&auto_play=true&visual=false&show_artwork=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&color=%232f1c17`;
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

        <div className="flex items-center gap-3">
          <Link
            href={getEpisodePageUrl(currentEpisode)}
            aria-label={currentEpisode.title}
            className="flex-shrink-0 rounded-md transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <img
              src={currentEpisode.artworkUrl}
              alt=""
              style={{ width: SC_WIDGET_HEIGHT, height: SC_WIDGET_HEIGHT }}
              className="rounded-md object-cover block"
            />
          </Link>
          <div className="flex-1 rounded-md overflow-hidden">
            <iframe
              key={currentEpisode.id}
              height={SC_WIDGET_HEIGHT}
              allow="autoplay"
              allowFullScreen
              src={embedUrl}
              className="border-0 block max-w-none"
              style={{
                width: `calc(100% + ${SC_ARTWORK_CROP_PX}px)`,
                marginLeft: `-${SC_ARTWORK_CROP_PX}px`,
              }}
            />
          </div>
        </div>
      </div>
    );
  } else {
    innerContent = (
      <>
        <audio ref={audioRef} preload="auto" />
        {analyserRef.current && isPlaying ? <AudioVisualizer analyser={analyserRef.current} /> : null}

        <div className="container mx-auto px-4 py-2 flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-4 sm:justify-between">
          {activePlayer === 'live' || isOnDemand ? (
            <div className="flex flex-wrap items-center gap-3 w-full">
              {isOnDemand && (
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
              )}

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
                ) : isBuffering ? (
                  <span
                    className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>

              {isOnDemand ? (
                <PlaylistMenu>
                  <PlaylistIcon key={getPlaylistName()} name={getPlaylistName()} size={24} />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {playlistLabel(getPlaylistName(), lang)}
                  </span>
                </PlaylistMenu>
              ) : (
                <PlaylistMenu>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium">LIVE</span>
                </PlaylistMenu>
              )}

              <div className="flex-1 min-w-[200px] overflow-hidden">
                <div className="animate-marquee whitespace-nowrap">
                  {displayTrack ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {displayTrack.title}
                      </span>
                      {displayTrack.artist ? (
                        <>
                          <span className="text-sm opacity-60">•</span>
                          <span className="text-sm opacity-70">{displayTrack.artist}</span>
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

                {!isOnDemand && (
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
                )}

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