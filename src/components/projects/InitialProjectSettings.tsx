import React, { useState } from 'react';
import { X, Save, Pencil, Info, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { QuoteSettings } from '../../types/quoteSettings';
import { generateId } from '../../utils/generateId';

interface InitialProjectSettingsProps {
  projectData: { 
    name: string; 
    client: string;
  };
  onBack: () => void;
  onSubmit: (projectData: { 
    name: string; 
    client: string;
    settings: Partial<QuoteSettings>;
  }) => void;
}

export function InitialProjectSettings({ 
  projectData, 
  onBack, 
  onSubmit 
}: InitialProjectSettingsProps) {
  const [settings, setSettings] = useState<Partial<QuoteSettings>>({
    rateLabels: {
      rate1Label: 'TX 1',
      rate2Label: 'TX 2'
    },
    defaultAgencyPercent: 10,
    defaultMarginPercent: 15,
    information: {
      projectName: projectData.name,
      projectType: projectData.client,
      customFields: [
        { id: '1', title: 'Réalisateur.ice', content: '' },
        { id: '2', title: 'Client/Diffuseur', content: '' },
        { id: '3', title: 'Jours de tournage', content: '' },
        { id: '4', title: 'Dates de tournage', content: '' }
      ]
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...projectData,
      settings
    });
  };

  const handleRateLabelChange = (field: 'rate1Label' | 'rate2Label', value: string) => {
    setSettings({
      ...settings,
      rateLabels: {
        ...settings.rateLabels!,
        [field]: value
      }
    });
  };

  const handleRateValueChange = (field: 'defaultAgencyPercent' | 'defaultMarginPercent', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSettings({
        ...settings,
        [field]: numValue
      });
    }
  };

  const handleCustomFieldChange = (index: number, field: 'title' | 'content', value: string) => {
    const newCustomFields = [...settings.information!.customFields];
    newCustomFields[index] = {
      ...newCustomFields[index],
      [field]: value
    };
    
    setSettings({
      ...settings,
      information: {
        ...settings.information!,
        customFields: newCustomFields
      }
    });
  };

  const handleAddCustomField = () => {
    const newCustomFields = [...settings.information!.customFields];
    newCustomFields.push({
      id: generateId(),
      title: `Champ ${newCustomFields.length + 1}`,
      content: ''
    });
    
    setSettings({
      ...settings,
      information: {
        ...settings.information!,
        customFields: newCustomFields
      }
    });
  };

  const handleRemoveCustomField = (index: number) => {
    const newCustomFields = [...settings.information!.customFields];
    newCustomFields.splice(index, 1);
    
    setSettings({
      ...settings,
      information: {
        ...settings.information!,
        customFields: newCustomFields
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Paramètres du projet</h2>
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Info (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Informations du projet</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nom du projet</label>
                <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-700">
                  {projectData.name}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Type de production</label>
                <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-700">
                  {projectData.client}
                </div>
              </div>
            </div>
          </div>
          
          {/* Default Rates */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Pencil size={18} className="text-blue-600" />
              <h3 className="text-sm font-medium text-gray-700">Taux par défaut</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nom du Taux 1</label>
                  <input
                    type="text"
                    value={settings.rateLabels?.rate1Label}
                    onChange={(e) => handleRateLabelChange('rate1Label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="TX 1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Valeur du Taux 1 (%)</label>
                  <input
                    type="number"
                    value={settings.defaultAgencyPercent}
                    onChange={(e) => handleRateValueChange('defaultAgencyPercent', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nom du Taux 2</label>
                  <input
                    type="text"
                    value={settings.rateLabels?.rate2Label}
                    onChange={(e) => handleRateLabelChange('rate2Label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="TX 2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Valeur du Taux 2 (%)</label>
                  <input
                    type="number"
                    value={settings.defaultMarginPercent}
                    onChange={(e) => handleRateValueChange('defaultMarginPercent', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Custom Fields */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                <h3 className="text-sm font-medium text-gray-700">Champs personnalisés</h3>
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <Plus size={16} />
                Ajouter un champ
              </button>
            </div>
            
            <div className="space-y-4">
              {settings.information?.customFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Titre</label>
                    <input
                      type="text"
                      value={field.title}
                      onChange={(e) => handleCustomFieldChange(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Titre du champ"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Contenu</label>
                      <input
                        type="text"
                        value={field.content}
                        onChange={(e) => handleCustomFieldChange(index, 'content', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contenu du champ"
                      />
                    </div>
                    {settings.information.customFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(index)}
                        className="mt-6 p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                        title="Supprimer ce champ"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <p className="text-xs text-gray-500 mt-2">
                Ces champs apparaîtront dans les exports PDF et peuvent être modifiés ultérieurement.
              </p>
            </div>
          </div>
          
          <div className="flex justify-between gap-3 pt-4 border-t">
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
              <Save size={16} />
              Créer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}