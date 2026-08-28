// @ts-nocheck
"use client";

import { useState } from "react";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const PRESETS = [
  { key: "night", fr: "Playlist de la nuit", en: "Night time playlist" },
  { key: "ambient", fr: "Playlist méditative", en: "Meditative playlist" },
  { key: "morning", fr: "Playlist plutôt tranquille", en: "Rather calm playlist" },
  { key: "day", fr: "Playlist un peu moins tranquille", en: "Slightly less calm playlist" },
  { key: "evening", fr: "Playlist un peu plus club", en: "Club-oriented playlist" },
];

export default function AdminScheduleForm({ initialSchedule }) {
  const [password, setPassword] = useState("");
  const [schedule, setSchedule] = useState(initialSchedule);
  const [status, setStatus] = useState(null); // "saving" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const updateSlot = (day, index, field, value) => {
    setSchedule((prev) => {
      const daySlots = [...(prev[day] || [])];
      const slot = { ...daySlots[index] };
      if (field === "time") slot.time = value;
      if (field === "label") slot.label = value;
      if (field === "en") slot.translations = { ...slot.translations, en: value };
      if (field === "highlight") slot.highlight = value;
      if (field === "link") slot.link = value;
      daySlots[index] = slot;
      return { ...prev, [day]: daySlots };
    });
  };

  const applyPreset = (day, index, presetKey) => {
    if (!presetKey) return; // "Aucun / personnalisé" -> on ne touche à rien
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    setSchedule((prev) => {
      const daySlots = [...(prev[day] || [])];
      daySlots[index] = {
        ...daySlots[index],
        label: preset.fr,
        translations: { en: preset.en },
      };
      return { ...prev, [day]: daySlots };
    });
  };

  const addSlot = (day) => {
    setSchedule((prev) => {
      const daySlots = [...(prev[day] || [])];
      daySlots.push({ time: "00h", label: "", translations: { en: "" } });
      return { ...prev, [day]: daySlots };
    });
  };

  const removeSlot = (day, index) => {
    setSchedule((prev) => {
      const daySlots = [...(prev[day] || [])];
      daySlots.splice(index, 1);
      return { ...prev, [day]: daySlots };
    });
  };

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, schedule }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Erreur inconnue");
        return;
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg("Erreur réseau");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-xs"
          placeholder="Mot de passe admin"
        />
      </div>

      {DAYS.map((day) => (
        <div key={day} className="border rounded p-4">
          <h2 className="font-semibold mb-3">{day}</h2>
          <div className="space-y-3">
            {(schedule[day] || []).map((slot, index) => (
              <div key={index} className="border rounded p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={slot.time}
                    onChange={(e) => updateSlot(day, index, "time", e.target.value)}
                    className="border rounded px-2 py-1 w-16"
                    placeholder="00h"
                  />
                  <select
                    onChange={(e) => applyPreset(day, index, e.target.value)}
                    className="border rounded px-2 py-1"
                    defaultValue=""
                  >
                    <option value="">Aucun / personnalisé</option>
                    {PRESETS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.fr}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={slot.label}
                    onChange={(e) => updateSlot(day, index, "label", e.target.value)}
                    className="border rounded px-2 py-1 flex-1 min-w-[150px]"
                    placeholder="Label (fr)"
                  />
                  <input
                    type="text"
                    value={slot.translations?.en || ""}
                    onChange={(e) => updateSlot(day, index, "en", e.target.value)}
                    className="border rounded px-2 py-1 flex-1 min-w-[150px]"
                    placeholder="Label (en)"
                  />
                  <button
                    onClick={() => removeSlot(day, index)}
                    className="text-red-600 text-sm px-2"
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-1">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={!!slot.highlight}
                      onChange={(e) => updateSlot(day, index, "highlight", e.target.checked)}
                    />
                    Mettre en lien
                  </label>
                  {slot.highlight && (
                    <input
                      type="text"
                      value={slot.link || ""}
                      onChange={(e) => updateSlot(day, index, "link", e.target.value)}
                      className="border rounded px-2 py-1 flex-1 min-w-[220px] text-sm"
                      placeholder="https://... ou /shows/nom-de-l-emission"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => addSlot(day)}
            className="mt-3 text-sm text-blue-600"
            type="button"
          >
            + Ajouter un créneau
          </button>
        </div>
      ))}

      <div className="sticky bottom-4 bg-background pt-4">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
          type="button"
        >
          {status === "saving" ? "Enregistrement..." : "Enregistrer"}
        </button>
        {status === "success" && (
          <span className="ml-3 text-green-600">✓ Planning enregistré</span>
        )}
        {status === "error" && <span className="ml-3 text-red-600">Erreur : {errorMsg}</span>}
      </div>
    </div>
  );
}