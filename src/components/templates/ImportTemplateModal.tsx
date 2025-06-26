import React, { useState, useRef, DragEvent } from 'react';
import { X, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../../types/budget';
import { generateId } from '../../utils/generateId';
import { useTemplatesStore } from '../../stores/templatesStore';
import Papa from 'papaparse';

interface ImportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CSVRow {
  level: string;
  name: string;
  unit?: string;
  price?: string;
  cost?: string;
}

export function ImportTemplateModal({
  isOpen,
  onClose
}: ImportTemplateModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importTemplate } = useTemplatesStore();

  if (!isOpen) return null;

  const validateLevel = (level: string): boolean => {
    // Accept empty levels for sub-posts without numbers
    if (!level || level.trim() === '') return true;

    // Check if the level follows the correct format (e.g., 1, 1.1, 1.1.1, 1.1.12)
    const levelPattern = /^\d+(\.\d+)*$/;
    if (!levelPattern.test(level.trim())) {
      throw new Error(`Format de niveau invalide: "${level}". Le niveau doit être composé uniquement de chiffres séparés par des points (ex: 1, 1.1, 1.1.1)`);
    }

    // Verify each part is a valid number
    const parts = level.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num > 0 && part === num.toString();
    });
  };

  const parseCSV = (content: string): CSVRow[] => {
    try {
      // Detect separator
      const firstLine = content.split('\n')[0];
      const separator = firstLine.includes(';') ? ';' : ',';

      const { data, errors } = Papa.parse<CSVRow>(content, {
        header: true,
        delimiter: separator,
        skipEmptyLines: 'greedy',
        transformHeader: (header: string) => {
          const headerMap: { [key: string]: string } = {
            'niveau': 'level',
            'numéro': 'level',
            'numero': 'level',
            'nom': 'name',
            'unité': 'unit',
            'unite': 'unit',
            'prix': 'price',
            'tarif': 'price',
            'cout': 'cost',
            'coût': 'cost'
          };
          return headerMap[header.toLowerCase()] || header.toLowerCase();
        }
      });

      if (errors.length > 0) {
        console.error('Erreurs CSV:', errors);
        throw new Error('Erreur lors de la lecture du fichier CSV');
      }

      // Filter empty rows and validate levels
      const validRows = data.filter(row => {
        if (!row.name?.trim()) return false;
        if (!validateLevel(row.level)) {
          throw new Error(`Format de niveau invalide: "${row.level}". Le niveau doit être composé uniquement de chiffres séparés par des points (ex: 1, 1.1, 1.1.1)`);
        }
        return true;
      });

      // Sort rows by level
      return validRows.sort((a, b) => {
        if (!a.level) return 1;
        if (!b.level) return -1;
        
        const aLevel = a.level.split('.').map(Number);
        const bLevel = b.level.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aLevel.length, bLevel.length); i++) {
          const aNum = aLevel[i] || 0;
          const bNum = bLevel[i] || 0;
          if (aNum !== bNum) return aNum - bNum;
        }
        return 0;
      });
    } catch (err) {
      console.error('Erreur parsing CSV:', err);
      throw new Error(err instanceof Error ? err.message : 'Format de fichier CSV invalide');
    }
  };

  const getItemType = (level: string, parentLevel?: string): BudgetItemType => {
    if (!level) return 'subPost';
    
    const parts = level.split('.').length;
    switch (parts) {
      case 1: return 'category';
      case 2: return 'subCategory';
      case 3: return 'post';
      default: return 'subPost';
    }
  };

  const convertToCategories = (rows: CSVRow[]): BudgetCategory[] => {
    const categories: BudgetCategory[] = [];
    const itemsMap = new Map<string, BudgetLine>();
    let lastLevel = '';
    
    rows.forEach(row => {
      const type = getItemType(row.level || '', lastLevel);
      const itemId = generateId();
      const levelParts = row.level ? row.level.split('.') : lastLevel.split('.');
      const parentLevel = levelParts.slice(0, -1).join('.');

      // Update last level if we have a valid level
      if (row.level) {
        lastLevel = row.level;
      }

      // Convert price and cost to numbers
      const price = row.price ? parseFloat(row.price.replace(',', '.')) : 0;
      const cost = row.cost ? parseFloat(row.cost.replace(',', '.')) : undefined;

      const item: BudgetLine = {
        id: itemId,
        type,
        name: row.name.trim(),
        parentId: null,
        quantity: 0,
        number: type === 'post' || type === 'subPost' ? 1 : 0,
        unit: row.unit || 'Jour',
        rate: price,
        cost: cost,
        socialCharges: '',
        agencyPercent: 10,
        marginPercent: 15,
        isExpanded: true,
        subItems: []
      };

      if (type === 'category') {
        categories.push({
          id: itemId,
          name: row.name.trim(),
          isExpanded: true,
          items: []
        });
      } else {
        const parent = type === 'subCategory' 
          ? categories.find((_, index) => index === parseInt(levelParts[0], 10) - 1)
          : itemsMap.get(parentLevel);

        if (!parent) {
          throw new Error(`Parent introuvable pour le niveau ${row.level || 'sans niveau'}`);
        }

        if (type === 'subCategory') {
          parent.items.push(item);
          item.parentId = parent.id;
        } else if ('subItems' in parent) {
          parent.subItems.push(item);
          item.parentId = parent.id;
        }

        itemsMap.set(row.level || `${parentLevel}.${parent.subItems.length}`, item);
      }
    });

    return categories;
  };

  const processFile = async (file: File) => {
    setIsSubmitting(true);
    try {
      const content = await file.text();
      const rows = parseCSV(content);
      const categories = convertToCategories(rows);
      
      if (categories.length === 0) {
        throw new Error('Aucune catégorie trouvée dans le fichier');
      }

      // Create a new template with the imported budget
      const templateName = file.name.replace('.csv', '');
      await importTemplate(categories, templateName, 'Importé depuis un fichier CSV');

      // Close the modal
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'importation du fichier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    } else {
      setError('Veuillez déposer un fichier CSV');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Importer un modèle</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            
            {isSubmitting ? (
              <div className="flex flex-col items-center">
                <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600">Importation en cours...</p>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Glissez votre fichier CSV ici ou
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  type="button"
                >
                  parcourez vos fichiers
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Format attendu :</p>
            <p>Fichier CSV avec les colonnes :</p>
            <ul className="list-disc list-inside ml-2">
              <li>niveau/numéro (ex: 1, 1.1, 1.1.1)</li>
              <li>nom (nom du poste)</li>
              <li>unité (Jour, Forfait, etc.)</li>
              <li>prix/tarif (optionnel)</li>
              <li>coût (optionnel)</li>
            </ul>
            <p className="mt-2 text-gray-400">
              Note: Le fichier peut utiliser des virgules ou des points-virgules comme séparateur
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            disabled={isSubmitting}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}