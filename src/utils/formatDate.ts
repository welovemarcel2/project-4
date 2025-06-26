export function formatDate(date: Date): string {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  return formattedDate;
}