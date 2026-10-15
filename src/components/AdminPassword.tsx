"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  password: string;
  setPassword: (value: string) => void;
  shared: boolean;
  expired: boolean;
};

const AdminPasswordContext = createContext<Ctx | null>(null);

// Au bout de ce délai sans activité, le mot de passe est effacé de la page
const IDLE_MS = 10 * 60 * 1000;

export function AdminPasswordProvider({ children }: { children: ReactNode }) {
  // Le mot de passe reste uniquement en mémoire : recharger la page = le ressaisir
  const [password, setPasswordState] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!password) return;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setPasswordState("");
        setExpired(true);
      }, IDLE_MS);
    };
    arm();
    const events = ["keydown", "pointerdown"];
    events.forEach((e) => window.addEventListener(e, arm));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [password]);

  const setPassword = (value: string) => {
    setExpired(false);
    setPasswordState(value);
  };

  return (
    <AdminPasswordContext.Provider
      value={{ password, setPassword, shared: true, expired }}
    >
      {children}
    </AdminPasswordContext.Provider>
  );
}

/**
 * Dans l'admin : renvoie le mot de passe partagé (shared = true).
 * Hors de l'admin : se comporte comme un useState local (shared = false).
 */
export function useAdminPassword(): Ctx {
  const ctx = useContext(AdminPasswordContext);
  const [local, setLocal] = useState("");
  return (
    ctx ?? {
      password: local,
      setPassword: setLocal,
      shared: false,
      expired: false,
    }
  );
}