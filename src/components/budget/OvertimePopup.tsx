import React from 'react';
import { X } from 'lucide-react';

interface OvertimePopupProps {
  onClose: () => void;
}

export function OvertimePopup({ onClose }: OvertimePopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Heures supplémentaires
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Le contenu du popup sera ajouté plus tard */}
          <p className="text-gray-600">
            Le module des heures supplémentaires sera bientôt disponible.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}