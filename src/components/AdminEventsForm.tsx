// @ts-nocheck
"use client";

import { useState } from "react";

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const makeId = () => Math.random().toString(36).slice(2, 10);

const emptyEvent = () => ({
  id: makeId(),
  slug: "",
  title: "",
  titleEn: "",
  date: "",
  time: "",
  shortDescription: "",
  shortDescriptionEn: "",
  fullDescription: "",
  fullDescriptionEn: "",
  image: "",
  links: [],
});

export default function AdminEventsForm({ initialEvents }) {
  const [password, setPassword] = useState("");
  const [events, setEvents] = useState(initialEvents || []);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const updateEvent = (index, field, value) => {
    setEvents((prev) => {
      const next = [...prev];
      const ev = { ...next[index] };
      ev[field] = value;
      if (field === "title" && !ev.slugTouched) {
        ev.slug = slugify(value);
      }
      next[index] = ev;
      return next;
    });
  };

  const updateSlugManually = (index, value) => {
    setEvents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], slug: slugify(value), slugTouched: true };
      return next;
    });
  };

  const addEvent = () => {
    setEvents((prev) => [...prev, emptyEvent()]);
  };

  const removeEvent = (index) => {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const addLink = (index) => {
    setEvents((prev) => {
      const next = [...prev];
      const ev = { ...next[index] };
      ev.links = [...(ev.links || []), { label: "", url: "" }];
      next[index] = ev;
      return next;
    });
  };

  const updateLink = (eventIndex, linkIndex, field, value) => {
    setEvents((prev) => {
      const next = [...prev];
      const ev = { ...next[eventIndex] };
      const links = [...(ev.links || [])];
      links[linkIndex] = { ...links[linkIndex], [field]: value };
      ev.links = links;
      next[eventIndex] = ev;
      return next;
    });
  };

  const removeLink = (eventIndex, linkIndex) => {
    setEvents((prev) => {
      const next = [...prev];
      const ev = { ...next[eventIndex] };
      ev.links = (ev.links || []).filter((_, i) => i !== linkIndex);
      next[eventIndex] = ev;
      return next;
    });
  };

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      const cleanEvents = events.map(({ slugTouched, ...rest }) => rest);
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, events: cleanEvents }),
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
        {events.map((event, index) => (
          <div key={event.id} className="border rounded p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={event.title}
                  onChange={(e) => updateEvent(index, "title", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Titre de l'événement"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Titre (EN, optionnel)
                </label>
                <input
                  type="text"
                  value={event.titleEn || ""}
                  onChange={(e) => updateEvent(index, "titleEn", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="English title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Slug (URL : /events/...)
                </label>
                <input
                  type="text"
                  value={event.slug}
                  onChange={(e) => updateSlugManually(index, e.target.value)}
                  className="border rounded px-2 py-1 w-full font-mono text-sm"
                  placeholder="mon-evenement"
                />
              </div>
              <div />
              <div>
                <label className="block text-xs font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={event.date}
                  onChange={(e) => updateEvent(index, "date", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Heure (optionnel)</label>
                <input
                  type="text"
                  value={event.time}
                  onChange={(e) => updateEvent(index, "time", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="20h"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                URL de l'image
              </label>
              <input
                type="text"
                value={event.image}
                onChange={(e) => updateEvent(index, "image", e.target.value)}
                className="border rounded px-2 py-1 w-full"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Description succincte (listes)
                </label>
                <input
                  type="text"
                  value={event.shortDescription}
                  onChange={(e) => updateEvent(index, "shortDescription", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Une phrase courte"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Description succincte (EN, optionnel)
                </label>
                <input
                  type="text"
                  value={event.shortDescriptionEn || ""}
                  onChange={(e) => updateEvent(index, "shortDescriptionEn", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Short sentence"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Description complète (page dédiée)
                </label>
                <textarea
                  value={event.fullDescription}
                  onChange={(e) => updateEvent(index, "fullDescription", e.target.value)}
                  className="border rounded px-2 py-1 w-full min-h-[100px]"
                  placeholder="Description détaillée de l'événement"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Description complète (EN, optionnel)
                </label>
                <textarea
                  value={event.fullDescriptionEn || ""}
                  onChange={(e) => updateEvent(index, "fullDescriptionEn", e.target.value)}
                  className="border rounded px-2 py-1 w-full min-h-[100px]"
                  placeholder="Detailed description"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2">
                Liens utiles (optionnel)
              </label>
              <div className="space-y-2">
                {(event.links || []).map((link, linkIndex) => (
                  <div key={linkIndex} className="flex flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(index, linkIndex, "label", e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-32"
                      placeholder="Billetterie"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateLink(index, linkIndex, "url", e.target.value)}
                      className="border rounded px-2 py-1 text-sm flex-1 min-w-[180px]"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(index, linkIndex)}
                      className="text-red-600 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addLink(index)}
                className="mt-2 text-sm text-blue-600"
              >
                + Ajouter un lien
              </button>
            </div>

            <div className="pt-2 border-t">
              <button
                type="button"
                onClick={() => removeEvent(index)}
                className="text-red-600 text-sm font-medium"
              >
                Supprimer cet événement
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEvent}
        className="text-sm text-blue-600 font-medium"
      >
        + Ajouter un événement
      </button>

      <div className="sticky bottom-4 bg-background pt-4">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
          type="button"
        >
          {status === "saving" ? "Enregistrement..." : "Enregistrer les événements"}
        </button>
        {status === "success" && (
          <span className="ml-3 text-green-600">✓ Événements enregistrés</span>
        )}
        {status === "error" && <span className="ml-3 text-red-600">Erreur : {errorMsg}</span>}
      </div>
    </div>
  );
}
