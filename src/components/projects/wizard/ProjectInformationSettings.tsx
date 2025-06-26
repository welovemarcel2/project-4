import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { generateId } from '../../../utils/generateId';

interface CustomField {
  id: string;
  title: string;
  content: string;
}

interface ProjectInformationSettingsProps {
  initialData: {
    agency: string;
    advertiser: string;
    product: string;
    title: string;
    customFields: CustomField[];
  };
  onSubmit: (data: {
    agency: string;
    advertiser: string;
    product: string;
    title: string;
    customFields: CustomField[];
  }) => void;
  onBack: () => void;
}

export function ProjectInformationSettings({ initialData, onSubmit, onBack }: ProjectInformationSettingsProps) {
  const [formData, setFormData] = useState({
    agency: initialData.agency || '',
    advertiser: initialData.advertiser || '',
    product: initialData.product || '',
    title: initialData.title || '',
    customFields: initialData.customFields || []
  });

  const handleCustomFieldChange = (index: number, field: 'title' | 'content', value: string) => {
    const newCustomFields = [...formData.customFields];
    newCustomFields[index] = {
      ...newCustomFields[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      customFields: newCustomFields
    }));
  };

  const handleAddCustomField = () => {
    const newCustomFields = [...formData.customFields];
    newCustomFields.push({
      id: generateId(),
      title: `Champ ${newCustomFields.length + 1}`,
      content: ''
    });
    
    setFormData(prev => ({
      ...prev,
      customFields: newCustomFields
    }));
  };

  const handleRemoveCustomField = (index: number) => {
    const newCustomFields = [...formData.customFields];
    newCustomFields.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      customFields: newCustomFields
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Champs personnalisés</h3>
          <button
            type="button"
            onClick={handleAddCustomField}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Plus size={16} />
            Ajouter un champ
          </button>
        </div>
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {formData.customFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Titre</label>
                <input
                  type="text"
                  value={field.title}
                  onChange={(e) => handleCustomFieldChange(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre du champ"
                />
              </div>
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
              {formData.customFields.length > 1 && (
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
          ))}
          
          <p className="text-xs text-gray-500 mt-2">
            Ces champs apparaîtront dans les exports PDF et peuvent être modifiés ultérieurement.
          </p>
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
          <Save size={16} />
          Créer le projet
        </button>
      </div>
    </form>
  );
}