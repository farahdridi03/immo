/**
 * Standard API Response envelope definition.
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    status_code: number;
    type: string;
    details: unknown;
  };
  success?: boolean;
}

/**
 * Backend API Health Check response schema.
 */
export interface HealthStatusResponse {
  status: "healthy" | "unhealthy";
  service: string;
  database: {
    engine: string;
    status: "connected" | "disconnected";
  };
  version: string;
}

export type StatutValidationEntreprise = "en_attente" | "approuve" | "rejete";
export type StatutCompteUser = "en_attente_validation" | "actif" | "inactif" | "suspendu";

/**
 * Schema for Entreprise entity.
 */
export interface Entreprise {
  id: number;
  nom: string;
  matricule_fiscal?: string | null;
  adresse?: string;
  telephone?: string;
  email?: string;
  logo?: string | null;
  secteur_activite?: string;
  statut_validation: StatutValidationEntreprise;
  date_demande?: string;
  date_validation?: string | null;
  motif_rejet?: string | null;
  date_creation: string;
  actif: boolean;
  departements_count?: number;
  delai_alerte_expiration_jours?: number;
  destinataires_alertes?: "admin_uniquement" | "responsables_et_admin" | "tous";
}

/**
 * Schema for Permission entity.
 */
export interface Permission {
  id: number;
  code: string;
  nom: string;
  module: string;
}

/**
 * Schema for RolePermission pivot entity.
 */
export interface RolePermission {
  id: number;
  role: number;
  permission: number;
  permission_detail?: Permission;
}

/**
 * Schema for Role entity.
 */
export interface Role {
  id: number;
  nom: string;
  description?: string;
  entreprise: number;
  entreprise_nom?: string;
  permissions?: number[];
  permissions_details?: Permission[];
  utilisateurs_count?: number;
  date_creation: string;
  actif: boolean;
}

/**
 * Schema for Departement entity.
 */
export interface Departement {
  id: number;
  nom: string;
  entreprise: number;
  entreprise_nom?: string;
  responsable?: number | null;
  responsable_nom?: string | null;
  date_creation: string;
  actif: boolean;
}

export interface UserPreference {
  id: number;
  notif_email_contrats: boolean;
  notif_email_mouvements: boolean;
  notif_email_amortissements: boolean;
  notif_email_interventions: boolean;
  notif_inapp_enabled: boolean;
  langue: "fr" | "ar";
  theme: "clair" | "sombre";
  devise: "TND" | "EUR" | "USD";
  items_par_page: 10 | 25 | 50;
}

/**
 * Schema for Utilisateur (User) entity.
 */
export interface Utilisateur {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  entreprise?: number | null;
  entreprise_nom?: string;
  role?: number | null;
  role_nom?: string;
  departement?: number | null;
  departement_nom?: string;
  telephone?: string;
  avatar?: string | null;
  two_factor_enabled?: boolean;
  statut_compte: StatutCompteUser;
  est_admin_entreprise: boolean;
  actif: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser?: boolean;
  permissions?: string[];
  preferences?: UserPreference;
  last_login?: string | null;
  date_creation: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  user_telephone?: string;
  entreprise_nom: string;
  matricule_fiscal?: string;
  adresse?: string;
  entreprise_telephone?: string;
  entreprise_email?: string;
  secteur_activite?: string;
}

export interface LoginResponse {
  access?: string;
  refresh?: string;
  user?: Utilisateur;
  requires_2fa?: boolean;
  temp_token?: string;
}

export interface Setup2FAResponse {
  secret: string;
  qr_code: string;
  uri: string;
}

export interface Confirm2FAResponse {
  detail: string;
  backup_codes: string[];
}


/**
 * Types & Enums for Emplacement and Immobilisation
 */
export type TypeEmplacement = "bureau" | "depot" | "chantier" | "agence";

export type EtatImmobilisation =
  | "neuf"
  | "bon"
  | "moyen"
  | "mauvais"
  | "hors_service";

export type StatutImmobilisation =
  | "en_service"
  | "en_maintenance"
  | "reforme"
  | "cede";

/**
 * Schema for Famille entity.
 */
export interface Famille {
  id: number;
  nom: string;
  code: string;
  description?: string;
  entreprise: number;
  entreprise_nom?: string;
}

/**
 * Schema for Emplacement entity.
 */
