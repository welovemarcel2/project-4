import { SyncManager } from '../syncManager';

/**
 * Vérifier si des opérations de synchronisation sont en cours
 * @param quoteId L'ID du devis concerné (optionnel)
 * @returns Un objet contenant l'état de synchronisation
 */
export function checkSyncStatus(quoteId?: string): {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncs: number;
  lastSync?: Date;
} {
  const syncManager = SyncManager.getInstance();
  const status = syncManager.getStatus();
  
  // Si un quoteId est fourni, on pourrait filtrer les opérations en attente
  // spécifiques à ce devis (fonctionnalité à implémenter dans SyncManager)
  
  return {
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    pendingSyncs: status.pendingSyncs,
    lastSync: status.lastSync
  };
}

/**
 * S'abonner aux changements d'état de synchronisation
 * @param callback Fonction à appeler lors d'un changement
 * @returns Fonction de désabonnement
 */
export function subscribeSyncStatus(
  callback: (status: { 
    isOnline: boolean; 
    isSyncing: boolean; 
    pendingSyncs: number;
    lastSync?: Date;
  }) => void
): () => void {
  const syncManager = SyncManager.getInstance();
  return syncManager.subscribe(callback);
}

/**
 * Forcer une tentative de synchronisation immédiate
 * @returns Promise résolu lorsque la synchronisation est terminée
 */
export async function forceSynchronization(): Promise<boolean> {
  const syncManager = SyncManager.getInstance();
  return syncManager.processPendingSyncs();
}