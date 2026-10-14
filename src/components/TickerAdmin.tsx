'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';

type Item = {
  id: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  moderatedAt?: number;
};

type Action = 'approve' | 'reject' | 'delete';

const PASSWORD_KEY = 'ticker-admin-password';

export default function TickerAdmin() {
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (pw: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ticker/admin', {
        headers: { Authorization: `Bearer ${pw}` },
        cache: 'no-store',
      });
      if (res.status === 401) {
        sessionStorage.removeItem(PASSWORD_KEY);
        setItems(null);
        setError('Mot de passe incorrect.');
        return;
      }
      if (!res.ok) {
        setError('Erreur du serveur (le stockage est-il configuré ?).');
        return;
      }
      sessionStorage.setItem(PASSWORD_KEY, pw);
      setItems((await res.json()) as Item[]);
    } catch {
      setError('Connexion impossible.');
    } finally {
      setBusy(false);
    }
  }, []);

  // Si le mot de passe a déjà été saisi pendant cette session, on se reconnecte directement
  useEffect(() => {
    const saved = sessionStorage.getItem(PASSWORD_KEY);
    if (saved) {
      setPassword(saved);
      void load(saved);
    }
  }, [load]);

  const onLogin = (e: FormEvent) => {
    e.preventDefault();
    void load(password);
  };

  const act = async (id: string, action: Action) => {
    setBusy(true);
    try {
      await fetch('/api/ticker/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ id, action }),
      });
    } finally {
      await load(password);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(PASSWORD_KEY);
    setItems(null);
    setPassword('');
  };

  // --- Connexion ----------------------------------------------------------
  if (!items) {
    return (
      <form onSubmit={onLogin} className="flex max-w-sm flex-col gap-3">
        <h1 className="text-2xl font-semibold">Modération de la barre</h1>
        <label htmlFor="admin-password" className="text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="rounded-md border border-[var(--primary)]/40 bg-transparent px-3 py-2"
        />
        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={busy || !password}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </Button>
        </div>
      </form>
    );
  }

  // --- Liste --------------------------------------------------------------
  const pending = items.filter((m) => m.status === 'pending').sort((a, b) => b.createdAt - a.createdAt);
  const approved = items
    .filter((m) => m.status === 'approved')
    .sort((a, b) => (b.moderatedAt ?? 0) - (a.moderatedAt ?? 0));
  const rejected = items
    .filter((m) => m.status === 'rejected')
    .sort((a, b) => (b.moderatedAt ?? 0) - (a.moderatedAt ?? 0));

  const row = (m: Item, actions: { label: string; action: Action }[]) => (
    <li
      key={m.id}
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--primary)]/15 py-3"
    >
      <div className="min-w-0">
        <p className="break-words font-semibold uppercase tracking-[0.15em]">{m.text}</p>
        <p className="text-xs opacity-60">{new Date(m.createdAt).toLocaleString('fr-FR')}</p>
      </div>
      <div className="flex gap-2">
        {actions.map(({ label, action }) => (
          <Button
            key={action}
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void act(m.id, action)}
          >
            {label}
          </Button>
        ))}
      </div>
    </li>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Modération de la barre</h1>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void load(password)}>
            Actualiser
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={logout}>
            Déconnexion
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <section>
        <h2 className="mb-2 text-lg font-semibold">En attente ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm opacity-70">Aucun message à valider.</p>
        ) : (
          <ul>
            {pending.map((m) =>
              row(m, [
                { label: 'Valider', action: 'approve' },
                { label: 'Refuser', action: 'reject' },
              ])
            )}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Dans la barre ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="text-sm opacity-70">Aucun message validé.</p>
        ) : (
          <ul>
            {approved.map((m) =>
              row(m, [
                { label: 'Retirer', action: 'reject' },
                { label: 'Supprimer', action: 'delete' },
              ])
            )}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Refusés ({rejected.length})</h2>
        {rejected.length === 0 ? (
          <p className="text-sm opacity-70">Aucun message refusé.</p>
        ) : (
          <ul>
            {rejected.map((m) =>
              row(m, [
                { label: 'Valider', action: 'approve' },
                { label: 'Supprimer', action: 'delete' },
              ])
            )}
          </ul>
        )}
      </section>
    </div>
  );
}