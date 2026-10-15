"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  // Mot de passe vérifié par le serveur ("" tant que personne n'est connecté)
  password: string;
  authenticated: boolean;
  expired: boolean;
  busy: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
};

const AdminPasswordContext = createContext<Ctx | null>(null);

// Au bout de ce délai sans activité, la session est fermée
const IDLE_MS = 10 * 60 * 1000;

export function AdminPasswordProvider({ children }: { children: ReactNode }) {
  // Uniquement en mémoire : recharger la page = se reconnecter
  const [password, setPassword] = useState("");
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticated = password !== "";

  useEffect(() => {
    if (!authenticated) return;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setPassword("");
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
  }, [authenticated]);

  const login = async (pw: string) => {
    setBusy(true);
    setError(null);
    setExpired(false);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        setPassword(pw);
        return true;
      }
      const data = await res.json().catch(() => ({}));
      setError(
        res.status === 401
          ? "Mot de passe incorrect."
          : data.error || "Erreur du serveur."
      );
      return false;
    } catch {
      setError("Connexion impossible.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    setPassword("");
    setExpired(false);
    setError(null);
  };

  return (
    <AdminPasswordContext.Provider
      value={{ password, authenticated, expired, busy, error, login, logout }}
    >
      {children}
    </AdminPasswordContext.Provider>
  );
}

export function useAdminPassword(): Ctx {
  const ctx = useContext(AdminPasswordContext);
  return (
    ctx ?? {
      password: "",
      authenticated: false,
      expired: false,
      busy: false,
      error: null,
      login: async () => false,
      logout: () => {},
    }
  );
}