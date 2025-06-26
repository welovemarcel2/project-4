import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, FileText, Plus, Upload } from 'lucide-react';
import { useTemplatesStore } from '../../../stores/templatesStore';
import { BudgetCategory } from '../../../types/budget';
import { ImportTemplateModal } from '../../templates/ImportTemplateModal';

interface QuoteTemplateSelectionProps {
  onSubmit: (data: { 
    initialBudget?: BudgetCategory[];
    templateId?: string;
  }) => void;
  onBack: () => void;
}

export function QuoteTemplateSelection({ onSubmit, onBack }: QuoteTemplateSelectionProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { templates, loadTemplates, isLoading } = useTemplatesStore();

  // Charger les modèles au montage
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Récupérer le modèle sélectionné s'il y en a un
    const selectedTemplate = selectedTemplateId 
      ? templates.find(t => t.id === selectedTemplateId)
      : null;

    onSubmit({
      initialBudget: selectedTemplate?.budget,
      templateId: selectedTemplateId || undefined
    });
  };

  const handleEmptyBudget = () => {
    onSubmit({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Choisir un modèle</h3>
        
        <div className="space-y-4">
          {/* Options côte à côte */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleEmptyBudget}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 h-full"
            >
              <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                <Plus size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Budget vide</h3>
                <p className="text-sm text-gray-500">Créer un budget sans modèle</p>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 h-full"
            >
              <div className="p-2 bg-gray-100 text-gray-600 rounded-md">
                <Upload size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Importer un modèle</h3>
                <p className="text-sm text-gray-500">Depuis un fichier CSV</p>
              </div>
            </button>
          </div>
          
          {/* Modèles existants */}
          {templates.length > 0 && (
            <>
              <div className="text-sm font-medium text-gray-700 pt-2">Utiliser un modèle existant :</div>
              
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Chargement des modèles...
                  </div>
                ) : (
                  templates.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(template.id === selectedTemplateId ? null : template.id)}
                      className={`w-full p-4 border-b last:border-b-0 hover:bg-gray-50 flex items-center gap-3 text-left ${
                        selectedTemplateId === template.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-md ${selectedTemplateId === template.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-gray-500">{template.description}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeft size={16} />
          Retour
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Suivant
          <ArrowRight size={16} />
        </button>
      </div>

      {showImportModal && (
        <ImportTemplateModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </form>
  );
}