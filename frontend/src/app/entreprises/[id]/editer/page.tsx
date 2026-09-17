"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Upload, Save, X } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { entreprisesApi } from "@/services/api/users";
import type { Entreprise } from "@/types/api";

export default function EditerEntreprisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const entrepriseId = Number(resolvedParams.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [matriculeFiscal, setMatriculeFiscal] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [secteurActivite, setSecteurActivite] = useState("");
  const [adresse, setAdresse] = useState("");
  const [logo, setLogo] = useState<string>("");

  useEffect(() => {
    if (entrepriseId) {
      loadEntreprise();
    }
  }, [entrepriseId]);

  const loadEntreprise = async () => {
    setLoading(true);
    try {
      const data = await entreprisesApi.get(entrepriseId);
      if (data) {
        setNom(data.nom || "");
        setMatriculeFiscal(data.matricule_fiscal || "");
        setEmail(data.email || "");
        setTelephone(data.telephone || "");
        setSecteurActivite(data.secteur_activite || "");
        setAdresse(data.adresse || "");
        setLogo(data.logo || "");
      }
    } catch (err) {
      console.error("Failed to load entreprise", err);
      setError("Impossible de charger les données de l'entreprise.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError("Le nom de l'entreprise est obligatoire.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Partial<Entreprise> = {
        nom: nom.trim(),
        matricule_fiscal: matriculeFiscal.trim() || null,
        email: email.trim() || "",
        telephone: telephone.trim() || "",
        secteur_activite: secteurActivite.trim() || "",
        adresse: adresse.trim() || "",
      };

      if (logo && logo.startsWith("data:image")) {
        payload.logo = logo;
      } else if (!logo) {
        payload.logo = null;
      }

      await entreprisesApi.update(entrepriseId, payload);
      router.push(`/entreprises/${entrepriseId}`);
    } catch (err: any) {
      console.error("Failed to update entreprise", err);
      setError(err?.message || "Erreur lors de la mise à jour de l'entreprise.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center text-[#78716C] text-sm">
          Chargement de l'entreprise...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={`/entreprises/${entrepriseId}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la fiche entreprise</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-[#E0DACB] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#EAE3CE] text-[#1C1917] font-bold flex items-center justify-center shrink-0 shadow-2xs border border-[#E0DACB] overflow-hidden p-1">
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <Building2 className="w-6 h-6 text-[#1C1917]" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1C1917] tracking-tight">
                Modifier l'entreprise {nom ? `"${nom}"` : ""}
              </h1>
              <p className="text-xs text-[#78716C]">
                Mettre à jour la raison sociale, les coordonnées et le logo de la société.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Container Card */}
        <form onSubmit={handleSubmit}>
          <Card className="bg-white border-[#E0DACB] shadow-2xs">
            <CardHeader className="border-b border-[#E0DACB]/60 pb-4">
              <CardTitle className="text-base font-bold text-[#1C1917]">
                Modification de la Société
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Logo Upload Section */}
              <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#E0DACB] flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-[#E0DACB] bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-8 h-8 text-[#A8A29E]" />
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <span className="text-xs font-bold text-[#1C1917] block">Logo de la Société</span>
                  <p className="text-[11px] text-[#78716C]">
                    Format recommandé: PNG, JPG ou SVG (max 2 Mo).
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1C1917] text-white hover:bg-[#2C2927] transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logo ? "Changer le logo" : "Télécharger un logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    {logo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLogo("")}
                        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">
                    Raison Sociale / Nom <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: TechCorp Solutions SARL"
                    required
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Matricule Fiscal</label>
                  <Input
                    value={matriculeFiscal}
                    onChange={(e) => setMatriculeFiscal(e.target.value)}
                    placeholder="Ex: 1234567A/P/M/000"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Secteur d'activité</label>
                  <Input
                    value={secteurActivite}
                    onChange={(e) => setSecteurActivite(e.target.value)}
                    placeholder="Ex: Immobilier, Tech, Services..."
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Email Professionnel</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Téléphone</label>
                  <Input
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+216 71 000 000"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-[#1C1917]">Adresse du Siège Social</label>
                  <Input
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    placeholder="Rue, Avenue, Ville, Code Postal..."
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E0DACB]/60 flex items-center justify-end gap-3">
                <Link href={`/entreprises/${entrepriseId}`}>
                  <Button type="button" variant="outline" className="border-[#E0DACB]">
                    Annuler
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#1C1917] text-white hover:bg-[#2C2927]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </PageContainer>
  );
}
