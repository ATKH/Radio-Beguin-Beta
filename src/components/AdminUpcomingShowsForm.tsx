// @ts-nocheck
"use client";

import { useState } from "react";

const makeId = () => Math.random().toString(36).slice(2, 10);

const emptyShow = () => ({
  id: makeId(),
  mode: "playlist",
  playlistId: "",
  title: "",
  image: "",
  link: "",
  date: "",
  time: "",
  tagsText: "",
});

export default function AdminUpcomingShowsForm({ initialShows, playlists }) {
  const [password, setPassword] = useState("");
  const [shows, setShows] = useState(() =>
    (initialShows || []).map((s) => ({ ...s, tagsText: (s.tags || []).join(", ") }))
  );
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const updateShow = (index, field, value) => {
    setShows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const applyPlaylist = (index, playlistId) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    setShows((prev) => {
      const next = [...prev];
      const show = { ...next[index] };
      show.playlistId = playlistId;
      if (playlist) {
        show.title = playlist.title;
        show.image = playlist.artworkUrl || "";
        show.link = `/shows/playlist/${playlist.id}`;
        if (!show.tagsText && playlist.tags && playlist.tags.length) {
          show.tagsText = playlist.tags.join(", ");
        }
      }
      next[index] = show;
      return next;
    });
  };

  const setMode = (index, mode) => {
    setShows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], mode };
      return next;
    });
  };

  const addShow = () => {
    setShows((prev) => [...prev, emptyShow()]);
  };

  const removeShow = (index) => {
    setShows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      const cleanShows = shows.map(({ tagsText, ...rest }) => ({
        ...rest,
        tags: (tagsText || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }));
      const res = await fetch("/api/upcoming-shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, shows: cleanShows }),
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

      <div className="space-y-6">
        {shows.map((show, index) => (
          <div key={show.id} className="border rounded p-4 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode(index, "playlist")}
                className={`text-xs px-3 py-1 rounded-full border ${
                  show.mode === "playlist" ? "bg-black text-white" : ""
                }`}
              >
                Émission existante
              </button>
              <button
                type="button"
                onClick={() => setMode(index, "manual")}
                className={`text-xs px-3 py-1 rounded-full border ${
                  show.mode === "manual" ? "bg-black text-white" : ""
                }`}
              >
                Manuel
              </button>
            </div>

            {show.mode === "playlist" ? (
              <div>
                <label className="block text-xs font-medium mb-1">Émission</label>
                <select
                  value={show.playlistId || ""}
                  onChange={(e) => applyPlaylist(index, e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">Choisir une émission...</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                {show.title && (
                  <p className="text-xs text-foreground/50 mt-1">
                    Sélectionné : {show.title}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Titre</label>
                  <input
                    type="text"
                    value={show.title}
                    onChange={(e) => updateShow(index, "title", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Titre de l'émission"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">URL de l'image</label>
                  <input
                    type="text"
                    value={show.image}
                    onChange={(e) => updateShow(index, "image", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Lien (optionnel)
                  </label>
                  <input
                    type="text"
                    value={show.link}
                    onChange={(e) => updateShow(index, "link", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1">
                Styles (séparés par une virgule)
              </label>
              <input
                type="text"
                value={show.tagsText || ""}
                onChange={(e) => updateShow(index, "tagsText", e.target.value)}
                className="border rounded px-2 py-1 w-full"
                placeholder="techno, house, dub"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={show.date}
                  onChange={(e) => updateShow(index, "date", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Heure</label>
                <input
                  type="text"
                  value={show.time}
                  onChange={(e) => updateShow(index, "time", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="20h"
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <button
                type="button"
                onClick={() => removeShow(index)}
                className="text-red-600 text-sm font-medium"
              >
                Supprimer ce créneau
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addShow}
        className="text-sm text-blue-600 font-medium"
      >
        + Ajouter une émission à venir
      </button>

      <div className="sticky bottom-4 bg-background pt-4">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
          type="button"
        >
          {status === "saving" ? "Enregistrement..." : "Enregistrer les émissions"}
        </button>
        {status === "success" && (
          <span className="ml-3 text-green-600">✓ Émissions enregistrées</span>
        )}
        {status === "error" && <span className="ml-3 text-red-600">Erreur : {errorMsg}</span>}
      </div>
    </div>
  );
}
