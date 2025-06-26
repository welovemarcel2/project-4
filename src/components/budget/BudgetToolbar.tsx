import React from 'react';
import { Eye, EyeOff, ChevronDown, ChevronUp, Table2, Settings2, GripVertical, BookTemplate, Hash } from 'lucide-react';

interface BudgetToolbarProps {
  showEmptyItems: boolean;
  isEditorMode: boolean;
  isExpanded: boolean;
  onToggleEmptyItems: (show: boolean) => void;
  onToggleExpand: () => void;
  onOpenRatesGrid: () => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onToggleEditorMode: () => void;
}

export function BudgetToolbar({
  showEmptyItems,
  isEditorMode,
  isExpanded,
  onToggleEmptyItems,
  onToggleExpand,
  onOpenRatesGrid,
  onOpenSettings,
  onOpenTemplates,
  onToggleEditorMode
}: BudgetToolbarProps) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow border border-gray-200 p-2">
      <div className="flex items-center gap-2">
        {/* Afficher/masquer les lignes à zéro */}
        <button
          onClick={() => onToggleEmptyItems(!showEmptyItems)}
          className={`p-2 rounded-full transition-colors ${
            showEmptyItems ? 'text-gray-600 hover:bg-gray-100' : 'text-blue-600 hover:bg-blue-50'
          }`}
          title={showEmptyItems ? "Masquer les postes vides" : "Afficher les postes vides"}
        >
          {showEmptyItems ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>

        {/* Détailler/replier les lignes */}
        <button
          onClick={onToggleExpand}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          title={isExpanded ? "Replier les lignes" : "Détailler les lignes"}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <button
          onClick={onOpenTemplates}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          title="Modèles"
        >
          <BookTemplate size={20} />
        </button>

        {/* Grille tarifaire */}
        <button
          onClick={onOpenRatesGrid}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          title="Grille tarifaire"
        >
          <Table2 size={20} />
        </button>

        <div className="w-px h-6 bg-gray-200" />
      </div>

      <div className="flex items-center gap-2">
        {/* Mode éditeur */}
        <button
          onClick={onToggleEditorMode}
          className={`p-2 rounded-full transition-colors ${
            isEditorMode 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={isEditorMode ? "Désactiver le mode éditeur" : "Activer le mode éditeur"}
        >
          <GripVertical size={20} />
        </button>

        {/* Paramètres du devis */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          title="Paramètres"
        >
          <Settings2 size={20} />
        </button>
      </div>
    </div>
  );
}