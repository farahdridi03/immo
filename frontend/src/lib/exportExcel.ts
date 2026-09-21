import type { PlanAmortissement, EcritureAmortissement } from "@/types/api";

/**
 * Utility helper to export a single Plan d'Amortissement schedule to Excel (.xls).
 * Uses Excel HTML/XML format compatible with Microsoft Excel, LibreOffice Calc, and Google Sheets.
 */
export function exportPlanAmortissementToExcel(plan: PlanAmortissement) {
  const code = plan.immobilisation_code || `ID_${plan.immobilisation}`;
  const designation = plan.immobilisation_designation || `Immobilisation #${plan.immobilisation}`;
  const mode = plan.mode_amortissement_display || (plan.mode_amortissement === "degressif" ? "Dégressif" : "Linéaire");
  const valAcquisition = Number(plan.valeur_acquisition || 0);
  const valResiduelle = Number(plan.valeur_residuelle || 0);
  const dateDebut = plan.date_debut_amortissement || "";
  const duree = plan.duree_amortissement || 0;
  const taux = Number(plan.taux_amortissement || 0);

  const ecritures: EcritureAmortissement[] = plan.ecritures || [];

  const filename = `Tableau_Amortissement_${code.replace(/[^a-zA-Z0-9_-]/g, "_")}.xls`;

  // Total annuités calculation
  const totalAnnuite = ecritures.reduce((sum, e) => sum + Number(e.annuite || 0), 0);
  const lastEcriture = ecritures.length > 0 ? ecritures[ecritures.length - 1] : null;
  const totalCumul = lastEcriture ? Number(lastEcriture.amortissement_cumule || 0) : 0;
  const vncFinale = lastEcriture ? Number(lastEcriture.valeur_nette_comptable || 0) : valAcquisition;

  const rowsHtml = ecritures
    .map(
      (e) => `
    <tr>
      <td style="text-align: center; font-weight: bold;">${e.exercice}</td>
      <td style="text-align: right; mso-number-format:'\\#\\,\\#\\#0\\.00';">${Number(e.annuite).toFixed(2)}</td>
      <td style="text-align: right; mso-number-format:'\\#\\,\\#\\#0\\.00';">${Number(e.amortissement_cumule).toFixed(2)}</td>
      <td style="text-align: right; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0\\.00';">${Number(e.valeur_nette_comptable).toFixed(2)}</td>
      <td style="text-align: center;">${e.date_calcul || ""}</td>
    </tr>`
    )
    .join("");

  const excelTemplate = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Tableau Amortissement</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #CBD5E1; padding: 6px 10px; }
    .title-banner { background-color: #1E3A8A; color: #FFFFFF; font-size: 14pt; font-weight: bold; text-align: center; padding: 10px; }
    .meta-table { margin-bottom: 15px; width: 100%; }
    .meta-label { background-color: #F1F5F9; font-weight: bold; color: #334155; width: 25%; }
    .meta-val { width: 25%; }
    .header-row th { background-color: #0F172A; color: #FFFFFF; font-weight: bold; text-align: center; font-size: 10pt; text-transform: uppercase; }
    .total-row td { background-color: #F8FAFC; font-weight: bold; border-top: 2px solid #0F172A; }
    .footer-note { font-size: 9pt; color: #64748B; margin-top: 15px; font-style: italic; }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="5" class="title-banner">TABLEAU D'AMORTISSEMENT</td>
    </tr>
  </table>
  <br/>
  <table class="meta-table">
    <tr>
      <td class="meta-label">Code Inventaire:</td>
      <td class="meta-val"><b>${code}</b></td>
      <td class="meta-label">Mode Amortissement:</td>
      <td class="meta-val"><b>${mode}</b></td>
    </tr>
    <tr>
      <td class="meta-label">Désignation:</td>
      <td class="meta-val"><b>${designation}</b></td>
      <td class="meta-label">Durée & Taux:</td>
      <td class="meta-val">${duree} ans (${taux.toFixed(2)}%)</td>
    </tr>
    <tr>
      <td class="meta-label">Valeur d'Acquisition:</td>
      <td class="meta-val"><b>${valAcquisition.toFixed(2)} DT</b></td>
      <td class="meta-label">Date Début Amort.:</td>
      <td class="meta-val">${dateDebut}</td>
    </tr>
    <tr>
      <td class="meta-label">Valeur Résiduelle:</td>
      <td class="meta-val">${valResiduelle.toFixed(2)} DT</td>
      <td class="meta-label">Date d'Export:</td>
      <td class="meta-val">${new Date().toLocaleDateString("fr-FR")}</td>
    </tr>
  </table>
  <br/>
  <table>
    <thead>
      <tr class="header-row">
        <th>Exercice (Année)</th>
        <th>Annuité (DT)</th>
        <th>Amortissement Cumulé (DT)</th>
        <th>Valeur Nette Comptable - VNC (DT)</th>
        <th>Date de Calcul</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr class="total-row">
        <td style="text-align: center;">TOTAL</td>
        <td style="text-align: right; mso-number-format:'\\#\\,\\#\\#0\\.00';">${totalAnnuite.toFixed(2)}</td>
        <td style="text-align: right; mso-number-format:'\\#\\,\\#\\#0\\.00';">${totalCumul.toFixed(2)}</td>
        <td style="text-align: right; mso-number-format:'\\#\\,\\#\\#0\\.00';">${vncFinale.toFixed(2)}</td>
        <td style="text-align: center;">-</td>
      </tr>
    </tbody>
  </table>
  <p class="footer-note">Généré le ${new Date().toLocaleString("fr-FR")} — Système d'Inventaire et Amortissements</p>
</body>
</html>
`;

  downloadBlob(excelTemplate, filename, "application/vnd.ms-excel;charset=utf-8;");
}

/**
 * Utility helper to export all Plans d'Amortissement list to Excel (.xls).
 */
export function exportAllPlansToExcel(plans: PlanAmortissement[]) {
  const filename = `Liste_Plans_Amortissement_${new Date().toISOString().split("T")[0]}.xls`;

  const rowsHtml = plans
    .map((p) => {
      const lastEcriture = p.ecritures && p.ecritures.length > 0 ? p.ecritures[p.ecritures.length - 1] : null;
      const valAcq = Number(p.valeur_acquisition || 0);
      const cumul = lastEcriture ? Number(lastEcriture.amortissement_cumule || 0) : 0;
      const vnc = lastEcriture ? Number(lastEcriture.valeur_nette_comptable || valAcq) : valAcq;
      const mode = p.mode_amortissement_display || (p.mode_amortissement === "degressif" ? "Dégressif" : "Linéaire");

      return `
    <tr>
      <td style="text-align: left;"><b>${p.immobilisation_code || ""}</b></td>
      <td style="text-align: left;">${p.immobilisation_designation || ""}</td>
      <td style="text-align: center;">${mode}</td>
      <td style="text-align: center;">${p.date_debut_amortissement || ""}</td>
      <td style="text-align: center;">${p.duree_amortissement || 0} ans</td>
      <td style="text-align: right;">${Number(p.taux_amortissement || 0).toFixed(2)}%</td>
      <td style="text-align: right; mso-number-format:'\\#\\,\\#\\#0\\.00';">${valAcq.toFixed(2)}</td>
      <td style="text-align: right; mso-number-format:'\\#\\,\\#\\#0\\.00';">${cumul.toFixed(2)}</td>
      <td style="text-align: right; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0\\.00';">${vnc.toFixed(2)}</td>
    </tr>`;
    })
    .join("");

  const excelTemplate = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Plans d'Amortissement</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #CBD5E1; padding: 6px 8px; }
    .title-banner { background-color: #1E3A8A; color: #FFFFFF; font-size: 14pt; font-weight: bold; text-align: center; padding: 10px; }
    .header-row th { background-color: #0F172A; color: #FFFFFF; font-weight: bold; text-align: center; font-size: 9pt; text-transform: uppercase; }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="9" class="title-banner">LISTE DES PLANS D'AMORTISSEMENT</td>
    </tr>
  </table>
  <br/>
  <table>
    <thead>
      <tr class="header-row">
        <th>Code Inventaire</th>
        <th>Désignation</th>
        <th>Mode</th>
        <th>Date Début</th>
        <th>Durée</th>
        <th>Taux</th>
        <th>Valeur Acquisition (DT)</th>
        <th>Amortissement Cumulé (DT)</th>
        <th>VNC Actuelle (DT)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>
`;

  downloadBlob(excelTemplate, filename, "application/vnd.ms-excel;charset=utf-8;");
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
