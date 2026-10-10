"use client";

import { Link2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { getLinkPreview } from "@/lib/linkPreview";

interface Props {
  url: string;
  title?: string;
  className: string;
  compact?: boolean;
  fallback: ReactNode;
}

export function LinkPreview({ url, title, className, compact = false, fallback }: Props) {
  const preview = getLinkPreview(url);
  const spotifyUrl = preview?.kind === "spotify" ? preview.url : null;
  const [spotifyImage, setSpotifyImage] = useState<{ url: string; image: string } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!spotifyUrl) return;

    const controller = new AbortController();
    const params = new URLSearchParams({ url: spotifyUrl });
    void fetch(`/api/link-preview?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Preview request failed (${response.status})`);
        return response.json() as Promise<{ thumbnailUrl?: string }>;
      })
      .then((data) => {
        if (data.thumbnailUrl) setSpotifyImage({ url: spotifyUrl, image: data.thumbnailUrl });
        else setFailed(true);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          console.warn("Spotify link preview unavailable.", error.message);
          setFailed(true);
        }
      });

    return () => controller.abort();
  }, [spotifyUrl]);

  const imageUrl = preview?.kind === "youtube"
    ? preview.imageUrl
    : preview?.kind === "spotify" && spotifyImage?.url === preview.url
      ? spotifyImage.image
      : null;

  return (
    <div className={`${className} relative`}>
      {imageUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- preview hosts are dynamic external services
        <img
          src={imageUrl}
          alt={title ? `Preview for ${title}` : "Link preview"}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : preview?.kind === "spotify" && !failed ? (
        <div className="flex h-full items-center justify-center bg-surface text-muted" aria-label="Loading Spotify preview">
          <span className="pc-skeleton size-full" />
        </div>
      ) : preview && !failed ? (
        <div className="flex h-full items-center justify-center bg-surface text-muted">
          <Link2 size={compact ? 18 : 26} aria-hidden />
        </div>
      ) : (
        fallback
      )}
    </div>
  );
}
