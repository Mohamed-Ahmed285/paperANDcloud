"use client";

import { Menu as MenuIcon, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { Button, IconButton } from "./ui/Button";
import { Dialog } from "./ui/Dialog";

export function AppShell({
  sidebar,
  onQuickAdd,
  children,
}: {
  sidebar: (opts: { onNavigate?: () => void }) => ReactNode;
  onQuickAdd: () => void;
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-canvas lg:block">{sidebar({})}</aside>

      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-canvas/95 px-3 py-2 backdrop-blur-sm lg:hidden">
        <IconButton label="Open navigation" onClick={() => setDrawer(true)}><MenuIcon size={20} aria-hidden /></IconButton>
        <div className="flex-1"><Logo /></div>
      </header>
      <Dialog open={drawer} onClose={() => setDrawer(false)} variant="drawer">
        {sidebar({ onNavigate: () => setDrawer(false) })}
      </Dialog>

      <main id="main" className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>

      <div className="fixed bottom-5 right-5 z-20 lg:hidden">
        <Button variant="primary" className="h-12 rounded-full px-5 shadow-[0_4px_16px_rgba(37,99,235,0.3)]" onClick={onQuickAdd}>
          <Plus size={18} aria-hidden /> Add
        </Button>
      </div>
    </div>
  );
}
