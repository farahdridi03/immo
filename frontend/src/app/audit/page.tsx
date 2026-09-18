"use client";

import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auditApi, type AuditEntry } from "@/services/api/audit";
import {
  ShieldCheck,
  Search,
  User,
  Clock,
  History,
  ArrowRight,
  Filter,
  FileSpreadsheet,
  Loader2,
  PlusCircle,
  Edit3,
  Trash2,
} from "lucide-react";

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEntite, setFilterEntite] = useState("toutes");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await auditApi.list({
        entite: filterEntite !== "toutes" ? filterEntite : undefined,
        search: search ? search : undefined,
      });
      if (Array.isArray(data)) {
        setEntries(data);
      }
    } catch (err) {
      console.error("Erreur chargement journal d'audit:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [filterEntite, search]);

  const totalModifications = entries.filter((e) => e.action_code === "~").length;
  const totalCreations = entries.filter((e) => e.action_code === "+").length;
  const totalSuppressions = entries.filter((e) => e.action_code === "-").length;

  const getActionBadge = (code: string, label: string) => {
    switch (code) {
      case "+":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1 font-semibold">
            <PlusCircle className="w-3 h-3" /> {label}
          </Badge>
        );
      case "~":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 flex items-center gap-1 font-semibold">
            <Edit3 className="w-3 h-3" /> {label}
          </Badge>
        );
      case "-":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 flex items-center gap-1 font-semibold">
            <Trash2 className="w-3 h-3" /> {label}
          </Badge>
        );
      default:
        return <Badge variant="outline">{label}</Badge>;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Historique d'Audit Complet</h1>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-mono text-xs">
                django-simple-history
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Traçabilité et conformité intégrale : enregistrement automatique de chaque action (<strong>Qui</strong>, <strong>Quoi</strong>, <strong>Quand</strong>, <strong>Ancienne valeur ➔ Nouvelle valeur</strong>).
            </p>
          </div>
          <Button onClick={loadAuditLogs} variant="outline" className="shadow-2xs">
            🔄 Actualiser l'historique
          </Button>
        </div>

        {/* Audit Stats KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Total Actions Loguées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{entries.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Événements enregistrés</p>
            </CardContent>
          </Card>

          <Card className="border shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Créations (+)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{totalCreations}</div>
              <p className="text-xs text-muted-foreground mt-1">Nouveaux enregistrements</p>
            </CardContent>
          </Card>

          <Card className="border shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Modifications (~)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalModifications}</div>
              <p className="text-xs text-muted-foreground mt-1">Transitions d'état capturées</p>
            </CardContent>
          </Card>

          <Card className="border shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Suppressions (-)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{totalSuppressions}</div>
              <p className="text-xs text-muted-foreground mt-1">Supprimés de la base</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input
              placeholder="Rechercher utilisateur, entité, code..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="max-w-xs text-xs h-9 bg-background"
            />
            <select
              value={filterEntite}
              onChange={(e) => setFilterEntite(e.target.value)}
              className="h-9 px-3 text-xs border rounded-lg bg-background font-medium focus:outline-none"
            >
              <option value="toutes">Toutes les entités sensibles</option>
              <option value="immobilisation">Immobilisations</option>
              <option value="famille">Familles d'immobilisations</option>
              <option value="amortissement">Plans d'Amortissement</option>
              <option value="contrat">Contrats de Maintenance</option>
              <option value="emplacement">Emplacements & Sites</option>
              <option value="intervention">Interventions</option>
              <option value="utilisateur">Utilisateurs</option>
              <option value="role">Rôles & Permissions</option>
            </select>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {entries.length} entrée(s) trouvée(s)
          </div>
        </div>

        {/* Audit Log Table */}
        <Card className="border shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Journal d'Audit Complet (Audit Trail)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Chargement de l'historique d'audit...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-2">
                <History className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="font-semibold text-foreground">Aucune action d'audit enregistrée</p>
                <p>Effectuez une modification sur une immobilisation, un contrat ou un emplacement pour générer un log d'audit.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-3 px-4">Date & Heure (Quand)</th>
                      <th className="py-3 px-4">Auteur / Utilisateur (Qui)</th>
                      <th className="py-3 px-4">Action & Entité (Quoi)</th>
                      <th className="py-3 px-4">Élément Modifié</th>
                      <th className="py-3 px-4">Modifications (Ancienne ➔ Nouvelle Valeur)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(item.quand).toLocaleString("fr-FR")}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{item.qui}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {getActionBadge(item.action_code, item.type_action)}
                            <span className="text-[11px] block font-mono text-muted-foreground">{item.entite}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {item.objet_concerne}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.modifications && item.modifications.length > 0 ? (
                            <div className="space-y-1.5">
                              {item.modifications.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-muted/40 p-1.5 px-2.5 rounded-lg border text-[11px]">
                                  <span className="font-bold text-foreground shrink-0">{m.champ} :</span>
                                  <span className="line-through text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded font-mono">
                                    {m.ancienne_valeur}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-mono">
                                    {m.nouvelle_valeur}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : item.action_code === "+" ? (
                            <span className="text-emerald-600 font-medium italic">Enregistrement initial créé</span>
                          ) : item.action_code === "-" ? (
                            <span className="text-rose-600 font-medium italic">Enregistrement supprimé</span>
                          ) : (
                            <span className="text-muted-foreground italic">Aucun changement de valeur spécifique</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
