"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  Boxes,
  MapPin,
  TrendingDown,
  Wrench,
  ShieldCheck,
  Settings,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { alertesApi } from "@/services/api/maintenance";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      alertesApi
        .list({ statut_lecture: "non_lu" })
        .then((data) => {
          setUnreadCount(Array.isArray(data) ? data.length : 0);
        })
        .catch(() => setUnreadCount(0));
    }
  }, [user]);

  const navItems = [
    { label: "Tableau de bord", href: "/", icon: LayoutDashboard },
    { label: "Familles", href: "/familles", icon: FolderTree },
    { label: "Immobilisations", href: "/immobilisations", icon: Boxes },
    { label: "Emplacements", href: "/emplacements", icon: MapPin },
    { label: "Amortissement", href: "/amortissements", icon: TrendingDown },
    { label: "Contrats de maintenance", href: "/maintenance", icon: Wrench },
    { label: "Utilisateurs & Rôles", href: "/roles", icon: ShieldCheck },
    { label: "Paramètres entreprise", href: "/entreprises", icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-[#EFECE6] bg-[#F7F4EC] h-screen sticky top-0 flex flex-col justify-between p-4 selection:bg-amber-100 overflow-y-auto z-40">
      {/* Brand Header */}
      <div>
        <div className="px-2 py-3 mb-6">
          <Logo variant="dark" showSubtitle={true} />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[#EAE3CE] text-[#1C1917] font-semibold shadow-xs"
                    : "text-[#57534E] hover:bg-[#EFECE6]/80 hover:text-[#1C1917]"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#1C1917]" : "text-[#78716C]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Alert Section */}
      <div className="pt-4 border-t border-[#EFECE6]">
        <Link
          href="/alertes"
          className={cn(
            "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
            pathname === "/alertes"
              ? "bg-[#EAE3CE] text-[#1C1917] font-semibold"
              : "text-[#57534E] hover:bg-[#EFECE6]/80 hover:text-[#1C1917]"
          )}
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-[#78716C]" />
            <span>Centre d'alertes</span>
          </div>
          {unreadCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-[#DC2626] text-white text-[11px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}
