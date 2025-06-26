import { createClient } from '@supabase/supabase-js';
import { BudgetCategory } from '../types/budget';
import { Project } from '../types/project';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface PendingSync {
  id: string;
  type: 'project' | 'quote' | 'budget';
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingSyncs: number;
  isSyncing: boolean;
  lastSync?: Date;
}

export class SyncManager {
  private static instance: SyncManager;
  private pendingSyncs: PendingSync[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private lastSync?: Date;

  private constructor() {
    // Charger les opérations en attente depuis localStorage
    const stored = localStorage.getItem('pendingSyncs');
    if (stored) {
      try {
        this.pendingSyncs = JSON.parse(stored);
        console.log(`[SyncManager] ${this.pendingSyncs.length} opérations de synchronisation en attente chargées`);
      } catch (error) {
        console.error('[SyncManager] Erreur lors du chargement des opérations en attente:', error);
        this.pendingSyncs = [];
      }
    }

    // Écouter les événements en ligne/hors ligne
    window.addEventListener('online', () => this.handleOnlineStatus(true));
    window.addEventListener('offline', () => this.handleOnlineStatus(false));
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  private handleOnlineStatus(online: boolean) {
    console.log(`[SyncManager] Statut réseau changé: ${online ? 'en ligne' : 'hors ligne'}`);
    this.isOnline = online;
    if (online) {
      // Tenter de synchroniser les opérations en attente
      setTimeout(() => this.processPendingSyncs(), 1000); // Délai pour laisser le réseau se stabiliser
    }
    this.notifyListeners();
  }

  /**
   * Traiter les opérations en attente
   * @returns Promise qui se résout à true si toutes les opérations ont réussi
   */
  async processPendingSyncs(): Promise<boolean> {
    if (!this.isOnline || this.pendingSyncs.length === 0 || this.isSyncing) {
      return false;
    }

    console.log(`[SyncManager] Traitement de ${this.pendingSyncs.length} opérations en attente`);
    this.isSyncing = true;
    this.notifyListeners();

    const failedSyncs: PendingSync[] = [];
    let success = true;

    for (const sync of this.pendingSyncs) {
      try {
        console.log(`[SyncManager] Traitement de l'opération: ${sync.type}/${sync.operation}/${sync.id}`);
        
        switch (sync.type) {
          case 'project':
            await this.syncProject(sync);
            break;
          case 'quote':
            await this.syncQuote(sync);
            break;
          case 'budget':
            await this.syncBudget(sync);
            break;
        }
      } catch (error) {
        console.error(`[SyncManager] Échec de la synchronisation ${sync.type}/${sync.id}:`, error);
        failedSyncs.push(sync);
        success = false;
      }
    }

    // Mettre à jour les opérations en attente avec uniquement celles qui ont échoué
    this.pendingSyncs = failedSyncs;
    this.savePendingSyncs();
    this.isSyncing = false;
    this.lastSync = new Date();
    this.notifyListeners();
    
    console.log(`[SyncManager] Synchronisation terminée. ${this.pendingSyncs.length} opérations restent en attente.`);
    
    return success;
  }

  private async syncProject(sync: PendingSync) {
    const { operation, data } = sync;
    
    switch (operation) {
      case 'insert':
        await supabase.from('projects').insert(data);
        break;
      case 'update':
        await supabase.from('projects').update(data).eq('id', sync.id);
        break;
      case 'delete':
        await supabase.from('projects').delete().eq('id', sync.id);
        break;
    }
  }

  private async syncQuote(sync: PendingSync) {
    const { operation, data } = sync;
    
    switch (operation) {
      case 'insert':
        await supabase.from('quotes').insert(data);
        break;
      case 'update':
        await supabase.from('quotes').update(data).eq('id', sync.id);
        break;
      case 'delete':
        await supabase.from('quotes').update({ is_deleted: true }).eq('id', sync.id);
        break;
    }
  }

  private async syncBudget(sync: PendingSync) {
    const { operation, data } = sync;
    
    switch (operation) {
      case 'insert':
        // Logique spéciale pour l'insertion d'un item individuel
        if (data.item) {
          console.log('[SyncManager] Synchronisation d\'un item individuel non implémentée, utilisation de la méthode de mise à jour complète');
          // Dans ce cas, on met simplement à jour l'ensemble du budget
          await this.syncBudgetComplete(sync);
        } else {
          await this.syncBudgetComplete(sync);
        }
        break;
      case 'update':
        // Logique spéciale pour la mise à jour d'un item individuel
        if (data.itemId) {
          console.log('[SyncManager] Synchronisation d\'un item individuel non implémentée, utilisation de la méthode de mise à jour complète');
          // Dans ce cas, on met simplement à jour l'ensemble du budget
          await this.syncBudgetComplete(sync);
        } else {
          await this.syncBudgetComplete(sync);
        }
        break;
      case 'delete':
        if (data.isWorkBudget) {
          await supabase.from('quote_work_budgets').delete().eq('quote_id', data.quoteId);
        } else {
          // Nous ne supprimons jamais vraiment les budgets, nous les remplaçons par un tableau vide
          await this.syncBudgetComplete(sync);
        }
        break;
    }
  }

  /**
   * Synchroniser un budget complet
   */
  private async syncBudgetComplete(sync: PendingSync) {
    const { data } = sync;
    
    if (data.work_budget_data || data.isWorkBudget) {
      // Budget de travail
      const budget = data.work_budget_data || data.budget_data || [];
      const quoteId = data.quoteId || sync.id;
      
      await supabase
        .from('quote_work_budgets')
        .upsert(
          { 
            quote_id: quoteId, 
            budget_data: budget,
            comments: data.comments || {},
            updated_at: new Date().toISOString()
          },
          { onConflict: 'quote_id' }
        );
    } else {
      // Budget normal
      const budget = data.budget_data || [];
      const quoteId = data.quoteId || sync.id;
      
      await supabase
        .from('quote_budgets')
        .upsert(
          { 
            quote_id: quoteId, 
            budget_data: budget,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'quote_id' }
        );
    }
  }

  private savePendingSyncs() {
    localStorage.setItem('pendingSyncs', JSON.stringify(this.pendingSyncs));
  }

  /**
   * Ajouter une opération de synchronisation en attente
   */
  addPendingSync(sync: Omit<PendingSync, 'timestamp'>) {
    console.log(`[SyncManager] Ajout d'une opération en attente: ${sync.type}/${sync.operation}/${sync.id}`);
    
    this.pendingSyncs.push({
      ...sync,
      timestamp: Date.now()
    });
    this.savePendingSyncs();
    this.notifyListeners();

    // Si nous sommes en ligne, tenter de synchroniser immédiatement
    if (this.isOnline && !this.isSyncing) {
      this.processPendingSyncs();
    }
  }

  /**
   * S'abonner aux changements de statut de synchronisation
   */
  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.add(listener);
    // Appeler immédiatement avec l'état actuel
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Obtenir l'état actuel de la synchronisation
   */
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      pendingSyncs: this.pendingSyncs.length,
      isSyncing: this.isSyncing,
      lastSync: this.lastSync
    };
  }

  /**
   * Vider toutes les opérations en attente
   * Utile pour les tests ou réinitialiser l'état
   */
  clearPendingSyncs() {
    this.pendingSyncs = [];
    this.savePendingSyncs();
    this.notifyListeners();
  }
}