"use client";

import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";

interface HeaderProps {
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  onLogout?: () => void;
}

export function Header({ showBack, backHref = "/dashboard", backLabel, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-primary">
            Aedis
          </Link>
          {backLabel && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-sm text-muted-foreground hidden sm:inline">{backLabel}</span>
            </>
          )}
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Deconnexion</span>
          </button>
        )}
      </div>
    </header>
  );
}
