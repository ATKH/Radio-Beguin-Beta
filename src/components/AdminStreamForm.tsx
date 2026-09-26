"use client";

import { useState } from "react";

type StreamSource = "main" | "backup";

const OPTIONS: { value: StreamSource; label: string }[] = [
  { value: "main", label: "Radio Béguin (stream.radiobeguin.com)" },
  { value: "backup", label: "Backup (studio.ondezero.net)" },
];

export default function AdminStreamForm({ initialSource }: { initialSource: StreamSource }) {
  const [source, setSource] = useState<StreamSource>(initialSource);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = async (value: StreamSource) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stream-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, source: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec de la mise à jour");
      }

      setSource(value);
      setMessage("Flux mis à jour ✅");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur ❌");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe admin"
        className="border rounded px-3 py-2 max-w-xs"
      />

      {OPTIONS.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="stream-source"
            checked={source === opt.value}
            disabled={saving || !password}
            onChange={() => handleChange(opt.value)}
          />
          <span>{opt.label}</span>
        </label>
      ))}

      {message && <p className="text-sm opacity-70">{message}</p>}
    </div>
  );
}