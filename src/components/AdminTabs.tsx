"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  AdminPasswordProvider,
  useAdminPassword,
} from "@/components/AdminPassword";

type Tab = {
  id: string;
  label: string;
  content: ReactNode;
  // false = l'onglet gère lui-même son authentification (ex: Ticker)
  usesPassword?: boolean;
};

function AdminTabsInner({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const [input, setInput] = useState("");
  const { authenticated, expired, busy, error, login, logout } =
    useAdminPassword();
  const showLogin = tabs.find((t) => t.id === active)?.usesPassword !== false;
  const ids = tabs.map((t) => t.id).join(",");

  // Ouvre directement le bon onglet si l'URL contient un hash (ex: /admin#news)
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (id && ids.split(",").includes(id)) setActive(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [ids]);

  const select = (id: string) => {
    setActive(id);
    try {
      window.history.replaceState(null, "", `#${id}`);
    } catch {}
  };

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(input);
    if (ok) setInput("");
  };

  return (
    <div>
      {showLogin &&
        (authenticated ? (
          <div className="mb-6 flex items-center gap-3 text-sm">
            <span className="text-green-600">✓ Connecté</span>
            <button
              type="button"
              onClick={logout}
              className="border rounded px-3 py-1"
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          <form onSubmit={onLogin} className="mb-6 max-w-xs space-y-2">
            <label
              htmlFor="admin-shared-password"
              className="block text-sm font-medium"
            >
              Mot de passe
            </label>
            <input
              id="admin-shared-password"
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="border rounded px-3 py-2 w-full"
              placeholder="Mot de passe admin"
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={busy || !input}
              className="bg-foreground text-background px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {busy ? "Connexion…" : "Se connecter"}
            </button>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {expired && !error && (
              <p className="text-sm text-red-600">
                Session expirée : reconnecte-toi.
              </p>
            )}
            {!error && !expired && (
              <p className="text-sm opacity-70">
                Connecte-toi pour pouvoir modifier ces sections.
              </p>
            )}
          </form>
        ))}

      <div
        role="tablist"
        aria-label="Sections d'administration"
        className="flex flex-wrap gap-1 border-b border-foreground/20 mb-8"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => select(tab.id)}
              className={
                "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors " +
                (isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-foreground/60 hover:text-foreground")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tous les panneaux restent montés (juste masqués) :
          on ne perd donc pas ce qui a été saisi en changeant d'onglet. */}
      {tabs.map((tab) => {
        const locked = tab.usesPassword !== false && !authenticated;
        return (
          <section
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={tab.id !== active}
          >
            {/* Non connecté : tous les champs et boutons du panneau sont désactivés */}
            <fieldset
              disabled={locked}
              className={"min-w-0 transition-opacity " + (locked ? "opacity-50" : "")}
            >
              {tab.content}
            </fieldset>
          </section>
        );
      })}
    </div>
  );
}

export default function AdminTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <AdminPasswordProvider>
      <AdminTabsInner tabs={tabs} />
    </AdminPasswordProvider>
  );
}