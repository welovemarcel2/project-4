import { Project } from './project';

export type UserRole = 'production' | 'user';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;  // Added phone number field
  role: UserRole;
  productionName?: string;
  productionAddress?: string;  // Added production address
  productionLogo?: string;    // Added production logo
  productionTerms?: string;   // Added production terms and conditions
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermissions {
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canCreateQuotes: boolean;
  canEditQuotes: boolean;
  canValidateQuotes: boolean;
  canAccessBudgets: boolean;
  canEditBudgets: boolean;
  canExportBudgets: boolean;
  canManageProductionSettings: boolean;
}

export const PRODUCTION_PERMISSIONS: UserPermissions = {
  canCreateProjects: true,
  canEditProjects: true,
  canDeleteProjects: true,
  canCreateQuotes: true,
  canEditQuotes: true,
  canValidateQuotes: true,
  canAccessBudgets: true,
  canEditBudgets: true,
  canExportBudgets: true,
  canManageProductionSettings: true
};

export const USER_PERMISSIONS: UserPermissions = {
  canCreateProjects: true,
  canEditProjects: true,
  canDeleteProjects: true,
  canCreateQuotes: true,
  canEditQuotes: true,
  canValidateQuotes: true,
  canAccessBudgets: true,
  canEditBudgets: true,
  canExportBudgets: true,
  canManageProductionSettings: false
};