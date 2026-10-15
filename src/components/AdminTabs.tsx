"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  const { password, setPassword, expired } = useAdminPassword();
  const showPassword =
    tabs.find((t) => t.id === active)?.usesPassword !== false;
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

  return (
    <div>
      {showPassword && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded px-3 py-2 w-full max-w-xs"
            placeholder="Mot de passe admin"
            autoComplete="current-password"
          />
          {expired && (
            <p className="mt-2 text-sm text-red-600">
              Session expirée : saisis à nouveau le mot de passe.
            </p>
          )}
        </div>
      )}

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
      {tabs.map((tab) => (
        <section
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.content}
        </section>
      ))}
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