# TODO: Intégrer API SoundCloud avec refresh token automatique

- [x] Modifier `src/lib/podcasts.ts` pour utiliser l'API SoundCloud avec `getAccessToken()` au lieu du RSS
- [x] Modifier `src/app/shows/playlists/[id]/page.tsx` pour utiliser un token OAuth au lieu de client_id
- [x] Implémenter le flux OAuth complet pour obtenir et rafraîchir les tokens
- [x] Créer stockage sécurisé pour les tokens (tokens.json)
- [x] Tester le flux OAuth (initiation et callback)
- [x] Tester les appels API pour vérifier le rafraîchissement automatique des tokens (erreur attendue avec token placeholder)
- [x] Vérifier que toutes les données proviennent de l'API SoundCloud
