import { AppError } from "@/lib/errors";
import { guard, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

const SPOTIFY_IMAGE_HOSTS = [".scdn.co", ".spotifycdn.com"];

export function GET(req: Request) {
  return guard(async () => {
    const rawUrl = new URL(req.url).searchParams.get("url");
    if (!rawUrl) throw new AppError("validation", 400, "A Spotify URL is required.");

    let spotifyUrl: URL;
    try {
      spotifyUrl = new URL(rawUrl);
    } catch {
      throw new AppError("validation", 400, "Enter a valid Spotify URL.");
    }

    const match = spotifyUrl.hostname === "open.spotify.com"
      ? spotifyUrl.pathname.match(/^\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)\/?$/)
      : null;
    if (spotifyUrl.protocol !== "https:" || !match) {
      throw new AppError("validation", 400, "Only Spotify track, album, playlist, episode, and show links are supported.");
    }

    const canonicalUrl = `https://open.spotify.com/${match[1]}/${match[2]}`;
    let response: Response;
    try {
      response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 3600 },
      });
    } catch (error) {
      throw new AppError("upstream_error", 502, "Spotify preview is temporarily unavailable.", undefined, error instanceof Error ? error.name : "unknown");
    }
    if (!response.ok) {
      throw new AppError("upstream_error", 502, "Spotify preview is temporarily unavailable.", undefined, `Spotify oEmbed responded ${response.status}`);
    }

    const data: unknown = await response.json();
    const thumbnailUrl =
      typeof data === "object" && data !== null && "thumbnail_url" in data && typeof data.thumbnail_url === "string"
        ? data.thumbnail_url
        : null;
    if (thumbnailUrl) {
      let image: URL;
      try {
        image = new URL(thumbnailUrl);
      } catch {
        throw new AppError("upstream_error", 502, "Spotify returned an invalid preview image.");
      }
      if (image.protocol !== "https:" || !SPOTIFY_IMAGE_HOSTS.some((host) => image.hostname.endsWith(host))) {
        throw new AppError("upstream_error", 502, "Spotify returned an unsupported preview image.");
      }
    }

    return ok({ thumbnailUrl });
  });
}
