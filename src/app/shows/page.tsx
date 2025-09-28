// app/shows/page.tsx
import ShowsClient from "./ShowsClient";

export default async function ShowsPage() {
  // Ici on ne fait pas de fetch côté serveur
  // -> ShowsClient se charge de récupérer via /api/podcasts
  return <ShowsClient />;
}
