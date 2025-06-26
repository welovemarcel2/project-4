import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle, RefreshCw, Info, Check, Coins, Star } from 'lucide-react';
import { QuoteSettings } from '../../../types/quoteSettings';
import { BudgetCategory, BudgetLine } from '../../../types/budget';
import { useCurrencyStore } from '../../../stores/currencyStore';
import { CurrencyCode, defaultCurrencies } from '../../../types/currency';
import { useExchangeRates } from '../../../hooks/useExchangeRates';
import { formatNumber } from '../../../utils/formatNumber'; 
import { formatDate } from '../../../utils/formatDate';

interface CurrencySettingsProps {
  onClose?: () => void;
  budget: BudgetCategory[];
  onUpdateBudget: (budget: BudgetCategory[]) => void;
  settings?: QuoteSettings;
  onUpdateSettings?: (settings: Partial<QuoteSettings>) => void;
}

export function CurrencySettings({ 
  onClose, 
  budget,
  onUpdateBudget,
  settings,
  onUpdateSettings
}: CurrencySettingsProps) {
  const [error, setError] = useState<string | null>(null);
  const { selectedCurrency, currencies, setSelectedCurrency, updateCurrencyRate, removeCurrency, convertAmount } = useCurrencyStore();
  const { rates, error: ratesError, isLoading } = useExchangeRates('EUR'); 
  const lastUpdate = useCurrencyStore(state => state.lastUpdate);
  
  // Définition de la fonction handleRefreshRates qui était manquante
  const handleRefreshRates = () => {
    if (!rates) return;
    
    currencies.forEach(currency => {
      if (currency.code !== 'EUR' && rates[currency.code]) {
        updateCurrencyRate(currency.code, rates[currency.code]);
      }
    });
  };

  const handleSetDefault = (code: CurrencyCode) => {
    const oldDefaultCurrency = selectedCurrency;
    setSelectedCurrency(code);
    
    // Update settings if provided
    if (settings && onUpdateSettings) {
      onUpdateSettings({
        selectedCurrency: code
      });
    }

    // Note: Ne pas convertir automatiquement les rates lors du changement de devise par défaut
    // Les rates restent inchangés, seule la devise par défaut change
    // La conversion se fait automatiquement à l'affichage dans les composants
  };

  const handleRemoveCurrency = (code: CurrencyCode) => {
    if (code === selectedCurrency) {
      setError('Impossible de supprimer la devise par défaut');
      return;
    }
    if (code === 'EUR') {
      setError('Impossible de supprimer l\'Euro');
      return;
    }
    removeCurrency(code);
    
    // Update settings if provided
    if (settings && onUpdateSettings) {
      onUpdateSettings({
        currencies: currencies.filter(c => c.code !== code)
      });
    }
    // Convertir tous les montants qui utilisent cette devise vers la devise par défaut
    const updateItemRates = (items: BudgetLine[]): BudgetLine[] => {
      return items.map(item => {
        const updatedItem = { ...item };
        
        // Si l'élément utilise la devise supprimée, convertir vers la devise par défaut
        if (item.currency === code) {
          updatedItem.rate = convertAmount(item.rate, code, selectedCurrency);
          updatedItem.currency = undefined; // Supprimer la référence à la devise spécifique
        }
        
        // Recursively update sub-items
        if (item.subItems && item.subItems.length > 0) {
          updatedItem.subItems = updateItemRates(item.subItems);
        }
        
        return updatedItem;
      });
    };

    const updatedBudget = budget.map(category => ({
      ...category,
      items: updateItemRates(category.items)
    }));

    onUpdateBudget(updatedBudget);
  };

  // Utiliser toutes les devises disponibles
  const allCurrencies = defaultCurrencies;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-900">Devises</h4>

      {(error || ratesError) && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
          <AlertTriangle size={16} />
          {error || "Erreur lors de la récupération des taux de change"}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Devise par défaut
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {currencies.map(currency => (
              <button
                key={currency.code}
                onClick={() => handleSetDefault(currency.code)}
                className={`flex items-center justify-between w-full p-3 rounded-md text-left ${
                  currency.code === selectedCurrency 
                    ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">{currency.symbol}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{currency.code}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[80px]">{currency.name}</span>
                  </div>
                </div>
                
                <Star 
                  size={16} 
                  className={currency.code === selectedCurrency 
                    ? "text-blue-500 fill-blue-500" 
                    : "text-blue-500"} 
                />
              </button>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 mb-4">
            La devise par défaut est utilisée pour tous les montants qui n'ont pas de devise spécifique.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                Dernière mise à jour : {lastUpdate ? formatDate(lastUpdate) : 'Jamais'}
              </span>
            <button
              onClick={handleRefreshRates}
              disabled={isLoading || !rates}
              className="flex items-center gap-1.5 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 ml-4"
              title="Actualiser les taux"
              type="button"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Actualiser
            </button>
            </div>
          </div>

          {/* Liste des devises */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto p-1">
            {allCurrencies.map(currency => {
              const isInProject = currencies.some(c => c.code === currency.code);
              const isDefault = currency.code === selectedCurrency;
              
              return (
                <div 
                  key={currency.code} 
                  className={`flex flex-col p-3 border rounded-md ${
                    isDefault ? 'bg-blue-50 border-blue-200' : 
                    isInProject ? 'border-gray-200' : 'border-gray-200 border-dashed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium w-6 text-center">{currency.symbol}</span>
                      <div>
                        <div className="text-xs font-medium">{currency.code}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[100px]">{currency.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSetDefault(currency.code as CurrencyCode)}
                        className="p-1 rounded-full hover:bg-blue-100"
                        title={isDefault ? "Devise par défaut" : "Définir comme devise par défaut"}
                      >
                        <Star 
                          size={14} 
                          className={isDefault ? "text-blue-500 fill-blue-500" : "text-blue-500"} 
                        />
                      </button>
                      
                      {isInProject && currency.code !== 'EUR' && currency.code !== selectedCurrency && (
                        <button
                          onClick={() => handleRemoveCurrency(currency.code as CurrencyCode)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Supprimer la devise"
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {isInProject && currency.code !== 'EUR' && (
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-500">1 EUR =</div>
                      <input
                        type="number"
                        value={currency.rate}
                        onChange={(e) => updateCurrencyRate(currency.code as CurrencyCode, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-right text-xs border rounded"
                        min="0"
                        step="0.0001"
                      />
                    </div>
                  )}
                  
                  {!isInProject && rates && rates[currency.code] && (
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-500">1 EUR =</div>
                      <div className="text-xs text-gray-700">{formatNumber(rates[currency.code])}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}