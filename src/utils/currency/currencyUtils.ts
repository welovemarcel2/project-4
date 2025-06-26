import { CurrencyCode, Currency } from '../../types/currency';

/**
 * Convertit un montant d'une devise à une autre
 * @param amount - Le montant à convertir
 * @param fromCurrency - La devise source
 * @param toCurrency - La devise cible
 * @param currencies - La liste des devises avec leurs taux
 * @returns Le montant converti
 */
export function convertCurrencyAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  currencies: Currency[]
): number {
  // Si les devises sont identiques, pas de conversion nécessaire
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Trouver les taux de change pour les deux devises
  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  const toCurrencyData = currencies.find(c => c.code === toCurrency);

  if (!fromCurrencyData || !toCurrencyData) {
    console.warn(`[convertCurrencyAmount] Devise non trouvée: ${fromCurrency} ou ${toCurrency}`);
    return amount; // Retourner le montant original si une devise n'est pas trouvée
  }

  // Convertir via EUR (devise de base)
  const fromRate = fromCurrencyData.rate;
  const toRate = toCurrencyData.rate;

  if (fromRate === 0) {
    console.warn(`[convertCurrencyAmount] Taux de change nul pour ${fromCurrency}`);
    return amount;
  }

  // Conversion: montant / taux_source * taux_cible
  const result = (amount / fromRate) * toRate;

  return Math.round(result * 100) / 100; // Arrondir à 2 décimales
}

/**
 * Formats a currency amount with the appropriate symbol
 * @param amount The amount to format
 * @param currencyCode The currency code
 * @param currencies The list of available currencies
 * @returns Formatted currency string
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: CurrencyCode,
  currencies: Currency[]
): string {
  const currency = currencies.find(c => c.code === currencyCode);
  if (!currency) return `${amount} ${currencyCode}`;
  
  return `${amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency.symbol}`;
}