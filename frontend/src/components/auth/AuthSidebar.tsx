"use client";

import React from "react";
import { Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function AuthSidebar() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[#483C2C] text-white p-12 flex-col justify-between relative overflow-hidden min-h-screen">
      {/* Top Brand Logo */}
      <div>
        <Logo variant="light" textSize="text-lg" />
      </div>

      {/* Hero Content */}
      <div className="max-w-md my-auto space-y-6">
        <div className="text-xs font-semibold tracking-wider text-[#D1C7BD] uppercase">
          PILOTAGE CENTRALISÉ
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Chaque bien suivi. <br />
          Chaque décision éclairée.
        </h1>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 text-sm text-[#E7E2DB]">
            <div className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
            </div>
            <span>Inventaire unifié et toujours à jour</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#E7E2DB]">
            <div className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
            </div>
            <span>Amortissements calculés automatiquement</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#E7E2DB]">
            <div className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
            </div>
            <span>Maintenance et contrats sous contrôle</span>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-xs text-[#A89D91]">
        Gestimo · Gestion des immobilisations
      </div>
    </div>
  );
}
