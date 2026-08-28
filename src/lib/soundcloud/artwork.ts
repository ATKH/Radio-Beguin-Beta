export type SoundCloudArtworkSize = "t200x200" | "t300x300" | "t500x500";

const SIZE_TOKEN_RE = /-t\d+x\d+(?=\.)/i;
const LARGE_TOKEN_RE = /-large(?=\.)/i;

export function normalizeSoundCloudArtworkUrl(
  url: string,
  size: SoundCloudArtworkSize = "t300x300"
) {
  if (!url) return url;
  if (!/sndcdn\.com\/artworks-/i.test(url)) return url;
  if (SIZE_TOKEN_RE.test(url)) return url.replace(SIZE_TOKEN_RE, `-${size}`);
  if (LARGE_TOKEN_RE.test(url)) return url.replace(LARGE_TOKEN_RE, `-${size}`);
  return url;
}
