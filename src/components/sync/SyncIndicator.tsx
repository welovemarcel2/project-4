import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { SyncManager } from '../../utils/syncManager';
import { SyncStatus } from '../../types/sync';

export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>(SyncManager.getInstance().getStatus());

  useEffect(() => {
    const unsubscribe = SyncManager.getInstance().subscribe(setStatus);
    return () => unsubscribe();
  }, []);

  if (!status.isOnline) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-red-600 bg-red-50 rounded-md" title="Hors ligne">
        <CloudOff size={16} />
        <span className="text-xs font-medium">Hors ligne</span>
        {status.pendingSyncs > 0 && (
          <span className="text-xs bg-red-100 px-1.5 py-0.5 rounded">
            {status.pendingSyncs}
          </span>
        )}
      </div>
    );
  }

  if (status.isSyncing) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-blue-600 bg-blue-50 rounded-md" title="Synchronisation en cours">
        <RefreshCw size={16} className="animate-spin" />
        <span className="text-xs font-medium">Synchronisation...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-green-600 bg-green-50 rounded-md" title="Synchronisé">
      <Cloud size={16} />
      <span className="text-xs font-medium">Synchronisé</span>
    </div>
  );
}