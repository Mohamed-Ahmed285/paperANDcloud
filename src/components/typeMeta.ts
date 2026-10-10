import { AlignLeft, FileText, Image as ImageIcon, Link2, Quote, type LucideIcon } from "lucide-react";
import type { ContentType } from "@/lib/types";

export const TYPE_META: Record<ContentType, { label: string; plural: string; icon: LucideIcon }> = {
  link: { label: "Link", plural: "Links", icon: Link2 },
  text: { label: "Text snippet", plural: "Text snippets", icon: AlignLeft },
  quote: { label: "Quote", plural: "Quotes", icon: Quote },
  media: { label: "Image or media", plural: "Images & media", icon: ImageIcon },
  file: { label: "File or document", plural: "Files & documents", icon: FileText },
};
