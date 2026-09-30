"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col justify-between overflow-y-auto z-40"
      style={{ background: "linear-gradient(180deg, #1E1510 0%, #2C1F12 100%)" }}
    >
      {/* Brand Header */}
      <div>
        <div className="px-5 pt-5 pb-4 mb-2 border-b border-white/8">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo in white card */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-[#A0683C]/40 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-white rounded-xl p-1.5 shadow-md">
                <Image
                  src="/gestimmo-logo.jpg"
                  alt="Gestimmo"
                  width={40}
                  height={40}
                  className="object-contain group-hover:scale-105 transition-transform duration-200"
                  priority
                />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-[17px] tracking-tight leading-tight">
                <span className="text-[#E8B98A]">Gest</span><span className="text-white">immo</span>
              </div>
              <div className="text-[9px] text-white/40 font-medium tracking-widest uppercase mt-0.5">
                Gestion des immobilisations
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-0.5 px-3 mt-2">
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
                    ? "bg-white/12 text-white font-semibold border-l-2 border-[#C4885A]"
                    : "text-white/55 hover:bg-white/7 hover:text-white/90"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#C4885A]" : "text-white/40")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Alert Section */}
      <div className="px-3 pb-4 pt-3 border-t border-white/8">
        <Link
          href="/alertes"
          className={cn(
            "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
            pathname === "/alertes"
              ? "bg-white/12 text-white font-semibold border-l-2 border-[#C4885A]"
              : "text-white/55 hover:bg-white/7 hover:text-white/90"
          )}
        >
          <div className="flex items-center gap-3">
            <Bell className={cn("w-4 h-4", pathname === "/alertes" ? "text-[#C4885A]" : "text-white/40")} />
            <span>Centre d&apos;alertes</span>
          </div>
          {unreadCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-[#DC2626] text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}
