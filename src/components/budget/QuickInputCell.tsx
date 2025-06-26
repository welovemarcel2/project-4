import React, { useState, useRef, useEffect } from 'react';
import { formatNumber } from '../../utils/formatNumber';

interface QuickInputCellProps {
  value: number;
  onChange: (value: number) => void;
  type: 'quantity' | 'number' | 'rate' | 'percentage';
  itemId: string;
  disabled?: boolean;
  onClick?: () => void;
  min?: number;
  isWorkBudget?: boolean;
  max?: number;
  step?: number;
  isPercentage?: boolean;
  title?: string;
  tabIndex?: number;
}

export function QuickInputCell({
  value,
  onChange,
  type,
  itemId,
  disabled = false,
  onClick,
  isWorkBudget = false,
  min = 0,
  max,
  step,
  isPercentage = false,
  title,
  tabIndex
}: QuickInputCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const [lastSavedValue, setLastSavedValue] = useState(value);

  // Gestionnaire pour les clics en dehors de la cellule
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        handleBlur();
      }
    }

    // Attacher l'écouteur uniquement pendant l'édition
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing]);

  // Focus et sélection du contenu lors de l'édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Mise à jour de l'état interne lorsque la valeur externe change
  useEffect(() => {
    setLastSavedValue(value);
  }, [value]);

  // Déterminer le pas pour les incréments
  const getDefaultStep = () => {
    if (step !== undefined) return step;
    
    switch (type) {
      case 'quantity':
        return 0.5;
      case 'number':
        return 1;
      case 'rate':
        return 0.01;
      case 'percentage':
        return 0.1;
      default:
        return 1;
    }
  };

  // Démarrer l'édition
  const handleStartEdit = () => {
    if (disabled) return;
    
    // Si c'est un pourcentage et qu'il y a un gestionnaire de clic personnalisé
    if (isPercentage && onClick) {
      onClick();
      return;
    }
    
    // Sinon, commencer l'édition normale
    setEditValue(value.toString());
    setIsEditing(true);
  };

  // Terminer l'édition et sauvegarder
  const handleBlur = () => {
    if (!isEditing) return;
    
    let newValue;
    try {
      // Convertir la virgule en point pour le parsing
      const sanitizedValue = editValue.replace(/,/g, '.');
      const parsedValue = parseFloat(sanitizedValue);
      newValue = !isNaN(parsedValue) ? parsedValue : lastSavedValue;
    } catch (e) {
      console.error('Error parsing value:', e);
      newValue = lastSavedValue;
    }
    
    if (newValue !== lastSavedValue) {
      // Appliquer les limites min/max
      if (max !== undefined && newValue > max) {
        newValue = max;
      } else if (newValue < min) {
        newValue = min;
      }
      
      // Si nous sommes dans le budget de travail et que c'est un champ "rate"
      if (isWorkBudget && type === 'rate') {
        // Pour le budget de travail, nous utilisons la propriété cost au lieu de rate
        onChange(newValue);
      } else {
        onChange(newValue);
      }
      
      setLastSavedValue(newValue);
    }
    
    setIsEditing(false);
    setEditValue('');
  };

  // Gérer les touches spéciales (Enter, Escape, Tab)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Éviter la soumission de formulaire
      e.stopPropagation(); // Arrêter la propagation de l'événement
      handleBlur(); // Sauvegarder les changements
      
      // Navigation vers le champ suivant basée sur le type de champ actuel
      if (type === 'quantity') {
        // Passer au champ number
        const nextElement = document.querySelector(`[data-field="number"][data-item-id="${itemId}"]`);
        if (nextElement) {
          (nextElement as HTMLElement).click();
        }
      } else if (type === 'number') {
        // Passer au champ unit
        const currentRow = cellRef.current?.closest('tr');
        if (currentRow) {
          const unitSelect = currentRow.querySelector('select');
          if (unitSelect) {
            (unitSelect as HTMLElement).focus();
          }
        }
      } else if (type === 'rate') {
        // Passer au nom de la ligne suivante
        const currentRow = cellRef.current?.closest('tr');
        const nextRow = currentRow?.nextElementSibling;
        if (nextRow) {
          const nameField = nextRow.querySelector('[tabindex]');
          if (nameField) {
            (nameField as HTMLElement).focus();
          }
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(false);
      setEditValue('');
    }
  };

  // Si la cellule est désactivée, afficher simplement la valeur sans interaction
  if (disabled) {
    return (
      <div className="w-full text-center px-1 py-0.5 text-[11px] text-gray-500" title={title}>
        {value || '-'}
      </div>
    );
  }

  return (
    <div
      ref={cellRef}
      onClick={handleStartEdit}
      className={`w-full text-center cursor-pointer rounded transition-colors ${
        isEditing ? 'bg-white ring-1 ring-blue-500' : 'hover:bg-gray-50'
      }`}
      data-field={type}
      data-item-id={itemId}
      title={title}
      tabIndex={tabIndex}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleStartEdit();
        }
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => {
            // Accepter uniquement les nombres, points, virgules et signe moins
            const value = e.target.value.replace(/[^\d.,\-]/g, '');
            setEditValue(value);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          tabIndex={tabIndex}
          className="w-full text-center bg-transparent border-none focus:outline-none text-[11px] py-0.5"
          min={min}
          max={max}
          step={getDefaultStep()}
        />
      ) : (
        <div className="px-1 py-0.5 text-[11px]">
          {value ? formatNumber(value) : '-'}
        </div>
      )}
    </div>
  );
}