"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasToken(!!localStorage.getItem("token"));
    }
  }, [user]);

  const isAuth = !!user || hasToken;

  const isFullPageLayout =
    pathname === "/login" ||
    pathname === "/inscription" ||
    pathname === "/home" ||
    pathname === "/landing" ||
    (pathname === "/" && !isAuth);

  if (isFullPageLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex selection:bg-amber-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header />
        <main className="flex-1 p-6 sm:p-8 bg-[#F7F4EC] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
