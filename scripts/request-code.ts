import "dotenv/config";
import express from "express";

const app = express();

app.get("/soundcloud/callback", (req, res) => {
  const { code, error, error_description } = req.query;
  console.log("SoundCloud callback:", { code, error, error_description });
  res.send(
    `<h1>SoundCloud callback</h1><p>Code: ${code ?? "(aucun)"}</p><p>Erreur: ${error ?? "(aucune)"}</p>`
  );
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}/soundcloud/callback`);
});
