export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0,00';
  
  // Formater avec la locale française
  const formatted = value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Remplacer les espaces par des espaces insécables
  return formatted.replace(/\s/g, '\u00A0');
}