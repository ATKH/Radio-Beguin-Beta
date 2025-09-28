// app/shows/page.tsx
import ShowsClient from "./ShowsClient";
import { Suspense } from "react";

export default function ShowsPage() {
  return (
    <Suspense fallback={<p className="text-center">Chargement...</p>}>
      <ShowsClient />
    </Suspense>
  );
}
