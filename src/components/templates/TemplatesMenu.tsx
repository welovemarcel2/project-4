import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Pencil, Loader2, Download } from 'lucide-react';
import { useTemplatesStore } from '../../stores/templatesStore';
import { BudgetCategory } from '../../types/budget';
import { CreateTemplateModal } from './CreateTemplateModal';
import { ImportTemplateModal } from './ImportTemplateModal';
import { formatDate } from '../../utils/formatDate';
import { exportTemplateToCSV } from '../../utils/templateExport';
import { QuoteSettings } from '../../types/quoteSettings';

interface TemplatesMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: BudgetCategory[];
  onApplyTemplate: (budget: BudgetCategory[]) => void;
  settings?: QuoteSettings;
}

interface RenameTemplateProps {
  templateId: string;
  currentName: string;
  onRename: (newName: string) => void;
  onCancel: () => void;
}

function RenameTemplate({ templateId, currentName, onRename, onCancel }: RenameTemplateProps) {
  const [newName, setNewName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName !== currentName) {
      onRename(newName.trim());
    }
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Nom du modèle"
        autoFocus
      />
      <button
        type="submit"
        className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
      >
        Renommer
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded"
      >
        Annuler
      </button>
    </form>
  );
}

export function TemplatesMenu({
  isOpen,
  onClose,
  currentBudget,
  onApplyTemplate,
  settings
}: TemplatesMenuProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const { templates, isLoading, error, loadTemplates, getUserTemplates, deleteTemplate, updateTemplate } = useTemplatesStore();
  
  // Charger les modèles à l'ouverture du menu
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);
  
  const userTemplates = getUserTemplates();

  if (!isOpen) return null;

  const handleRename = async (templateId: string, newName: string) => {
    await updateTemplate(templateId, { name: newName });
    setEditingTemplateId(null);
  };

  const handleExportTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      exportTemplateToCSV(template, settings);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Modèles de budget</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-end gap-3 mb-4">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Upload size={16} />
              Importer un modèle
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Plus size={16} />
              Enregistrer le budget actuel
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">Chargement des modèles...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              <p>{error}</p>
              <button 
                onClick={loadTemplates}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userTemplates.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Upload size={48} className="mx-auto text-gray-400 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">
                    Aucun modèle enregistré
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Commencez par enregistrer votre budget actuel comme modèle ou importez un modèle CSV
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                    >
                      <Upload size={16} />
                      Importer un modèle CSV
                    </button>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
                    >
                      <Plus size={16} />
                      Créer mon premier modèle
                    </button>
                  </div>
                </div>
              ) : (
                userTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingTemplateId === template.id ? (
                            <RenameTemplate
                              templateId={template.id}
                              currentName={template.name}
                              onRename={(newName) => handleRename(template.id, newName)}
                              onCancel={() => setEditingTemplateId(null)}
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900">{template.name}</h3>
                                <button
                                  onClick={() => setEditingTemplateId(template.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                  title="Renommer"
                                >
                                  <Pencil size={14} />
                                </button>
                              </div>
                              {template.description && (
                                <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                              )}
                            </>
                          )}
                        </div>
                        {editingTemplateId !== template.id && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleExportTemplate(template.id)}
                              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md"
                              title="Exporter en CSV"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => {
                                // Appliquer les taux du projet aux éléments du modèle
                                const applyProjectSettings = (items: BudgetLine[]): BudgetLine[] => {
                                  return items.map(item => {
                                    // Toujours appliquer les taux par défaut du projet, même si l'élément a déjà des valeurs
                                    const updatedItem = {
                                      ...item,
                                      agencyPercent: settings?.defaultAgencyPercent !== undefined ? settings.defaultAgencyPercent : item.agencyPercent,
                                      marginPercent: settings?.defaultMarginPercent !== undefined ? settings.defaultMarginPercent : item.marginPercent
                                    };
                                    
                                    // Appliquer aux sous-éléments récursivement
                                    if (updatedItem.subItems && updatedItem.subItems.length > 0) {
                                      updatedItem.subItems = applyProjectSettings(updatedItem.subItems);
                                    }
                                    
                                    return updatedItem;
                                  });
                                };
                                
                                // Appliquer les paramètres à toutes les catégories
                                const processedBudget = template.budget.map(category => ({
                                  ...category,
                                  items: applyProjectSettings(category.items)
                                }));
                                
                                onApplyTemplate(processedBudget);
                                onClose();
                              }}
                              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                            >
                              Appliquer
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Créé le {formatDate(template.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentBudget={currentBudget}
      />

      <ImportTemplateModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}