// @ts-nocheck
"use client";

import { useState } from "react";

const makeId = () => Math.random().toString(36).slice(2, 10);

const emptyNews = () => ({
  id: makeId(),
  title: "",
  titleEn: "",
  text: "",
  textEn: "",
  image: "",
  link: "",
  linkLabel: "",
  linkLabelEn: "",
});

export default function AdminNewsForm({ initialNews }) {
  const [password, setPassword] = useState("");
  const [news, setNews] = useState(() =>
    initialNews && initialNews.length > 0
      ? initialNews.map((n) => ({ titleEn: "", textEn: "", linkLabel: "", linkLabelEn: "", ...n }))
      : []
  );
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const updateNews = (index, field, value) => {
    setNews((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addNews = () => {
    setNews((prev) => [...prev, emptyNews()]);
  };

  const removeNews = (index) => {
    setNews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, news }),
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
        {news.map((item, index) => (
          <div key={item.id} className="border rounded p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Titre (FR)</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateNews(index, "title", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Titre de la news"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Titre (EN) <span className="text-foreground/40">— optionnel</span>
                </label>
                <input
                  type="text"
                  value={item.titleEn || ""}
                  onChange={(e) => updateNews(index, "titleEn", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="News title"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Texte (FR)</label>
                <textarea
                  value={item.text}
                  onChange={(e) => updateNews(index, "text", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  rows={3}
                  placeholder="Description courte"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Texte (EN) <span className="text-foreground/40">— optionnel</span>
                </label>
                <textarea
                  value={item.textEn || ""}
                  onChange={(e) => updateNews(index, "textEn", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  rows={3}
                  placeholder="Short description"
                />
              </div>
            </div>

            <p className="text-xs text-foreground/40">
              Si les champs EN sont vides, la version FR sera affichée en anglais aussi.
            </p>

            <div>
              <label className="block text-xs font-medium mb-1">Image (URL, optionnel)</label>
              <input
                type="text"
                value={item.image || ""}
                onChange={(e) => updateNews(index, "image", e.target.value)}
                className="border rounded px-2 py-1 w-full"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Lien (optionnel)</label>
              <input
                type="text"
                value={item.link || ""}
                onChange={(e) => updateNews(index, "link", e.target.value)}
                className="border rounded px-2 py-1 w-full"
                placeholder="https://... ou /events/slug"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Texte du bouton (FR) <span className="text-foreground/40">— optionnel</span>
                </label>
                <input
                  type="text"
                  value={item.linkLabel || ""}
                  onChange={(e) => updateNews(index, "linkLabel", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="En savoir plus"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Texte du bouton (EN) <span className="text-foreground/40">— optionnel</span>
                </label>
                <input
                  type="text"
                  value={item.linkLabelEn || ""}
                  onChange={(e) => updateNews(index, "linkLabelEn", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Learn more"
                />
              </div>
            </div>
            <p className="text-xs text-foreground/40">
              Si vide, "En savoir plus" / "Learn more" sera utilisé par défaut. N'apparaît que si un lien est renseigné.
            </p>

            <div className="pt-2 border-t">
              <button
                type="button"
                onClick={() => removeNews(index)}
                className="text-red-600 text-sm font-medium"
              >
                Supprimer cette news
              </button>
            </div>
          </div>
        ))}

        {news.length === 0 && (
          <p className="text-sm text-foreground/50">Aucune news pour le moment.</p>
        )}
      </div>

      <button
        type="button"
        onClick={addNews}
        className="text-sm text-blue-600 font-medium"
      >
        + Ajouter une news
      </button>

      <div className="sticky bottom-4 bg-background pt-4">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
          type="button"
        >
          {status === "saving" ? "Enregistrement..." : "Enregistrer les news"}
        </button>
        {status === "success" && (
          <span className="ml-3 text-green-600">✓ News enregistrées</span>
        )}
        {status === "error" && <span className="ml-3 text-red-600">Erreur : {errorMsg}</span>}
      </div>
    </div>
  );
}