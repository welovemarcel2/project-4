import { useEffect, useState } from 'react';

export interface Currency {
  code: string;
  name: string;
  rate: number;
}

export function useAllCurrencies(base: string = 'EUR') {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<string>(base);

  useEffect(() => {
    let isMounted = true;
    async function fetchCurrencies() {
      setLoading(true);
      setError(null);
      try {
        const symbolsRes = await fetch('https://api.exchangerate.host/symbols');
        const symbolsData = await symbolsRes.json();
        console.log('symbolsData:', symbolsData);

        const ratesRes = await fetch(`https://api.exchangerate.host/latest?base=${base}`);
        const ratesData = await ratesRes.json();
        console.log('ratesData:', ratesData);

        const all = Object.keys(ratesData.rates).map(code => ({
          code,
          name: symbolsData.symbols[code]?.description || code,
          rate: ratesData.rates[code]
        }));
        console.log('all currencies:', all);

        if (isMounted) setCurrencies(all);
      } catch (e) {
        console.error('Erreur dans fetchCurrencies:', e);
        if (isMounted) setError('Erreur lors du chargement des devises');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCurrencies();
    return () => { isMounted = false; };
  }, [base]);

  return {
    currencies,
    loading,
    error,
    defaultCurrency,
    setDefaultCurrency,
  };
} 