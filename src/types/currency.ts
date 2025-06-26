export type CurrencyCode = 
  | 'EUR' | 'USD' | 'GBP' | 'CHF' | 'CAD' | 'JPY' | 'AUD' | 'NZD' 
  | 'CNY' | 'HKD' | 'SGD' | 'INR' | 'MXN' | 'BRL' | 'ZAR' | 'AED'
  | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'TRY' | 'RUB';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number;
}

export const defaultCurrencies: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 1 },
  { code: 'USD', symbol: '$', name: 'Dollar US', rate: 1.09 },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling', rate: 0.86 },
  { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse', rate: 0.96 },
  { code: 'CAD', symbol: 'C$', name: 'Dollar Canadien', rate: 1.48 },
  { code: 'JPY', symbol: '¥', name: 'Yen Japonais', rate: 163.12 },
  { code: 'AUD', symbol: 'A$', name: 'Dollar Australien', rate: 1.67 },
  { code: 'NZD', symbol: 'NZ$', name: 'Dollar Néo-Zélandais', rate: 1.78 },
  { code: 'CNY', symbol: '¥', name: 'Yuan Chinois', rate: 7.87 },
  { code: 'HKD', symbol: 'HK$', name: 'Dollar de Hong Kong', rate: 8.52 },
  { code: 'SGD', symbol: 'S$', name: 'Dollar de Singapour', rate: 1.46 },
  { code: 'INR', symbol: '₹', name: 'Roupie Indienne', rate: 90.76 },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicain', rate: 18.45 },
  { code: 'BRL', symbol: 'R$', name: 'Real Brésilien', rate: 5.42 },
  { code: 'ZAR', symbol: 'R', name: 'Rand Sud-africain', rate: 20.81 },
  { code: 'AED', symbol: 'د.إ', name: 'Dirham des EAU', rate: 4.01 },
  { code: 'SEK', symbol: 'kr', name: 'Couronne Suédoise', rate: 11.42 },
  { code: 'NOK', symbol: 'kr', name: 'Couronne Norvégienne', rate: 11.78 },
  { code: 'DKK', symbol: 'kr', name: 'Couronne Danoise', rate: 7.46 },
  { code: 'PLN', symbol: 'zł', name: 'Złoty Polonais', rate: 4.32 },
  { code: 'CZK', symbol: 'Kč', name: 'Couronne Tchèque', rate: 25.35 },
  { code: 'HUF', symbol: 'Ft', name: 'Forint Hongrois', rate: 389.52 },
  { code: 'TRY', symbol: '₺', name: 'Livre Turque', rate: 34.78 },
  { code: 'RUB', symbol: '₽', name: 'Rouble Russe', rate: 100.25 }
];