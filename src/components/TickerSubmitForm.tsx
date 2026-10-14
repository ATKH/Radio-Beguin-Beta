'use client';

import { useState, type FormEvent } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlaylistLang } from '@/lib/playlistMeta';

const MAX_LEN = 60;

const TEXTS = {
  fr: {
    title: 'Un message à faire passer ?',
    intro:
      "Écris un petit mot. Une fois validé par l'équipe, il défilera dans la barre du site, avec les autres.",
    label: 'Ton message',
    placeholder: 'Un petit mot…',
    preview: 'Aperçu',
    send: 'Envoyer',
    sending: 'Envoi…',
    done: "Merci ! Ton message sera visible dès qu'il aura été validé par l'équipe.",
    again: 'Envoyer un autre message',
    rules: 'Entre 2 et 60 caractères. Les messages sont relus avant d’apparaître.',
    errors: {
      invalid: 'Ce message est trop court, trop long, ou contient des caractères non autorisés.',
      rate_limited: 'Tu as déjà envoyé plusieurs messages. Réessaie un peu plus tard.',
      full: 'Trop de messages en attente pour le moment. Réessaie plus tard.',
      generic: 'Une erreur est survenue. Réessaie dans un instant.',
    },
  },
  en: {
    title: 'A message for the bar',
    intro:
      'Write a short note. Once approved by the team, it will scroll across the bar of the site, along with the others.',
    label: 'Your message',
    placeholder: 'A little note…',
    preview: 'Preview',
    send: 'Send',
    sending: 'Sending…',
    done: 'Thank you! Your message will appear as soon as the team has approved it.',
    again: 'Send another message',
    rules: 'Between 2 and 60 characters. Messages are reviewed before they appear.',
    errors: {
      invalid: 'This message is too short, too long, or contains characters that are not allowed.',
      rate_limited: "You've already sent several messages. Please try again later.",
      full: 'Too many messages are waiting right now. Please try again later.',
      generic: 'Something went wrong. Please try again in a moment.',
    },
  },
} as const;

type ErrorKey = keyof (typeof TEXTS)['fr']['errors'];

export default function TickerSubmitForm() {
  const lang = usePlaylistLang();
  const txt = TEXTS[lang];

  const [text, setText] = useState('');
  const [website, setWebsite] = useState(''); // champ piège : doit rester vide
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<ErrorKey | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError(null);

    try {
      const res = await fetch('/api/ticker/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, website }),
      });
      if (res.ok) {
        setStatus('done');
        setText('');
        return;
      }
      const data = await res.json().catch(() => ({}));
      const key: ErrorKey =
        data?.error === 'invalid' || data?.error === 'rate_limited' || data?.error === 'full'
          ? data.error
          : 'generic';
      setError(key);
    } catch {
      setError('generic');
    }
    setStatus('idle');
  };

  if (status === 'done') {
    return (
      <div className="flex flex-col items-start gap-4">
        <Heart className="h-8 w-8" fill="currentColor" aria-hidden="true" />
        <p className="text-lg">{txt.done}</p>
        <Button type="button" variant="outline" onClick={() => setStatus('idle')}>
          {txt.again}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{txt.title}</h1>
      <p className="opacity-80">{txt.intro}</p>

      <label htmlFor="ticker-text" className="text-sm font-medium">
        {txt.label}
      </label>
      <input
        id="ticker-text"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_LEN}
        placeholder={txt.placeholder}
        required
        autoComplete="off"
        className="w-full rounded-md border border-[var(--primary)]/40 bg-transparent px-3 py-2 text-base"
      />
      <div className="flex justify-between text-xs opacity-70">
        <span>{txt.rules}</span>
        <span className="tabular-nums">
          {text.length}/{MAX_LEN}
        </span>
      </div>

      {/* Champ piège pour les robots : invisible pour les humains */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label htmlFor="ticker-website">Website</label>
        <input
          id="ticker-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide opacity-60">{txt.preview}</p>
        <p className="min-h-[1.5rem] text-sm font-semibold uppercase tracking-[0.25em]">
          {text.trim() || '…'}
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {txt.errors[error]}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={status === 'sending' || text.trim().length < 2}>
          {status === 'sending' ? txt.sending : txt.send}
        </Button>
      </div>
    </form>
  );
}