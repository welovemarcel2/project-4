import { QuoteSettings } from '../types/quoteSettings';

export const initialQuoteSettings: QuoteSettings = {
  socialChargeRates: [
    { id: '65', label: 'Techniciens', rate: 0.65 },
    { id: '55', label: 'Artistes', rate: 0.55 },
    { id: '3', label: 'Auteur', rate: 0.03 }
  ],
  availableUnits: ['Jour', 'Forfait', 'Semaine', 'Heure', '%', '-'],
  defaultAgencyPercent: 10,
  defaultMarginPercent: 15,
  showEmptyItems: true,
  socialChargesDisplay: 'detailed',
  applySocialChargesMargins: false,
  production: {
    name: 'ACME Productions',
    address: '123 rue de la Production\n75011 Paris\nFrance\nSIRET: 123 456 789 00012\nTVA: FR12 123 456 789',
    logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop&crop=center',
    producer: 'Jean Dupont',
    productionManager: 'Marie Martin'
  },
  information: {
    agency: 'Agence Créative Paris',
    advertiser: 'Marque Innovante',
    product: 'Nouveau Produit 2024',
    title: 'Film Promotionnel - Lancement Produit'
  },
  termsAndConditions: `...` // Garder le contenu existant
};