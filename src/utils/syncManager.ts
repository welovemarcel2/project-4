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

export class SyncManager {
  private static instance: SyncManager;
  private pendingSyncs: PendingSync[] = [];
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  private constructor() {
    // Load pending syncs from localStorage
    const stored = localStorage.getItem('pendingSyncs');
    if (stored) {
      this.pendingSyncs = JSON.parse(stored);
    }

    // Listen for online/offline events
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
    this.isOnline = online;
    if (online) {
      this.processPendingSyncs();
    }
    this.notifyListeners();
  }

  private async processPendingSyncs() {
    if (!this.isOnline || this.pendingSyncs.length === 0) return;

    const failedSyncs: PendingSync[] = [];

    for (const sync of this.pendingSyncs) {
      try {
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
        console.error(`Failed to sync ${sync.type}:`, error);
        failedSyncs.push(sync);
      }
    }

    // Update pending syncs with only failed ones
    this.pendingSyncs = failedSyncs;
    this.savePendingSyncs();
    this.notifyListeners();
  }

  private async syncProject(sync: PendingSync) {
    const { operation, data } = sync;
    
    switch (operation) {
      case 'insert':
        await supabase.from('projects').insert(data);
        break;
      case 'update':
        await supabase.from('projects').update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('projects').delete().eq('id', data.id);
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
        await supabase.from('quotes').update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('quotes').delete().eq('id', data.id);
        break;
    }
  }

  private async syncBudget(sync: PendingSync) {
    const { operation, data } = sync;
    
    switch (operation) {
      case 'insert':
        await supabase.from('budgets').insert(data);
        break;
      case 'update':
        await supabase.from('budgets').update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('budgets').delete().eq('id', data.id);
        break;
    }
  }

  private savePendingSyncs() {
    localStorage.setItem('pendingSyncs', JSON.stringify(this.pendingSyncs));
  }

  addPendingSync(sync: Omit<PendingSync, 'timestamp'>) {
    this.pendingSyncs.push({
      ...sync,
      timestamp: Date.now()
    });
    this.savePendingSyncs();
    this.notifyListeners();

    if (this.isOnline) {
      this.processPendingSyncs();
    }
  }

  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const status: SyncStatus = {
      isOnline: this.isOnline,
      pendingSyncs: this.pendingSyncs.length,
      isSyncing: this.isOnline && this.pendingSyncs.length > 0
    };

    this.listeners.forEach(listener => listener(status));
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      pendingSyncs: this.pendingSyncs.length,
      isSyncing: this.isOnline && this.pendingSyncs.length > 0
    };
  }
}