import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, RotateCcw, Save } from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { useUserStore } from '../../stores/userStore';
import { BudgetCategory } from '../../types/budget';
import { formatNumber } from '../../utils/formatNumber';

interface HistoryPanelProps {
  projectId: string;
  quoteId: string;
  currentBudget: BudgetCategory[];
  onRestore: (budget: BudgetCategory[]) => void;
  onSave: () => Promise<void>;
}

export function HistoryPanel({ 
  projectId,
  quoteId,
  currentBudget, 
  onRestore, 
  onSave 
}: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useUserStore(state => state.currentUser);
  const { getHistory, createVersion } = useHistoryStore();
  const history = getHistory(projectId, quoteId);

  const handleSave = async () => {
    if (!currentUser) return;
    
    try {
      await createVersion(projectId, quoteId, currentBudget, currentUser, 'Sauvegarde manuelle');
      await onSave();
    } catch (error) {
      console.error('Error during manual save:', error);
    }
  };

  const handleRestore = async (versionId: string) => {
    const restoredBudget = useHistoryStore.getState().restoreVersion(projectId, versionId);
    if (restoredBudget) {
      onRestore(restoredBudget);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          title="Historique des modifications"
        >
          <History size={20} />
        </button>

        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md ${
            history?.isDirty
              ? 'text-amber-700 hover:bg-amber-50'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Sauvegarder les modifications"
        >
          <Save size={16} />
          {history?.isDirty ? 'Non sauvegardé' : 'Sauvegardé'}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Overlay to catch clicks outside the panel */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* History panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Historique des modifications</h3>
              {history?.lastSavedAt && (
                <p className="text-sm text-gray-500 mt-1">
                  Dernière sauvegarde le{' '}
                  {format(history.lastSavedAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!history?.versions || history.versions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucune modification enregistrée
                </div>
              ) : (
                <div className="divide-y">
                  {history.versions.map((version) => (
                    <div key={version.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {version.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(version.timestamp, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                            {' par '}
                            {version.user.firstName} {version.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Total : {formatNumber(version.totalAmount)} €
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestore(version.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Restaurer cette version"
                        >
                          <RotateCcw size={14} />
                          Restaurer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}