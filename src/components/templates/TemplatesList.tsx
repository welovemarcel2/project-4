import React from 'react';
import { FileText, Plus, Trash2, Clock } from 'lucide-react';
import { useTemplatesStore } from '../../stores/templatesStore';
import { formatDate } from '../../utils/formatDate';
import { BudgetCategory } from '../../types/budget';

interface TemplatesListProps {
  currentBudget: BudgetCategory[];
  onCreateTemplate: () => void;
  onApplyTemplate: (budget: BudgetCategory[]) => void;
}

export function TemplatesList({ currentBudget, onCreateTemplate, onApplyTemplate }: TemplatesListProps) {
  const { templates = [], deleteTemplate } = useTemplatesStore();

  // If no templates exist, show empty state
  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <FileText size={48} className="mx-auto text-gray-400 mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">
          Aucun modèle enregistré
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Commencez par enregistrer votre budget actuel comme modèle
        </p>
        <button
          onClick={onCreateTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
        >
          <Plus size={16} />
          Créer mon premier modèle
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {templates.map(template => (
        <div
          key={template.id}
          className="bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all"
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onApplyTemplate(template.budget)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  Appliquer
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                  title="Supprimer le modèle"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Créé le {formatDate(template.createdAt)}</span>
              </div>
              <span>{template.rates?.length || 0} tarifs enregistrés</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}