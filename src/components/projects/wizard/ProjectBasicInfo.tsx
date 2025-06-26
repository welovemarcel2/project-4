import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface ProjectBasicInfoProps {
  initialData: {
    name: string;
    client: string;
  };
  onSubmit: (data: { name: string; client: string }) => void;
  onCancel: () => void;
}

export function ProjectBasicInfo({ initialData, onSubmit, onCancel }: ProjectBasicInfoProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    client: initialData.client || '',
    customType: ''
  });
  const [isCustomType, setIsCustomType] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const productionTypes = [
    "Captation",
    "Clip",
    "Documentaire",
    "Emission de TV",
    "Film institutionnel",
    "News",
    "Programme sportif",
    "Reportage",
    "Fiction série",
    "Plateau",
    "Office religieux",
    "Reportage plateau",
    "Reportage magazine",
    "Fiction unitaire",
    "Autre"
  ];

  // Fermer le menu déroulant quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTypeSelection = (type: string) => {
    if (type === "Autre") {
      setIsCustomType(true);
      setFormData(prev => ({ ...prev, client: type }));
    } else {
      setIsCustomType(false);
      setFormData(prev => ({ ...prev, client: type }));
    }
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const clientValue = isCustomType ? formData.customType : formData.client;
    
    if (!formData.name.trim() || !clientValue.trim()) return;

    onSubmit({
      name: formData.name.trim(),
      client: clientValue.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nom du projet
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Film promotionnel - Client X"
          required
        />
      </div>

      <div>
        <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
          Type de production
        </label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
          >
            <span>{formData.client || "Sélectionner un type"}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {productionTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeSelection(type)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCustomType && (
        <div>
          <label htmlFor="customType" className="block text-sm font-medium text-gray-700 mb-1">
            Précisez le type de production
          </label>
          <input
            type="text"
            id="customType"
            value={formData.customType}
            onChange={(e) => setFormData(prev => ({ ...prev, customType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Vidéo corporate"
            required
          />
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          disabled={!formData.name.trim() || (!formData.client.trim() && !isCustomType) || (isCustomType && !formData.customType.trim())}
        >
          Suivant
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}