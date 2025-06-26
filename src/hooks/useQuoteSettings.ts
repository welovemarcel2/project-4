import { useState, useCallback, useEffect } from 'react';
import { QuoteSettings, DEFAULT_SETTINGS } from '../types/quoteSettings';
import { useUserStore } from '../stores/userStore';
import { useCurrencyStore } from '../stores/currencyStore';

export function useQuoteSettings(initialSettings?: Partial<QuoteSettings> | null) {
  // Initialize with default settings, merged with any provided initial settings
  const [settings, setSettings] = useState<QuoteSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...(initialSettings || {})
  }));
  
  const currentUser = useUserStore(state => state.currentUser);
  const { currencies, selectedCurrency } = useCurrencyStore();

  // Initialize settings with production information
  useEffect(() => {
    if (currentUser?.role === 'production') {
      setSettings(prev => ({
        ...prev,
        production: {
          ...prev.production,
          name: currentUser.productionName || prev.production.name,
          address: currentUser.productionAddress || prev.production.address,
          logo: currentUser.productionLogo || prev.production.logo
        },
        termsAndConditions: currentUser.productionTerms || prev.termsAndConditions
      }));
    }
  }, [currentUser]);

  // Initialize settings with currency information
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      selectedCurrency: selectedCurrency,
      currencies: currencies
    }));
  }, [selectedCurrency, currencies]);

  const updateSettings = useCallback((updates: Partial<QuoteSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      
      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'numbering' && value) {
          // Ensure numbering is properly merged
          newSettings.numbering = {
            ...(newSettings.numbering || DEFAULT_SETTINGS.numbering),
            ...value
          };
        } else {
          // @ts-ignore - We know the key exists in the settings
          newSettings[key] = value;
        }
      });
      
      // If the user is a production, always preserve production information
      if (currentUser?.role === 'production') {
        newSettings.production = {
          ...newSettings.production,
          name: currentUser.productionName || newSettings.production.name,
          address: currentUser.productionAddress || newSettings.production.address,
          logo: currentUser.productionLogo || newSettings.production.logo
        };
        
        // Only update terms if not explicitly provided in updates
        if (!updates.termsAndConditions && currentUser.productionTerms) {
          newSettings.termsAndConditions = currentUser.productionTerms;
        }
      }
      
      return newSettings;
    });
  }, [currentUser]);

  return {
    settings,
    updateSettings
  };
}