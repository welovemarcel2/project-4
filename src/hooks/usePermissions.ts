import { useUserStore } from '../stores/userStore';
import { UserPermissions, PRODUCTION_PERMISSIONS, USER_PERMISSIONS } from '../types/user';

export function usePermissions(): UserPermissions {
  const currentUser = useUserStore(state => state.currentUser);
  
  if (!currentUser) {
    return USER_PERMISSIONS;
  }

  return currentUser.role === 'production' ? PRODUCTION_PERMISSIONS : USER_PERMISSIONS;
}

export function isProductionEmail(email: string): boolean {
  // Vérifier si l'email correspond au format nom.prenom@nomdelaproduction.com
  const emailRegex = /^[a-zA-Z]+\.[a-zA-Z]+@[a-zA-Z0-9-]+\.com$/;
  return emailRegex.test(email);
}

export function extractProductionName(email: string): string {
  if (!isProductionEmail(email)) return '';
  const domain = email.split('@')[1];
  return domain.split('.')[0];
}