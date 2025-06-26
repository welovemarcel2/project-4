import React, { useState } from 'react';
import { QuoteInformation, CustomField } from '../../../types/quoteSettings';
import { Pencil, Plus, Trash2, Save, X } from 'lucide-react';
import { generateId } from '../../../utils/generateId';

interface InformationSettingsProps {
  information: QuoteInformation;
  onChange: (information: QuoteInformation) => void;
}

export function InformationSettings({ information, onChange }: InformationSettingsProps) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleProjectChange = (field: 'projectName' | 'projectType', value: string) => {
    onChange({
      ...information,
      [field]: value
    });
  };

  const handleContentChange = (id: string, content: string) => {
    onChange({
      ...information,
      customFields: information.customFields.map(field => 
        field.id === id ? { ...field, content } : field
      )
    });
  };

  const handleStartEditTitle = (id: string, currentTitle: string) => {
    setEditingFieldId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = (id: string) => {
    if (editingTitle.trim()) {
      onChange({
        ...information,
        customFields: information.customFields.map(field => 
          field.id === id ? { ...field, title: editingTitle.trim() } : field
        )
      });
    }
    setEditingFieldId(null);
    setEditingTitle('');
  };

  const handleCancelEditTitle = () => {
    setEditingFieldId(null);
    setEditingTitle('');
  };

  const handleAddField = () => {
    const newField: CustomField = {
      id: generateId(),
      title: `Titre ${information.customFields.length + 1}`,
      content: ''
    };
    
    onChange({
      ...information,
      customFields: [...information.customFields, newField]
    });
  };

  const handleDeleteField = (id: string) => {
    onChange({
      ...information,
      customFields: information.customFields.filter(field => field.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <h4 className="font-medium text-sm text-gray-900">Informations du projet</h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du projet
          </label>
          <input
            type="text"
            value={information.projectName}
            onChange={(e) => handleProjectChange('projectName', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nom du projet"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de projet
          </label>
          <input
            type="text"
            value={information.projectType}
            onChange={(e) => handleProjectChange('projectType', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type de projet"
          />
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-sm font-medium text-gray-700">Champs personnalisés</h5>
          </div>

          <div className="space-y-4">
            {information.customFields.map(field => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  {editingFieldId === field.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTitle(field.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Enregistrer"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={handleCancelEditTitle}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Annuler"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h6 className="text-sm font-medium text-gray-700">{field.title}</h6>
                      <button
                        onClick={() => handleStartEditTitle(field.id, field.title)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Modifier le titre"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Supprimer ce champ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <textarea
                  value={field.content}
                  onChange={(e) => handleContentChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={field.title}
                  rows={2}
                />
              </div>
            ))}
            
            <button
              onClick={handleAddField}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg"
            >
              <Plus size={16} />
              Ajouter un champ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}