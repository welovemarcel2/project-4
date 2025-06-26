import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { SyncManager } from '../../utils/syncManager';

interface SyncStatusIndicatorProps {
  quoteId: string;
}

export function SyncStatusIndicator({ quoteId }: SyncStatusIndicatorProps) {
  const [syncState, setSyncState] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null as Date | null,
    error: null as string | null,
    pendingSyncs: 0
  });
  
  useEffect(() => {
    // S'abonner aux changements de statut de synchronisation
    const unsubscribe = SyncManager.getInstance().subscribe(status => {
      setSyncState(prev => ({
        ...prev,
        isOnline: status.isOnline,
        isSyncing: status.isSyncing,
        pendingSyncs: status.pendingSyncs
      }));
    });
    
    // Gestion des événements en ligne/hors ligne
    const handleOnlineStatus = () => {
      setSyncState(prev => ({
        ...prev, 
        isOnline: navigator.onLine
      }));
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [quoteId]);

  if (!syncState.isOnline) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-amber-700 bg-amber-50 rounded-md">
        <CloudOff size={14} />
        <span className="text-xs font-medium">Hors ligne</span>
        {syncState.pendingSyncs > 0 && (
          <span className="bg-amber-200 px-1.5 py-0.5 rounded text-xs font-medium">
            {syncState.pendingSyncs}
          </span>
        )}
      </div>
    );
  }

  if (syncState.isSyncing) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-blue-600 bg-blue-50 rounded-md">
        <RefreshCw size={14} className="animate-spin" />
        <span className="text-xs font-medium">Synchronisation...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-green-600 bg-green-50 rounded-md">
      <Cloud size={14} />
      <span className="text-xs font-medium">Synchronisé</span>
    </div>
  );
}