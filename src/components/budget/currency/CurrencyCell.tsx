// TODO: Nouvelle gestion currency à recoder from scratch

import React, { useState, useRef, useEffect } from 'react';
import { Coins, AlertTriangle } from 'lucide-react';
import { useCurrencyStore } from '../../../stores/currencyStore';
import { CurrencyCode } from '../../../types/currency';
import { CurrencyPopup } from './CurrencyPopup';

interface CurrencyCellProps {
  value?: CurrencyCode;
  onChange: (currencyCode: CurrencyCode, convertedRate?: number) => void;
  highlight?: boolean;
  rate?: number;
  hasSocialCharges?: boolean;
  disabled?: boolean;
  currentCurrency: CurrencyCode;
  currentRate: number;
}

export function CurrencyCell({ 
  value, 
  onChange, 
  highlight = false, 
  rate,
  hasSocialCharges = false,
  disabled = false,
  currentCurrency,
  currentRate
}: CurrencyCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { selectedCurrency, currencies } = useCurrencyStore();
  const lastUpdate = useCurrencyStore(state => state.lastUpdate);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (hasSocialCharges) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000); // Hide error after 3 seconds
      return;
    }
    
    if (!disabled) {
      // Ouvrir la fenêtre de gestion des devises
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <div className="relative">
        <button
          onClick={handleClick}
          className={`flex items-center justify-center gap-1 px-2 py-1 text-[11px] rounded transition-colors group w-full ${
            disabled
              ? 'text-gray-400 cursor-not-allowed opacity-50'
              : hasSocialCharges 
              ? 'text-gray-400 cursor-not-allowed' 
              : highlight 
                ? 'text-blue-600 hover:bg-gray-50' 
                : 'text-gray-500 hover:bg-gray-50'
          }`}
          title={hasSocialCharges ? "Il est impossible de changer la devise d'un salaire" : "Changer la devise"}
          disabled={disabled}
          type="button"
        >
          <Coins size={14} className={disabled || hasSocialCharges ? '' : 'group-hover:text-gray-700'} />
        </button>

        {value && rate && !hasSocialCharges && (
          <div className="absolute -top-1 -translate-y-full left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20">
            {rate} {value}
          </div>
        )}

        {showError && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-red-50 border border-red-200 text-red-600 text-xs rounded px-2 py-1 whitespace-nowrap z-20 flex items-center gap-1">
            <AlertTriangle size={12} />
            Il est impossible de changer la devise d'un salaire
          </div>
        )}
      </div>

      {isOpen && !hasSocialCharges && !disabled && (
        <CurrencyPopup 
          onClose={() => setIsOpen(false)}
          onSelectCurrency={(code, newRate) => {
            onChange(code, newRate);
            setIsOpen(false);
          }}
          currentCurrency={currentCurrency}
          currentRate={currentRate}
          lastUpdate={lastUpdate}
          isOpen={isOpen}
        />
      )}
    </div>
  );
}