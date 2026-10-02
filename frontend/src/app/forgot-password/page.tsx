"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { AuthSidebar } from "@/components/auth/AuthSidebar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Veuillez renseigner votre adresse email.");
      return;
    }

    setLoading(true);

    // Simulate sending reset instructions or integrate with backend
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
    } catch {
      setError("Une erreur est survenue lors de l'envoi de la demande.");
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
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la connexion</span>
          </Link>
        </div>

        {/* Center Content Box */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="text-center sm:text-left mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-[#EFECE6] text-[#483C2C] mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              Mot de passe oublié ?
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1.5 font-normal">
              Entrez l'adresse email associée à votre compte Gestimmo pour réinitialiser vos accès.
            </p>
          </div>

          <div className="bg-white border border-[#EFECE6] rounded-2xl p-6 sm:p-8 shadow-xs">
            {submitted ? (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1C1917]">
                    Demande enregistrée
                  </h3>
                  <p className="text-xs text-[#78716C] mt-2 leading-relaxed">
                    Si un compte est associé à <span className="font-semibold text-[#1C1917]">{email}</span>, des instructions de réinitialisation vous ont été transmises par email ou auprès de l'administrateur de votre organisation.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full bg-[#483C2C] hover:bg-[#382E22] text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all shadow-xs"
                  >
                    Retourner à la page de connexion
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                    Adresse email professionnelle
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="vous@entreprise.com"
                      className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C] transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-[#A8A29E] mt-1.5">
                    Vous recevrez la procédure ou une notification de l'administrateur pour redéfinir votre mot de passe.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#483C2C] hover:bg-[#382E22] disabled:opacity-60 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </span>
                  ) : (
                    "Envoyer les instructions"
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors"
                  >
                    Vous vous souvenez de votre mot de passe ?{" "}
                    <span className="font-semibold text-[#483C2C] underline">Se connecter</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center sm:text-left text-[11px] text-[#A8A29E]">
          © {new Date().getFullYear()} Gestimmo. Tous droits réservés.
        </div>
      </div>
    </div>
  );
}
