import React, { useState } from 'react';
import { NumberingFormat, NumberingSettings as NumberingSettingsType } from '../../../types/quoteSettings';
import { toAlphabetic, toRoman } from '../../../utils/formatItemNumber';

interface NumberingSettingsProps {
  numbering: NumberingSettingsType;
  onChange: (numbering: NumberingSettingsType) => void;
}

const formatOptions: { value: NumberingFormat; label: string }[] = [
  { value: 'numeric', label: 'Numérique (1, 2, 3...)' },
  { value: 'alphabetic', label: 'Alphabétique (A, B, C...)' },
  { value: 'roman', label: 'Chiffres romains (I, II, III...)' },
  { value: 'none', label: 'Aucun' }
];

const separatorOptions = [
  { value: '.', label: 'Point (.)' },
  { value: '-', label: 'Tiret (-)' },
  { value: '/', label: 'Slash (/)' },
  { value: ' ', label: 'Espace' }
];

export function NumberingSettings({ numbering, onChange }: NumberingSettingsProps) {
  const [previewNumbers, setPreviewNumbers] = useState({
    category: 1,
    subCategory: 2,
    post: 3,
    subPost: 4
  });

  const handleFormatChange = (level: keyof Omit<NumberingSettingsType, 'separator' | 'continuousNumbering'>, format: NumberingFormat) => {
    onChange({
      ...numbering,
      [level]: format
    });
  };

  const handleSeparatorChange = (separator: string) => {
    onChange({
      ...numbering,
      separator
    });
  };

  const handleContinuousNumberingChange = (continuousNumbering: boolean) => {
    onChange({
      ...numbering,
      continuousNumbering
    });
  };

  // Générer un aperçu de la numérotation
  const generatePreview = () => {
    const { category, subCategory, post, subPost, continuousNumbering } = numbering;
    const { separator } = numbering;
    
    const formatNumber = (num: number, format: NumberingFormat): string => {
      if (format === 'none') return '';
      
      switch (format) {
        case 'numeric':
          return num.toString();
        case 'alphabetic':
          return toAlphabetic(num);
        case 'roman':
          return toRoman(num);
        default:
          return num.toString();
      }
    };

    // Si la numérotation est continue, on utilise des valeurs incrémentales
    let parts;
    if (continuousNumbering) {
      parts = [
        formatNumber(previewNumbers.category, category),
        formatNumber(previewNumbers.category + 1, subCategory),
        formatNumber(previewNumbers.category + 2, post),
        formatNumber(previewNumbers.category + 3, subPost)
      ].filter(Boolean);
    } else {
      parts = [
        formatNumber(previewNumbers.category, category),
        formatNumber(previewNumbers.subCategory, subCategory),
        formatNumber(previewNumbers.post, post),
        formatNumber(previewNumbers.subPost, subPost)
      ].filter(Boolean);
    }

    return parts.join(separator);
  };

  return (
    <div className="space-y-6">
      <h4 className="font-medium text-sm text-gray-900">Format de numérotation</h4>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format des catégories
            </label>
            <select
              value={numbering.category}
              onChange={(e) => handleFormatChange('category', e.target.value as NumberingFormat)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formatOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format des sous-catégories
            </label>
            <select
              value={numbering.subCategory}
              onChange={(e) => handleFormatChange('subCategory', e.target.value as NumberingFormat)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formatOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format des postes
            </label>
            <select
              value={numbering.post}
              onChange={(e) => handleFormatChange('post', e.target.value as NumberingFormat)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formatOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format des sous-postes
            </label>
            <select
              value={numbering.subPost}
              onChange={(e) => handleFormatChange('subPost', e.target.value as NumberingFormat)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formatOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Séparateur
          </label>
          <select
            value={numbering.separator}
            onChange={(e) => handleSeparatorChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {separatorOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-3 border-t">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={numbering.continuousNumbering}
              onChange={(e) => handleContinuousNumberingChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600"
            />
            <div>
              <span className="text-sm text-gray-700">Numérotation continue</span>
              <p className="text-xs text-gray-500 mt-1">
                La numérotation des postes et sous-postes continue d'une catégorie/sous-catégorie à l'autre, 
                au lieu de recommencer à 1 pour chaque nouvelle section.
              </p>
            </div>
          </label>
        </div>
        
        <div className="pt-4 border-t">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Aperçu</h5>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center font-mono text-lg">
              {generatePreview()}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Catégorie
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={previewNumbers.category}
                  onChange={(e) => setPreviewNumbers(prev => ({ ...prev, category: parseInt(e.target.value) || 1 }))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Sous-catégorie
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={previewNumbers.subCategory}
                  onChange={(e) => setPreviewNumbers(prev => ({ ...prev, subCategory: parseInt(e.target.value) || 1 }))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Poste
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={previewNumbers.post}
                  onChange={(e) => setPreviewNumbers(prev => ({ ...prev, post: parseInt(e.target.value) || 1 }))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Sous-poste
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={previewNumbers.subPost}
                  onChange={(e) => setPreviewNumbers(prev => ({ ...prev, subPost: parseInt(e.target.value) || 1 }))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}