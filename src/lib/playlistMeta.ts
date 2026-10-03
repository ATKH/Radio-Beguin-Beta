import { useLocale } from '@/lib/LocaleContext';

export type Lang = 'fr' | 'en';

// scale : ajuste la taille d'une icône (1 = taille normale). Certaines icônes ont plus ou moins
// de marge dans leur fichier, ce qui les fait paraître plus grandes ou plus petites que les autres.
type Meta = { en: string; icon?: string; scale?: number };

// Les icônes sont les fichiers déjà présents à la racine de `public/`.
// Les espaces et accents des noms de fichiers sont encodés pour l'URL.
const icon = (file: string) => encodeURI(`/${file}`);

// Clé = nom de la playlist tel qu'écrit dans le genre AzuraCast, sans accents ni majuscules.
// Pour utiliser un PNG plutôt qu'un SVG, remplace simplement le nom du fichier
// (ex. 'Bain de Soleil.svg' -> 'bain-de-soleil.png').
const META: Record<string, Meta> = {
  'appels de phares': { en: 'High Beams', icon: icon('Appels de Phares.svg') },
  'bain de soleil': { en: 'Sunbath', icon: icon('Bain de Soleil.svg') },
  crepuscule: { en: 'Twilight', icon: icon('Crépuscule.svg') },
  curiosites: { en: 'Curiosities', icon: icon('Curiosites.svg') },
  'meditation core': { en: 'Meditation Core', icon: icon('Meditation Core.svg') },
  'metro boulot': { en: 'Daily Grind', icon: icon('Métro Boulot.svg') },
  abysses: { en: 'Abyss', icon: icon('Abysses.png'), scale: 0.7 },
  talk: { en: 'Talk', icon: icon('Talk.svg') },
  'xdj-rr': { en: 'XDJ-RR' }, // pas d'icône : petite flèche par défaut
  'autres emissions': { en: 'Other shows' },
};

// Ordre d'affichage dans le menu (les playlists non listées viennent après, par ordre alphabétique,
// puis « Autres émissions » en tout dernier).
const ORDER = ['meditation core', 'metro boulot', 'curiosités' , 'bain de soleil', 'crepuscule', 'appels de phares', 'abysses', 'talk'];

const normalize = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Nom à afficher dans la langue du site (français = nom AzuraCast tel quel). */
export function playlistLabel(name: string, lang: Lang): string {
  const meta = META[normalize(name)];
  return lang === 'en' && meta ? meta.en : name;
}

/** Position d'une playlist dans le menu (plus petit = plus haut). */
export function playlistRank(name: string): number {
  const key = normalize(name);
  if (key === 'autres emissions') return ORDER.length + 1;
  const index = ORDER.indexOf(key);
  return index === -1 ? ORDER.length : index;
}

/** Facteur de taille de l'icône (1 par défaut). */
export function playlistIconScale(name: string): number {
  return META[normalize(name)]?.scale ?? 1;
}

/** Chemin de l'icône de la playlist, ou null s'il n'y en a pas. */
export function playlistIcon(name: string): string | null {
  return META[normalize(name)]?.icon ?? null;
}

/** Langue courante du site. Lit le contexte de langue existant (locale / lang / language). */
export function usePlaylistLang(): Lang {
  const ctx = useLocale() as unknown as { locale?: string; lang?: string; language?: string };
  const raw = (ctx.locale ?? ctx.lang ?? ctx.language ?? 'fr').toLowerCase();
  return raw.startsWith('en') ? 'en' : 'fr';
}