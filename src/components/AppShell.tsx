"use client";

import { Menu as MenuIcon, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { Button, IconButton } from "./ui/Button";
import { Dialog } from "./ui/Dialog";

export function AppShell({
  sidebar,
  search,
  onQuickAdd,
  children,
}: {
  sidebar: (opts: { onNavigate?: () => void }) => ReactNode;
  search?: ReactNode;
  onQuickAdd: () => void;
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-8">
          <IconButton label="Open library menu" onClick={() => setDrawer(true)} className="-ml-1"><MenuIcon size={20} aria-hidden /></IconButton>
          <Logo />
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-sm">
            {search}
            <Button variant="primary" className="hidden !rounded-full sm:inline-flex" onClick={onQuickAdd}>
              <Plus size={17} aria-hidden /> Add
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={drawer} onClose={() => setDrawer(false)} variant="drawer">
        {sidebar({ onNavigate: () => setDrawer(false) })}
      </Dialog>

      <main id="main" className="px-4 pb-28 pt-6 sm:px-8 sm:pb-12">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>

      <div className="fixed bottom-5 right-5 z-20 sm:hidden">
        <Button variant="primary" className="h-12 rounded-full px-5 shadow-[0_4px_16px_rgba(17,17,17,0.28)]" onClick={onQuickAdd}>
          <Plus size={18} aria-hidden /> Add
        </Button>
      </div>
    </>
  );
}
