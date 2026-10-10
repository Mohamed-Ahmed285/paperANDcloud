import type { Metadata, Viewport } from "next";
import { Lora, Source_Sans_3, Special_Elite } from "next/font/google";
import "./globals.css";

const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", style: ["normal", "italic"] });
// Typewriter face for the "Paper / Cloud" wordmark
const typewriter = Special_Elite({ subsets: ["latin"], weight: "400", variable: "--font-typewriter", display: "swap" });

export const metadata: Metadata = {
  title: "Paper & Cloud",
  description: "A calm personal library for links, quotes, snippets, images and documents.",
  openGraph: {
    title: "Paper & Cloud",
    description: "A calm personal library for links, quotes, snippets, images and documents.",
    type: "website",
    images: ["/opengraph-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image.jpg"],
  },
};

export const viewport: Viewport = { themeColor: "#FBF8F3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${source.variable} ${lora.variable} ${typewriter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
