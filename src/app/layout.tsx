import type { Metadata, Viewport } from "next";
import { Inter, Lora, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Paper & Cloud",
  description: "A calm personal library for links, quotes, snippets, images and documents.",
};

export const viewport: Viewport = { themeColor: "#F8FAFC" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${source.variable} ${lora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
