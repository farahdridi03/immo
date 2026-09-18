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
  History,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { alertesApi } from "@/services/api/maintenance";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasAnyPermission } = useAuth();
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
    { label: "Tableau de bord", href: "/", icon: LayoutDashboard, permissions: [] },
    { label: "Familles", href: "/familles", icon: FolderTree, permissions: ["P1", "familles", "view_familles", "gerer_familles"] },
    { label: "Immobilisations", href: "/immobilisations", icon: Boxes, permissions: ["P2", "immobilisations", "view_immobilisations", "gerer_immobilisations"] },
    { label: "Emplacements", href: "/emplacements", icon: MapPin, permissions: ["P3", "emplacements", "view_emplacements", "gerer_emplacements"] },
    { label: "Amortissement", href: "/amortissements", icon: TrendingDown, permissions: ["P4", "amortissements", "view_amortissements", "gerer_amortissements"] },
    { label: "Contrats de maintenance", href: "/maintenance", icon: Wrench, permissions: ["P5", "maintenance", "view_maintenance", "gerer_maintenance"] },
    { label: "Utilisateurs & Rôles", href: "/roles", icon: ShieldCheck, permissions: ["P6", "users", "roles", "view_users", "manage_users", "manage_roles"] },
    { label: "Historique d'Audit", href: "/audit", icon: History, permissions: ["P7", "audit", "view_audit"] },
    { label: "Paramètres entreprise", href: "/entreprises", icon: Settings, permissions: ["P8", "entreprises", "manage_entreprises"] },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.permissions.length === 0 ? true : hasAnyPermission(item.permissions)
  );

  return (
    <aside className="w-64 shrink-0 border-r border-[#EFECE6] bg-[#F7F4EC] h-screen sticky top-0 flex flex-col justify-between p-4 selection:bg-amber-100 overflow-y-auto z-40">
      {/* Brand Header */}
      <div>
        <div className="px-2 py-3 mb-6">
          <Logo variant="dark" showSubtitle={true} />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {visibleNavItems.map((item) => {
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
