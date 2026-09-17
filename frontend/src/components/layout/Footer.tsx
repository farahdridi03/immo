import React from "react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-muted/30 py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-center sm:text-start">
          &copy; {new Date().getFullYear()} Gestimo. Tous droits réservés.
        </p>
        <div className="flex items-center gap-6 font-mono text-xs">
          <span>Next.js App Router</span>
          <span>•</span>
          <span>Django REST API</span>
          <span>•</span>
          <span>PostgreSQL</span>
        </div>
      </div>
    </footer>
  );
}
