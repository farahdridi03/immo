"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { AuthSidebar } from "@/components/auth/AuthSidebar";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, verify2FA } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (requires2FA) {
        await verify2FA({
          temp_token: tempToken,
          code: useBackupCode ? undefined : code.trim(),
          backup_code: useBackupCode ? backupCode.trim() : undefined,
        });
        router.push("/");
      } else {
        const res = await login({ username, password });
        if (res.requires_2fa && res.temp_token) {
          setRequires2FA(true);
          setTempToken(res.temp_token);
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la connexion.");
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
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="text-center sm:text-left mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              {requires2FA ? "Authentification à 2 facteurs" : "Ravi de vous revoir"}
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1.5 font-normal">
              {requires2FA
                ? "Veuillez saisir le code à 6 chiffres généré par votre application d'authentification."
                : "Connectez-vous pour retrouver votre inventaire et vos opérations."}
            </p>
          </div>

          <div className="bg-white border border-[#EFECE6] rounded-2xl p-6 sm:p-8 shadow-xs">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200 leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!requires2FA ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Email ou nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="vous@entreprise.com"
                      className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Votre mot de passe"
                      className="w-full bg-white border border-[#E0DACB] text-sm text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C] transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 text-[#57534E] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-[#E0DACB] text-[#483C2C] focus:ring-[#483C2C] h-4 w-4"
                      />
                      <span>Se souvenir de moi</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="font-medium text-[#1C1917] hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {!useBackupCode ? (
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                        Code d'authentification (TOTP)
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        maxLength={6}
                        placeholder="Ex: 123456"
                        className="w-full bg-white border border-[#E0DACB] text-center tracking-widest text-lg font-mono text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-3 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C] transition-all"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                        Code de secours à usage unique
                      </label>
                      <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value)}
                        required
                        placeholder="Ex: A1B2-C3D4"
                        className="w-full bg-white border border-[#E0DACB] text-center tracking-wider text-sm font-mono text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl px-3.5 py-3 outline-none focus:border-[#483C2C] focus:ring-1 focus:ring-[#483C2C] transition-all uppercase"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setUseBackupCode(!useBackupCode)}
                      className="font-medium text-[#483C2C] hover:underline cursor-pointer"
                    >
                      {useBackupCode ? "Utiliser l'application 2FA à la place" : "Utiliser un code de secours à la place"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        setCode("");
                        setBackupCode("");
                      }}
                      className="text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#483C2C] hover:bg-[#382E22] text-white font-medium text-sm py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? "Vérification..." : requires2FA ? "Valider le code 2FA" : "Se connecter"}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#EFECE6] text-center text-xs text-[#78716C]">
              Pas encore de compte ?{" "}
              <Link
                href="/inscription"
                className="font-semibold text-[#1C1917] hover:underline"
              >
                Inscrivez votre entreprise
              </Link>
            </div>
          </div>
        </div>

        {/* Empty bottom spacer for layout balance */}
        <div />
      </div>
    </div>
  );
}
