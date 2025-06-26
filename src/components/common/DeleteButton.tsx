import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  onDelete: () => void;
  itemType: 'project' | 'budget' | 'quote';
  disabled?: boolean;
  compact?: boolean;
}

export function DeleteButton({ onDelete, itemType, disabled = false, compact = false }: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const getItemLabel = () => {
    switch (itemType) {
      case 'project': return 'le projet';
      case 'budget': return 'le budget';
      case 'quote': return 'le budget';
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowConfirm(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={handleDelete}
          className={`p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={disabled}
          title={`Supprimer ${getItemLabel()}`}
        >
          <Trash2 size={16} />
        </button>

        {showConfirm && (
          <>
            {/* Overlay to catch clicks */}
            <div 
              className="fixed inset-0 z-40"
              onClick={handleCancel}
            />
            
            {/* Confirmation dialog */}
            <div className="absolute z-50 right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
              <p className="text-sm text-gray-600 mb-3">
                Êtes-vous sûr de vouloir supprimer {getItemLabel()} ?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-2 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleConfirm}
          className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
        >
          Confirmer
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled}
    >
      <Trash2 size={16} />
      Supprimer {getItemLabel()}
    </button>
  );
}