"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Send, CheckCircle2 } from "lucide-react";
import { AuthSidebar } from "@/components/auth/AuthSidebar";
import { authApi } from "@/services/api/auth";

export default function InscriptionPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Entreprise
    entreprise_nom: "integrasyserp",
    matricule_fiscal: "1425385",
    secteur_activite: "Technologie",
    adresse: "manzah 2",
    entreprise_telephone: "50720912",
    entreprise_email: "contacterp@gmail.com",

    // Step 2: Admin
    first_name: "",
    last_name: "",
    email: "prenom@entreprise.com",
    username: "prenom.nom",
    password: "",
    confirm_password: "",
    accept_terms: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.entreprise_nom) {
      setError("Le nom de l'entreprise est obligatoire.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username || !formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs obligatoires du compte administrateur.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!formData.accept_terms) {
      setError("Vous devez accepter les conditions d'utilisation.");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        entreprise_nom: formData.entreprise_nom,
        matricule_fiscal: formData.matricule_fiscal,
        secteur_activite: formData.secteur_activite,
        entreprise_email: formData.entreprise_email,
        entreprise_telephone: formData.entreprise_telephone,
        adresse: formData.adresse,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Erreur lors de la soumission. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAF7F2]">
      {/* Left Dark Sidebar Branding */}
      <AuthSidebar />

      {/* Right Form Area */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-12">
        {/* Top Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        {/* Center Content Box */}
        <div className="max-w-lg w-full mx-auto my-auto py-6">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              Inscrire votre entreprise
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1 font-normal">
              Créez l'espace de votre entreprise. Votre demande sera vérifiée avant activation.
            </p>
          </div>

          <div className="bg-white border border-[#EFECE6] rounded-2xl p-6 sm:p-8 shadow-xs">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1C1917]">
                  Demande d'inscription soumise avec succès !
                </h3>
                <p className="text-xs text-[#78716C] max-w-sm mx-auto leading-relaxed">
                  L'administrateur de la plateforme révisera votre demande. Vous recevrez une notification dès qu'elle sera validée.
                </p>
                <div className="pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center bg-[#483C2C] text-white text-xs font-medium px-6 py-3 rounded-xl shadow-xs hover:bg-[#382E22] transition-all"
                  >
                    Aller à la page de connexion
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Step Progress Bar */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#1C1917]">Étape {step} sur 2</span>
                    <span className="text-[#78716C]">
                      {step === 1 ? "Entreprise" : "Compte administrateur"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-1 rounded-full bg-[#483C2C]" />
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        step === 2 ? "bg-[#483C2C]" : "bg-[#EFECE6]"
                      }`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200 leading-relaxed">
                    {error}
                  </div>
                )}

                {/* STEP 1: INFORMATIONS ENTREPRISE */}
                {step === 1 && (
                  <form onSubmit={handleNextStep} className="space-y-4">
                    <div className="bg-[#FAF8F2] border border-[#EFECE6] p-3.5 rounded-xl flex items-center gap-3 mb-4">
                      <div className="h-9 w-9 rounded-lg bg-[#EAE3CE] text-[#483C2C] flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1C1917]">
                          Informations de l'entreprise
                        </h4>
                        <p className="text-[11px] text-[#78716C]">
                          Identité et coordonnées de votre société
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                          Nom de l'entreprise *
                        </label>
                        <input
                          type="text"
                          name="entreprise_nom"
                          value={formData.entreprise_nom}
                          onChange={handleChange}
                          required
                          placeholder="integrasyserp"
                          className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                          Matricule fiscal
                        </label>
                        <input
                          type="text"
                          name="matricule_fiscal"
                          value={formData.matricule_fiscal}
                          onChange={handleChange}
                          placeholder="1425385"
                          className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Secteur d'activité
                      </label>
                      <select
                        name="secteur_activite"
                        value={formData.secteur_activite}
                        onChange={handleChange}
                        className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                      >
                        <option value="Technologie">Technologie</option>
                        <option value="Industrie">Industrie</option>
                        <option value="Services">Services</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Santé">Santé</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Adresse
                      </label>
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleChange}
                        placeholder="manzah 2"
                        className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                          Téléphone
                        </label>
                        <input
                          type="text"
                          name="entreprise_telephone"
                          value={formData.entreprise_telephone}
                          onChange={handleChange}
                          placeholder="50720912"
                          className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                          Email de contact
                        </label>
                        <input
                          type="email"
                          name="entreprise_email"
                          value={formData.entreprise_email}
                          onChange={handleChange}
                          placeholder="contacterp@gmail.com"
                          className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#483C2C] hover:bg-[#382E22] text-white font-medium text-sm py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      <span>Continuer</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="pt-2 text-center text-xs text-[#78716C]">
                      Déjà un compte ?{" "}
                      <Link
                        href="/login"
                        className="font-semibold text-[#1C1917] hover:underline"
                      >
                        Se connecter
                      </Link>
                    </div>
                  </form>
                )}

                {/* STEP 2: COMPTE ADMINISTRATEUR */}
                {step === 2 && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                          Prénom
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          placeholder="Ex: Alice"
                          className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                          Nom
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          placeholder="Ex: Smith"
                          className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Email professionnel *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="prenom@entreprise.com"
                        className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Nom d'utilisateur *
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        placeholder="prenom.nom"
                        className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Mot de passe *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                      />
                      <p className="text-[11px] text-[#78716C] mt-1">
                        8 caractères minimum, avec une majuscule et un chiffre.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Confirmer le mot de passe *
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C]"
                      />
                    </div>

                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 text-xs text-[#57534E] cursor-pointer">
                        <input
                          type="checkbox"
                          name="accept_terms"
                          checked={formData.accept_terms}
                          onChange={handleChange}
                          className="rounded border-[#E0DACB] text-[#483C2C] focus:ring-[#483C2C] h-4 w-4 mt-0.5"
                        />
                        <span>
                          J'accepte les{" "}
                          <span className="text-[#1C1917] font-semibold underline">
                            conditions d'utilisation
                          </span>{" "}
                          et la{" "}
                          <span className="text-[#1C1917] font-semibold underline">
                            politique de confidentialité
                          </span>
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="bg-[#FAF8F2] border border-[#E0DACB] hover:bg-[#EFECE6] p-3 rounded-xl text-[#1C1917] flex items-center justify-center cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-[#483C2C] hover:bg-[#382E22] text-white font-medium text-sm py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>
                          {loading ? "Soumission en cours..." : "Soumettre ma demande"}
                        </span>
                      </button>
                    </div>

                    <div className="pt-2 text-center text-xs text-[#78716C]">
                      Déjà un compte ?{" "}
                      <Link
                        href="/login"
                        className="font-semibold text-[#1C1917] hover:underline"
                      >
                        Se connecter
                      </Link>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {/* Empty bottom spacer */}
        <div />
      </div>
    </div>
  );
}
