import useSWR from 'swr';

const API_KEY = 'ba98acda43b531d906f8ff85'; // Free API key for exchange rates
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

const fetcher = async (url: string) => {
  try {
    console.log('Fetching exchange rates from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des taux de change');
    }
    const data = await response.json();
    console.log('Exchange rates response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return { conversion_rates: {} }; // Return empty rates on error
  }
};

export function useExchangeRates(baseCurrency: string = 'EUR') {
  const { data, error, isLoading } = useSWR(
    `${BASE_URL}/${API_KEY}/latest/${baseCurrency}`,
    fetcher,
    {
      refreshInterval: 3600000, // Rafraîchir toutes les heures
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // Avoid duplicate requests
      errorRetryCount: 3
    }
  );

  return {
    rates: data?.conversion_rates,
    error,
    isLoading
  };
}