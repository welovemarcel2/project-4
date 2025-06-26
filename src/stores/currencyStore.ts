// TODO: Nouvelle gestion currency à recoder from scratch

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CurrencyCode, Currency, defaultCurrencies } from '../types/currency';
import axios from 'axios';
import { convertCurrencyAmount } from '../utils/currency/currencyUtils';

const API_KEY = 'ba98acda43b531d906f8ff85'; // Free API key for exchange rates
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

interface CurrencyStore {
  selectedCurrency: CurrencyCode;
  currencies: Currency[];
  lastUpdate?: Date;
  setSelectedCurrency: (code: CurrencyCode) => void;
  updateCurrencyRate: (code: CurrencyCode, rate: number) => void;
  removeCurrency: (code: CurrencyCode) => void;
  convertAmount: (amount: number, fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode) => number;
  fetchExchangeRates: () => Promise<void>;
  getAllCurrencies: () => Currency[];
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      selectedCurrency: 'EUR',
      currencies: [
        { code: 'EUR', symbol: '€', name: 'Euro', rate: 1 },
        { code: 'USD', symbol: '$', name: 'Dollar US', rate: 1.09 },
        { code: 'GBP', symbol: '£', name: 'Livre Sterling', rate: 0.86 },
        { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse', rate: 0.96 },
        { code: 'CAD', symbol: 'C$', name: 'Dollar Canadien', rate: 1.48 }
      ],
      lastUpdate: undefined,

      setSelectedCurrency: (code) => {
        // Mettre à jour la devise sélectionnée
        set(state => {
          // Récupérer les taux de change depuis l'API si nécessaire
          if (navigator.onLine) {
            state.fetchExchangeRates();
          }
          
          return { selectedCurrency: code };
        });
      },

      updateCurrencyRate: (code, rate) => {
        set((state) => {
          if (state.currencies.some(c => c.code === code)) {
            return {
              currencies: state.currencies.map((currency) =>
                currency.code === code ? { ...currency, rate } : currency
              ),
              lastUpdate: new Date()
            };
          }
          const newCurrency = defaultCurrencies.find(c => c.code === code);
          if (!newCurrency) return state;
          
          return {
            currencies: [...state.currencies, { ...newCurrency, rate }],
            lastUpdate: new Date()
          };
        });
      },

      removeCurrency: (code) => {
        set((state) => ({
          currencies: state.currencies.filter((currency) => currency.code !== code),
        }));
      },

      convertAmount: (amount, fromCurrency = 'EUR', toCurrency) => {
        const { currencies, selectedCurrency } = get();
        const targetCurrency = toCurrency || selectedCurrency;
        
        return convertCurrencyAmount(amount, fromCurrency, targetCurrency, currencies);
      },
      
      fetchExchangeRates: async () => {
        try {
          const response = await axios.get(`${BASE_URL}/${API_KEY}/latest/EUR`);
          let currencies = get().currencies;
          // Fallback si la liste est vide ou corrompue
          if (!currencies || currencies.length === 0) {
            currencies = [...defaultCurrencies];
            set({ currencies });
          }
          if (response.data && response.data.conversion_rates) {
            const { conversion_rates } = response.data;
            // Met à jour les taux uniquement pour les devises déjà présentes dans le store
            const updatedCurrencies = currencies.map(currency => {
              const newRate = conversion_rates[currency.code];
              return newRate
                ? { ...currency, rate: newRate }
                : currency;
            });
            set({ 
              currencies: updatedCurrencies,
              lastUpdate: new Date() 
            });
          }
          // Vérification finale
          if (!get().currencies || get().currencies.length === 0) {
            set({ currencies: [...defaultCurrencies] });
          }
        } catch (error) {
          console.error('Error fetching exchange rates:', error);
          // Fallback si erreur API
          if (!get().currencies || get().currencies.length === 0) {
            set({ currencies: [...defaultCurrencies] });
          }
        }
      },

      getAllCurrencies: () => {
        const current = get().currencies;
        const codes = current.map((c: Currency) => c.code);
        return [
          ...current,
          ...defaultCurrencies.filter(dc => !codes.includes(dc.code))
        ];
      },
    }),
    {
      name: 'currency-storage',
      version: 2,
    }
  )
);

// Initialize exchange rates when the app loads
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    useCurrencyStore.getState().fetchExchangeRates();
    
    // Set up interval to refresh rates every 24 hours
    setInterval(() => {
      useCurrencyStore.getState().fetchExchangeRates();
    }, 24 * 60 * 60 * 1000);
  }, 1000); // Delay initial fetch to ensure store is hydrated
}