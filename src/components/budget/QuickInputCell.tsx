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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        handleBlur();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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

  const handleStartEdit = () => {
    if (disabled) return;
    if (isPercentage && onClick) {
      onClick();
      return;
    }
    setEditValue(value.toString());
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (!isEditing) return;
    
    let newValue;
    try {
      // Convert comma to dot for proper parsing
      const sanitizedValue = editValue.replace(/,/g, '.');
      const parsedValue = parseFloat(sanitizedValue);
      newValue = !isNaN(parsedValue) ? parsedValue : 0;
    } catch (e) {
      console.error('Error parsing value:', e);
      newValue = NaN;
    }
    
    if (!isNaN(newValue)) {
      if (max !== undefined && newValue > max) {
        onChange(max);
      } else if (newValue < min) {
        onChange(min);
      } else {
        // Si nous sommes dans le budget de travail et que c'est un champ "rate"
        // et qu'il s'agit d'une saisie de coût, mettons à jour le champ "cost"
        if (isWorkBudget && type === 'rate') {
          // Pour le budget de travail, nous utilisons la propriété cost au lieu de rate
          onChange(newValue);
        } else {
          onChange(newValue);
        }
      }
    }
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
      e.preventDefault(); // Prevent form submission
      e.stopPropagation(); // Stop event propagation
      
      // Move to the next field based on the type
      if (type === 'quantity') {
        // Move to number field
        const nextElement = document.querySelector(`[data-field="number"][data-item-id="${itemId}"]`);
        if (nextElement) {
          (nextElement as HTMLElement).click();
        }
      } else if (type === 'number') {
        // Move to unit field
        const currentRow = cellRef.current?.closest('tr');
        if (currentRow) {
          const unitSelect = currentRow.querySelector('select');
          if (unitSelect) {
            (unitSelect as HTMLElement).focus();
          }
        }
      } else if (type === 'rate') {
        // Find the next row's name field
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
            const value = e.target.value.replace(/[^\d.,\-]/g, '');
            setEditValue(value);
            // Store the value in a data attribute for recovery if needed
            e.currentTarget.dataset.lastValue = value;
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
          {value || '-'}
        </div>
      )}
    </div>
  );
}