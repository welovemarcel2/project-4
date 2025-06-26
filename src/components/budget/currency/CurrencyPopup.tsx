// TODO: Nouvelle gestion currency à recoder from scratch

import React, { useState } from 'react';
import { X, RefreshCw, Info, Check, Coins, Star, Plus } from 'lucide-react';
import { useCurrencyStore } from '../../../stores/currencyStore';
import { CurrencyCode, Currency, defaultCurrencies } from '../../../types/currency';
import { useExchangeRates } from '../../../hooks/useExchangeRates';
import { formatNumber } from '../../../utils/formatNumber'; 
import { formatDate } from '../../../utils/formatDate';
import { convertCurrencyAmount } from '../../../utils/currency/currencyUtils';

interface CurrencyPopupProps {
  onClose: () => void;
  onSelectCurrency: (code: CurrencyCode, rate?: number) => void;
  currentCurrency: CurrencyCode;
  isOpen: boolean;
  currentRate?: number;
  lastUpdate?: Date;
}

export function CurrencyPopup({ 
  onClose, 
  onSelectCurrency,
  currentCurrency,
  isOpen,
  currentRate,
  lastUpdate
}: CurrencyPopupProps) {
  const currencies = useCurrencyStore(state => state.currencies);
  const selectedCurrency = useCurrencyStore(state => state.selectedCurrency);
  const fetchExchangeRates = useCurrencyStore(state => state.fetchExchangeRates);
  const { rates, isLoading } = useExchangeRates('EUR');

  console.log('currencies in popup:', currencies);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Coins size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Changer la devise</h3>
              <p className="text-sm text-gray-500">
                Sélectionnez une devise pour ce montant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full" 
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <Info size={16} />
            <p className="text-sm">
              Changer la devise d'un montant convertira sa valeur selon le taux de change actuel. 
              Le montant affiché dans la colonne "Total" sera toujours converti dans la devise par défaut ({selectedCurrency}).
            </p>
          </div>
          
          {currentRate && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <div className="text-sm text-gray-600 mb-1">Montant actuel ({currentCurrency})</div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(currentRate)} {currencies.find(c => c.code === currentCurrency)?.symbol || currentCurrency}</div>
              {currentCurrency !== selectedCurrency && (
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <span>≈</span>
                  <span className="font-medium">{formatNumber(convertCurrencyAmount(currentRate, currentCurrency, selectedCurrency, currencies))}</span>
                  <span>{selectedCurrency}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-700">Sélectionner une devise</div>
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchExchangeRates();
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  disabled={isLoading}
                >
                  Actualiser les taux
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {currencies.map(currency => {
                const convertedRate = currentRate !== undefined && currentCurrency
                  ? convertCurrencyAmount(currentRate, currentCurrency, currency.code, currencies)
                  : undefined;
                return (
                  <button
                    key={currency.code}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCurrency(currency.code, convertedRate);
                    }}
                    className={`flex items-center justify-between w-full p-3 rounded-md text-left ${
                      currency.code === currentCurrency 
                        ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                        : 'hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">{currency.symbol}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{currency.name}</span>
                        <span className="text-xs text-gray-500">{currency.code}</span>
                        <span className="text-xs text-gray-400">1 EUR = {currency.rate} {currency.code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {convertedRate !== undefined && (
                        <span className="text-sm font-medium">
                          {formatNumber(convertedRate)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <div className="flex-1 text-xs text-gray-500 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            {lastUpdate ? `Taux mis à jour le ${formatDate(lastUpdate)}` : 'Taux de change actualisés'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}