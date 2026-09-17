"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Upload,
  Save,
  CheckCircle2,
  X,
  QrCode,
  Key,
  Copy,
  Download,
  Clock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/services/api/auth";
import type { Setup2FAResponse } from "@/types/api";

export default function ProfilPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // Personal Info Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [avatar, setAvatar] = useState<string>("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 2FA Setup Modal & Flow State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState<Setup2FAResponse | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [confirming2FA, setConfirming2FA] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // 2FA Deactivate Modal State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setTelephone(user.telephone || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  // Handle Avatar Change
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      await authApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        telephone: telephone.trim(),
        avatar: avatar || null,
      });
      await refreshUser();
      setProfileSuccess("Profil mis à jour avec succès.");
    } catch (err: any) {
      console.error("Failed to update profile", err);
      setProfileError(err?.message || "Erreur lors de la mise à jour du profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPasswordSuccess(res.detail || "Mot de passe modifié avec succès.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Failed to change password", err);
      setPasswordError(err?.old_password?.[0] || err?.message || "Erreur lors du changement de mot de passe.");
    } finally {
      setSavingPassword(false);
    }
  };

  // Start 2FA Setup
  const handleStart2FASetup = async () => {
    setSetupError(null);
    setSetupCode("");
    setBackupCodes([]);
    try {
      const res = await authApi.setup2FA();
      setSetupData(res);
      setIsSetupModalOpen(true);
    } catch (err: any) {
      console.error("Failed to setup 2FA", err);
      setProfileError(err?.message || "Impossible d'initialiser la configuration 2FA.");
    }
  };

  // Confirm 2FA Setup
  const handleConfirm2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming2FA(true);
    setSetupError(null);

    try {
      const res = await authApi.confirm2FA(setupCode.trim());
      setBackupCodes(res.backup_codes || []);
      await refreshUser();
      setProfileSuccess("L'authentification à deux facteurs a été activée !");
    } catch (err: any) {
      console.error("Failed to confirm 2FA", err);
      setSetupError(err?.code?.[0] || err?.message || "Code de vérification invalide.");
    } finally {
      setConfirming2FA(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisabling2FA(true);
    setDisableError(null);

    try {
      await authApi.disable2FA({
        password: disablePassword,
        code: disableCode.trim(),
      });
      await refreshUser();
      setIsDisableModalOpen(false);
      setDisablePassword("");
      setDisableCode("");
      setProfileSuccess("L'authentification à deux facteurs a été désactivée.");
    } catch (err: any) {
      console.error("Failed to disable 2FA", err);
      setDisableError(err?.password?.[0] || err?.code?.[0] || err?.message || "Erreur lors de la désactivation du 2FA.");
    } finally {
      setDisabling2FA(false);
    }
  };

  // Download Backup Codes
  const handleDownloadBackupCodes = () => {
    const text = `CODES DE SECOURS 2FA - GESTIMMO\nUtilisateur: ${user?.username}\nDate: ${new Date().toLocaleDateString("fr-FR")}\n\n` +
      backupCodes.map((code, index) => `${index + 1}. ${code}`).join("\n") +
      `\n\nConservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gestimmo-backup-codes-${user?.username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Backup Codes
  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  if (!user) {
    return (
      <PageContainer>
        <div className="py-12 text-center text-[#78716C] text-sm">
          Chargement du profil...
        </div>
      </PageContainer>
    );
  }

  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || user.username?.[0]?.toUpperCase() || "U";

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-[#E0DACB] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-[#1C1917] text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-2xs border border-[#E0DACB] overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">
                  {user.first_name || user.last_name
                    ? `${user.first_name} ${user.last_name}`.trim()
                    : user.username}
                </h1>
                <Badge className="bg-[#EAE3CE] text-[#1C1917] border-[#E0DACB]">
                  {user.role_nom || (user.est_admin_entreprise ? "Admin Entreprise" : "Utilisateur")}
                </Badge>
                {user.two_factor_enabled && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <ShieldCheck className="w-3 h-3 mr-1" /> 2FA Activé
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#78716C] mt-1">
                Gérez vos données personnelles, préférences de sécurité et authentification à deux facteurs.
              </p>
            </div>
          </div>
        </div>

        {profileSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{profileSuccess}</span>
            </div>
            <button onClick={() => setProfileSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {profileError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{profileError}</span>
            </div>
            <button onClick={() => setProfileError(null)} className="text-rose-600 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SECTION 1: Personal Information */}
        <form onSubmit={handleSaveProfile}>
          <Card className="bg-white border-[#E0DACB] shadow-2xs">
            <CardHeader className="border-b border-[#E0DACB]/60 pb-4">
              <CardTitle className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#1C1917]" />
                <span>Informations Personnelles</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Photo Upload Row */}
              <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#E0DACB] flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-[#E0DACB] bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {avatar ? (
                    <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-[#A8A29E]" />
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <span className="text-xs font-bold text-[#1C1917] block">Photo de Profil / Avatar</span>
                  <p className="text-[11px] text-[#78716C]">
                    Format recommandé: PNG ou JPG (carré, max 2 Mo).
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1C1917] text-white hover:bg-[#2C2927] transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{avatar ? "Changer la photo" : "Télécharger une photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                    {avatar && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAvatar("")}
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
                  <label className="text-xs font-semibold text-[#1C1917]">Prénom</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Nom</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Votre nom"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Adresse Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="adresse@domaine.com"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Numéro de Téléphone</label>
                  <Input
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+216 20 000 000"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                {/* Read Only Fields */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#78716C] flex items-center justify-between">
                    <span>Nom d'utilisateur</span>
                    <span className="text-[10px] text-[#A8A29E] flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Non modifiable
                    </span>
                  </label>
                  <Input
                    value={user.username}
                    disabled
                    className="bg-[#F5F2EB] border-[#E0DACB] text-[#78716C] cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#78716C] flex items-center justify-between">
                    <span>Entreprise</span>
                    <span className="text-[10px] text-[#A8A29E] flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Lecture seule
                    </span>
                  </label>
                  <Input
                    value={user.entreprise_nom || "Aucune entreprise"}
                    disabled
                    className="bg-[#F5F2EB] border-[#E0DACB] text-[#78716C] cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#78716C] flex items-center justify-between">
                    <span>Département</span>
                    <span className="text-[10px] text-[#A8A29E] flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> Modifiable par Admin seulement
                    </span>
                  </label>
                  <Input
                    value={user.departement_nom || "Non assigné"}
                    disabled
                    className="bg-[#F5F2EB] border-[#E0DACB] text-[#78716C] cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#78716C] block">Rôle et Privilèges</label>
                  <div className="h-9 px-3 bg-[#F5F2EB] border border-[#E0DACB] rounded-md flex items-center justify-between text-xs text-[#78716C]">
                    <span className="font-semibold text-[#1C1917]">
                      {user.role_nom || (user.est_admin_entreprise ? "Administrateur principal" : "Membre")}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-[#E0DACB]">
                      Lecture seule
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-[#E0DACB]/60 flex justify-end">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[#1C1917] text-white hover:bg-[#2C2927]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* SECTION 2: Security & Change Password */}
        <form onSubmit={handleChangePassword}>
          <Card className="bg-white border-[#E0DACB] shadow-2xs">
            <CardHeader className="border-b border-[#E0DACB]/60 pb-4">
              <CardTitle className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#1C1917]" />
                <span>Sécurité & Mot de Passe</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {passwordSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
                  <span>{passwordSuccess}</span>
                  <button onClick={() => setPasswordSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {passwordError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
                  <span>{passwordError}</span>
                  <button onClick={() => setPasswordError(null)} className="text-rose-600 hover:text-rose-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Mot de passe actuel</label>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Nouveau mot de passe</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="•••••••• (min 6 car.)"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C1917]">Confirmation</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={savingPassword}
                  variant="outline"
                  className="border-[#E0DACB]"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {savingPassword ? "Mise à jour..." : "Changer le mot de passe"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* SECTION 3: Two-Factor Authentication (2FA) */}
        <Card className="bg-white border-[#E0DACB] shadow-2xs">
          <CardHeader className="border-b border-[#E0DACB]/60 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1C1917]" />
                <span>Authentification à Deux Facteurs (2FA)</span>
              </CardTitle>
              {user.two_factor_enabled ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Activé
                </Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                  Désactivé
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs text-[#78716C] leading-relaxed">
              L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte en exigeant un code temporaire à 6 chiffres généré par une application mobile (ex: Google Authenticator, Authy) lors de la connexion.
            </p>

            <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#E0DACB] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${user.two_factor_enabled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {user.two_factor_enabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1C1917] block">
                    Statut 2FA : {user.two_factor_enabled ? "Protection Activée" : "Non configuré"}
                  </span>
                  <span className="text-[11px] text-[#78716C]">
                    {user.two_factor_enabled
                      ? "Votre compte est sécurisé par mot de passe + application TOTP."
                      : "Activez le 2FA pour protéger l'accès à vos données d'entreprise."}
                  </span>
                </div>
              </div>

              {!user.two_factor_enabled ? (
                <Button
                  onClick={handleStart2FASetup}
                  className="bg-[#1C1917] text-white hover:bg-[#2C2927] text-xs shrink-0"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Activer le 2FA
                </Button>
              ) : (
                <Button
                  onClick={() => setIsDisableModalOpen(true)}
                  variant="outline"
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 shrink-0"
                >
                  Désactiver le 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Account Activity & Details */}
        <Card className="bg-white border-[#E0DACB] shadow-2xs">
          <CardHeader className="border-b border-[#E0DACB]/60 pb-4">
            <CardTitle className="text-base font-bold text-[#1C1917] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1C1917]" />
              <span>Activité & Connexions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#E0DACB] flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#78716C]" />
              <div>
                <span className="text-[#78716C] block text-[11px]">Dernière connexion</span>
                <span className="font-semibold text-[#1C1917]">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Première connexion active"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#E0DACB] flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#78716C]" />
              <div>
                <span className="text-[#78716C] block text-[11px]">Date de création du compte</span>
                <span className="font-semibold text-[#1C1917]">
                  {new Date(user.date_creation).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MODAL 1: 2FA Setup Flow */}
      {isSetupModalOpen && setupData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0DACB] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E0DACB] pb-3">
              <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#1C1917]" />
                <span>Configuration de l'authentification 2FA</span>
              </h3>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="text-[#78716C] hover:text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {backupCodes.length === 0 ? (
              <form onSubmit={handleConfirm2FASetup} className="space-y-4">
                <p className="text-xs text-[#78716C] leading-relaxed">
                  1. Scannez ce QR Code avec votre application d'authentification (Google Authenticator, Authy, Microsoft Authenticator...).
                </p>

                <div className="flex flex-col items-center justify-center p-4 bg-[#FAF8F2] border border-[#E0DACB] rounded-2xl">
                  <img
                    src={setupData.qr_code}
                    alt="QR Code 2FA"
                    className="w-48 h-48 rounded-xl shadow-xs bg-white p-2 border border-[#E0DACB]"
                  />
                  <div className="mt-3 text-center">
                    <span className="text-[11px] text-[#78716C] block">Si vous ne pouvez pas scanner, saisissez cette clé :</span>
                    <code className="text-xs font-mono font-bold text-[#1C1917] bg-white px-2 py-1 rounded border border-[#E0DACB] mt-1 inline-block select-all">
                      {setupData.secret}
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#1C1917] block">
                    2. Saisissez le code à 6 chiffres affiché sur votre application :
                  </label>
                  <Input
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value)}
                    placeholder="Ex: 123456"
                    maxLength={6}
                    required
                    className="text-center text-lg tracking-widest font-mono border-[#E0DACB] focus:border-[#1C1917]"
                  />
                </div>

                {setupError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {setupError}
                  </div>
                )}

                <div className="pt-3 border-t border-[#E0DACB] flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSetupModalOpen(false)}
                    className="border-[#E0DACB]"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={confirming2FA || setupCode.length < 6}
                    className="bg-[#1C1917] text-white hover:bg-[#2C2927]"
                  >
                    {confirming2FA ? "Vérification..." : "Vérifier & Activer"}
                  </Button>
                </div>
              </form>
            ) : (
              /* Step 3.4: Display Backup Codes */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Le 2FA a été activé avec succès ! Sauvegardez vos codes de secours ci-dessous.</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#1C1917] block">Codes de secours (Codes à usage unique)</span>
                  <p className="text-[11px] text-[#78716C]">
                    Si vous perdez l'accès à votre application mobile, ces codes vous permettront de vous connecter. Chaque code n'est utilisable qu'une seule fois.
                  </p>
                </div>

                <div className="p-4 bg-[#FAF8F2] border border-[#E0DACB] rounded-2xl grid grid-cols-2 gap-2 font-mono text-xs text-center font-bold text-[#1C1917]">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-[#E0DACB]">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleDownloadBackupCodes}
                    className="flex-1 bg-[#1C1917] text-white hover:bg-[#2C2927] text-xs"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger (.txt)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyBackupCodes}
                    className="text-xs border-[#E0DACB]"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copiedCodes ? "Copié !" : "Copier"}
                  </Button>
                </div>

                <div className="pt-3 border-t border-[#E0DACB] flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setIsSetupModalOpen(false)}
                    className="bg-[#1C1917] text-white"
                  >
                    J'ai sauvegardé mes codes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Disable 2FA Flow */}
      {isDisableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0DACB] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E0DACB] pb-3">
              <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <span>Désactiver le 2FA</span>
              </h3>
              <button
                onClick={() => setIsDisableModalOpen(false)}
                className="text-[#78716C] hover:text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <p className="text-xs text-[#78716C]">
                Pour des raisons de sécurité, veuillez confirmer votre mot de passe actuel et un code 2FA valide avant de désactiver.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1C1917]">Mot de passe actuel</label>
                <Input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="border-[#E0DACB] focus:border-[#1C1917]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1C1917]">Code 2FA (ou code de secours)</label>
                <Input
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  required
                  placeholder="Ex: 123456 ou A1B2-C3D4"
                  className="border-[#E0DACB] focus:border-[#1C1917]"
                />
              </div>

              {disableError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {disableError}
                </div>
              )}

              <div className="pt-3 border-t border-[#E0DACB] flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDisableModalOpen(false)}
                  className="border-[#E0DACB]"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={disabling2FA}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  {disabling2FA ? "Désactivation..." : "Confirmer la désactivation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
