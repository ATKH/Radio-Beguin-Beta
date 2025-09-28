'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/lib/PlayerContext';
import Hls from 'hls.js';

const RADIO_STREAM_URL = 'https://play.radioking.io/radio-beguin-1/559828';
const TRACK_INFO_URL = 'https://api.radioking.io/widget/radio/radio-beguin-1/track/current';

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { activePlayer, currentEpisode, setCurrentEpisode, playLive } = usePlayer();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{ title: string; artist: string } | null>(null);
  const [clockTime, setClockTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);

  const PLAYER_HEIGHT = 70;
  const HEADER_HEIGHT = 70;
  const LINE_HEIGHT = 2;

  // Horloge
  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
        if (data && data.title && data.artist) {
          setCurrentTrack({ title: data.title, artist: data.artist });
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
    if (!audioRef.current) return;
    const audio = audioRef.current;
    let hlsInstance: Hls | null = null;

    const cleanup = () => {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
    };

    if (activePlayer === 'podcast' && currentEpisode?.audioUrl) {
      const url = currentEpisode.audioUrl;
      setCurrentPosition(0);
      setDuration(0);

      if (currentEpisode.streamProtocol === 'hls') {
        // ✅ Lecture HLS via hls.js
        if (Hls.isSupported()) {
          hlsInstance = new Hls();
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(audio);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            audio
              .play()
              .then(() => setIsPlaying(true))
              .catch((err) => {
                console.error('❌ Erreur lecture HLS:', err);
                setIsPlaying(false);
              });
          });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          // ✅ Safari gère HLS nativement
          audio.src = url;
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.error('❌ Erreur lecture HLS (Safari):', err);
              setIsPlaying(false);
            });
        } else {
          console.warn('⚠️ HLS non supporté dans ce navigateur');
        }
      } else {
        // ✅ Lecture progressive (MP3)
        audio.src = url;
        audio.load();
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error('❌ Erreur lecture MP3:', err);
            setIsPlaying(false);
          });
      }
    }

    if (activePlayer === 'live') {
      audio.src = RADIO_STREAM_URL;
      audio.load();
      setCurrentPosition(0);
      setDuration(0);
      setIsPlaying(false); // pas d’autoplay
    }

    return () => {
      cleanup();
    };
  }, [activePlayer, currentEpisode]);

  // Events audio
  useEffect(() => {
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
    const audio = audioRef.current;
    if (!audio) return;

    if (activePlayer === 'live') {
      if (isPlaying) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        setIsPlaying(false);
      } else {
        audio.src = RADIO_STREAM_URL;
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

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentPosition(time);
  };

  const onClosePodcast = () => {
    playLive();
    setCurrentEpisode(null);
    setIsPlaying(false);
  };

  return (
    <div
      className="sticky z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ top: HEADER_HEIGHT + LINE_HEIGHT, height: PLAYER_HEIGHT }}
    >
      <audio ref={audioRef} preload="metadata" />

      <div className="container mx-auto px-4 py-3 flex items-center space-x-4">
        {activePlayer === 'live' ? (
          <>
            <Button size="sm" onClick={togglePlay} className="rounded-full h-10 w-10 flex-shrink-0">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-primary">LIVE</span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-xs text-muted-foreground">
                {clockTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap">
                {currentTrack ? (
                  <>
                    <span className="text-sm font-medium">{currentTrack.title}</span>
                    <span className="text-sm text-muted-foreground mx-2">•</span>
                    <span className="text-sm text-muted-foreground">{currentTrack.artist}</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium">Radio Béguin</span>
                    <span className="text-sm text-muted-foreground mx-2">•</span>
                    <span className="text-sm text-muted-foreground">Découverte musicale en continu</span>
                  </>
                )}
              </div>
            </div>
          </>
        ) : currentEpisode ? (
          <>
            <Button size="sm" onClick={onClosePodcast} variant="outline" className="flex items-center space-x-1">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs">Retour Live</span>
            </Button>

            <Button size="sm" onClick={togglePlay} className="rounded-full h-10 w-10 flex-shrink-0">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>

            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="text-sm font-medium truncate">{currentEpisode.title}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(currentEpisode.pubDate).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <Button variant="ghost" size="sm" asChild className="text-xs">
              <a href={currentEpisode.link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1">
                <ExternalLink className="h-3 w-3" />
                <span>SoundCloud</span>
              </a>
            </Button>

            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentPosition}
              onChange={onSeek}
              step={0.1}
              className="flex-1 soundcloud-range"
              aria-label="Progression du podcast"
            />
            <div className="text-xs w-20 text-right tabular-nums">
              {formatDuration(currentPosition)} / {formatDuration(duration)}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
