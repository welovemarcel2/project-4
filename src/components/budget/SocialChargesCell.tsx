import React, { useState, useRef, useEffect } from 'react';
import { SocialChargeRate } from '../../types/quoteSettings';

interface SocialChargesCellProps {
  value: string;
  rates: SocialChargeRate[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SocialChargesCell({ value, rates, onChange, disabled = false }: SocialChargesCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedRate = rates.find(r => r.id === value);
  const displayValue = selectedRate ? `${(selectedRate.rate * 100).toFixed(0)}%` : '-';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-center hover:bg-gray-50 px-1 py-0.5 rounded text-xs min-h-[20px]"
        disabled={disabled}
      >
        {displayValue}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-0.5 w-36 bg-white rounded-md shadow-lg border border-gray-200 text-xs">
          <button
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="w-full text-left px-2 py-1 hover:bg-gray-50 first:rounded-t-md"
          >
            -
          </button>
          <div className="border-t border-gray-100" />
          {rates.map((rate) => (
            <button
              key={rate.id}
              onClick={() => {
                onChange(rate.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-2 py-1 hover:bg-gray-50 last:rounded-b-md"
            >
              {rate.label} - {(rate.rate * 100).toFixed(0)}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
}