export interface Emplacement {
  id: number;
  code_emplacement: string;
  entreprise: number;
  entreprise_nom?: string;
  nom_emplacement: string;
  type: TypeEmplacement;
  type_display?: string;
  adresse?: string;
  responsable?: string;
  description?: string;
}

/**
 * Schema for Immobilisation entity.
 */
export interface Immobilisation {
  id: number;
  code_inventaire: string;
  entreprise: number;
  entreprise_nom?: string;
  designation: string;
  description?: string;
  famille?: number | null;
  famille_nom?: string | null;
  fournisseur?: string;
  numero_serie?: string;
  date_acquisition?: string | null;
  valeur_acquisition?: string | number | null;
  etat: EtatImmobilisation;
  etat_display?: string;
  statut: StatutImmobilisation;
  statut_display?: string;
  emplacement_actuel?: number | null;
  emplacement_actuel_nom?: string | null;
  date_mise_en_service?: string | null;
  image?: string | null;
  qr_code_base64?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Schema for MouvementEmplacement entity.
 */
export interface MouvementEmplacement {
  id: number;
  immobilisation: number;
  immobilisation_code?: string;
  immobilisation_designation?: string;
  ancien_emplacement?: number | null;
  ancien_emplacement_nom?: string | null;
  nouvel_emplacement?: number | null;
  nouvel_emplacement_nom?: string | null;
  date_transfert: string;
  responsable_transfert?: number | null;
  responsable_transfert_nom?: string | null;
  utilisateur_concerne?: number | null;
  utilisateur_concerne_nom?: string | null;
  motif?: string;
  commentaire?: string;
}




export type ModeAmortissement = "lineaire" | "degressif";

export interface EcritureAmortissement {
  id: number;
  plan: number;
  exercice: number;
  annuite: string | number;
  amortissement_cumule: string | number;
  valeur_nette_comptable: string | number;
  date_calcul: string;
}

export interface PlanAmortissement {
  id: number;
  immobilisation: number;
  immobilisation_code?: string;
  immobilisation_designation?: string;
  valeur_acquisition: string | number;
  date_debut_amortissement: string;
  duree_amortissement: number;
  taux_amortissement: string | number;
  mode_amortissement: ModeAmortissement;
  mode_amortissement_display?: string;
  valeur_residuelle: string | number;
  ecritures?: EcritureAmortissement[];
  created_at: string;
  updated_at: string;
}


export type TypeMaintenance = "preventive" | "corrective";
export type PeriodiciteMaintenance = "mensuelle" | "trimestrielle" | "annuelle";
export type StatutContrat = "actif" | "expire" | "resilie";
export type StatutIntervention = "planifie" | "en_cours" | "realise" | "annule";
export type StatutAlerte = "non_lu" | "lu";

export interface DocumentContrat {
  id: number;
  contrat: number;
  fichier: string;
  nom: string;
  date_ajout: string;
}

export interface ImmobilisationContrat {
  id: number;
  contrat: number;
  immobilisation: number;
  immobilisation_code?: string;
  immobilisation_designation?: string;
}

export interface ContratMaintenance {
  id: number;
  reference: string;
  entreprise?: number;
  entreprise_nom?: string;
  fournisseur: string;
  date_debut: string;
  date_fin: string;
  montant: string | number;
  type_maintenance: TypeMaintenance;
  type_maintenance_display?: string;
  periodicite: PeriodiciteMaintenance;
  periodicite_display?: string;
  statut: StatutContrat;
  statut_display?: string;
  documents?: DocumentContrat[];
  immobilisations_details?: ImmobilisationContrat[];
  interventions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Intervention {
  id: number;
  contrat?: number | null;
  contrat_reference?: string | null;
  immobilisation: number;
  immobilisation_code?: string;
  immobilisation_designation?: string;
  date_intervention: string;
  type_intervention: string;
  description?: string;
  technicien?: string;
  cout: string | number;
  statut: StatutIntervention;
  statut_display?: string;
  created_at: string;
  updated_at: string;
}

export interface Alerte {
  id: number;
  contrat?: number | null;
  contrat_reference?: string | null;
  immobilisation?: number | null;
  immobilisation_code?: string | null;
  type_alerte: string;
  type_alerte_display?: string;
  lien_cible?: string | null;
  message: string;
  date_alerte: string;
  destinataire: number;
  destinataire_username?: string;
  statut_lecture: StatutAlerte;
  statut_lecture_display?: string;
}
