/** YouTube Data API key — set YOUTUBE_API_KEY in .env (no hardcoded fallback). */
export function getYouTubeApiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  return key || null;
}
