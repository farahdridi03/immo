"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Server } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col justify-between">
      {/* Top Public Header */}
      <header className="h-20 w-full max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo variant="dark" textSize="text-lg" />

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#57534E]">
          <a href="#features" className="hover:text-[#1C1917] transition-colors">
            Fonctionnalités
          </a>
          <a href="#pricing" className="hover:text-[#1C1917] transition-colors">
            Tarifs
          </a>
          <a href="#contact" className="hover:text-[#1C1917] transition-colors">
            Contact
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-[#1C1917] hover:underline px-2 py-1"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="bg-[#483C2C] hover:bg-[#382E22] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            S'inscrire
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12 lg:py-16 my-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column Text & CTA */}
        <div className="lg:col-span-6 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#E0DACB] text-[#1C1917] text-xs font-medium px-3.5 py-1.5 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Pensé pour les entreprises exigeantes</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1C1917] tracking-tight leading-[1.12]">
            Vos immobilisations, <br />
            enfin sous contrôle.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#78716C] leading-relaxed max-w-xl font-normal">
            Suivez votre inventaire, automatisez l'amortissement et planifiez la maintenance — tout au même endroit, sans complexité.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 pt-2">
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center gap-2 bg-[#483C2C] hover:bg-[#382E22] text-white font-medium text-sm px-6 py-3.5 rounded-xl shadow-xs transition-all"
            >
              <span>Créer mon compte entreprise</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white border border-[#E0DACB] hover:bg-[#FAF8F2] text-[#1C1917] font-medium text-sm px-6 py-3.5 rounded-xl shadow-2xs transition-all"
            >
              <span>Voir la démo</span>
            </Link>
          </div>

          {/* Guarantee Note */}
          <div className="flex items-center gap-2 text-xs text-[#8C857B] font-medium pt-2">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>Demande sans engagement · Validation personnalisée</span>
          </div>
        </div>

        {/* Right Column: App Preview Card Mockup */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="bg-[#EFECE6]/80 border border-[#E6E1D5] rounded-3xl p-4 shadow-sm w-full max-w-lg">
            <div className="bg-white rounded-2xl border border-[#EFECE6] p-5 shadow-2xs space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-1">
                <div>
                  <div className="text-[11px] text-[#78716C]">Vue d'ensemble</div>
                  <div className="text-sm font-bold text-[#1C1917]">
                    Parc d'immobilisations
                  </div>
                </div>
                <span className="bg-[#E6F4EA] text-[#16A34A] text-xs font-semibold px-2.5 py-1 rounded-full">
                  À jour
                </span>
              </div>

              {/* 3 Metric Boxes */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#FAF8F2] p-3 rounded-xl">
                  <div className="text-lg font-bold text-[#1C1917]">1 248</div>
                  <div className="text-[10px] text-[#78716C]">Biens actifs</div>
                </div>
                <div className="bg-[#FAF8F2] p-3 rounded-xl">
                  <div className="text-lg font-bold text-[#1C1917]">2,4 M€</div>
                  <div className="text-[10px] text-[#78716C]">Valeur brute</div>
                </div>
                <div className="bg-[#FAF8F2] p-3 rounded-xl">
                  <div className="text-lg font-bold text-[#1C1917]">96,8 %</div>
                  <div className="text-[10px] text-[#78716C]">Conformité</div>
                </div>
              </div>

              {/* Middle Grid: Chart + Alert Box */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-stretch">
                {/* Bar Chart Simulation */}
                <div className="sm:col-span-3 border border-[#EFECE6] rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#1C1917]">Valeur du parc</span>
                    <span className="text-[#8C857B]">12 mois</span>
                  </div>
                  <div className="h-16 flex items-end gap-1.5 pt-2">
                    <div className="bg-[#EAE3CE] w-full h-[40%] rounded-t-sm" />
                    <div className="bg-[#EAE3CE] w-full h-[55%] rounded-t-sm" />
                    <div className="bg-[#EAE3CE] w-full h-[50%] rounded-t-sm" />
                    <div className="bg-[#EAE3CE] w-full h-[70%] rounded-t-sm" />
                    <div className="bg-[#EAE3CE] w-full h-[65%] rounded-t-sm" />
                    <div className="bg-[#EAE3CE] w-full h-[85%] rounded-t-sm" />
                    <div className="bg-[#EAE3CE] w-full h-[75%] rounded-t-sm" />
                    <div className="bg-[#483C2C] w-full h-[95%] rounded-t-sm" />
                  </div>
                </div>

                {/* Dark Brown Alert Summary Card */}
                <div className="sm:col-span-2 bg-[#483C2C] text-white rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="text-[11px] font-semibold text-[#D1C7BD]">
                      À surveiller
                    </div>
                    <div className="text-xl font-bold text-white mt-1">14</div>
                    <div className="text-[10px] text-[#E7E2DB]">actions à planifier</div>
                  </div>
                  <div className="border-t border-white/20 pt-2 flex items-center justify-between text-[10px] text-[#E7E2DB]">
                    <span>Contrats: 8</span>
                    <span>Maintenances: 6</span>
                  </div>
                </div>
              </div>

              {/* Bottom Asset Item */}
              <div className="border border-[#EFECE6] bg-[#FAF8F2] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#EAE3CE] text-[#483C2C] flex items-center justify-center">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C1917]">
                      Serveur principal · IT-00482
                    </div>
                    <div className="text-[10px] text-[#78716C]">
                      Siège · Affecté à l'équipe IT
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#16A34A]">
                  Actif
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full border-t border-[#EFECE6] py-6 text-center text-xs text-[#78716C]">
        © 2026 Gestimo. Tous droits réservés.
      </footer>
    </div>
  );
}
