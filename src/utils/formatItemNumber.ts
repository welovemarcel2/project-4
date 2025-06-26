import { NumberingFormat } from '../types/quoteSettings';

// Convertit un nombre en lettre (A, B, C, ..., Z, AA, AB, ...)
export function toAlphabetic(num: number): string {
  if (num <= 0) return '';
  
  let result = '';
  let n = num;
  
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  
  return result;
}

// Convertit un nombre en chiffre romain (I, II, III, IV, V, ...)
export function toRoman(num: number): string {
  if (num <= 0) return '';
  
  const romanNumerals = [
    { value: 1000, numeral: 'M' },
    { value: 900, numeral: 'CM' },
    { value: 500, numeral: 'D' },
    { value: 400, numeral: 'CD' },
    { value: 100, numeral: 'C' },
    { value: 90, numeral: 'XC' },
    { value: 50, numeral: 'L' },
    { value: 40, numeral: 'XL' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' }
  ];
  
  let result = '';
  let n = num;
  
  for (const { value, numeral } of romanNumerals) {
    while (n >= value) {
      result += numeral;
      n -= value;
    }
  }
  
  return result;
}

// Formate un nombre selon le format spécifié
export function formatNumber(num: number, format: NumberingFormat): string {
  switch (format) {
    case 'numeric':
      return num.toString();
    case 'alphabetic':
      return toAlphabetic(num);
    case 'roman':
      return toRoman(num);
    case 'none':
      return '';
    default:
      return num.toString();
  }
}

// Formate un tableau de nombres selon les formats spécifiés
export function formatItemNumber(
  numbers: number[],
  formats: NumberingFormat[],
  separator: string
): string {
  if (numbers.length === 0) return '';
  
  // S'assurer que nous avons suffisamment de formats pour tous les nombres
  const safeFormats = formats.length >= numbers.length
    ? formats
    : [...formats, ...Array(numbers.length - formats.length).fill('numeric')];
  
  return numbers
    .map((num, index) => formatNumber(num, safeFormats[index]))
    .filter(Boolean) // Filtrer les formats 'none'
    .join(separator);
}