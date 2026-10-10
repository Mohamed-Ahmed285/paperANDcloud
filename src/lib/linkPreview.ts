export type PreviewSource =
  | { kind: "youtube"; imageUrl: string }
  | { kind: "spotify"; url: string }
  | null;

export function getLinkPreview(url: string): PreviewSource {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const id = parsed.pathname === "/watch"
        ? parsed.searchParams.get("v")
        : ["shorts", "embed", "live"].includes(segments[0] ?? "")
          ? segments[1]
          : undefined;
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
        return { kind: "youtube", imageUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
      }
    }

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
        return { kind: "youtube", imageUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
      }
    }

    if (host === "open.spotify.com") {
      const match = parsed.pathname.match(/^\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)\/?$/);
      if (match) {
        return { kind: "spotify", url: `https://open.spotify.com/${match[1]}/${match[2]}` };
      }
    }
  } catch {
    return null;
  }

  return null;
}
