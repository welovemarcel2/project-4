export interface SocialChargeRate {
  id: string;
  label: string;
  rate: number;
  agencyPercent?: number;
  marginPercent?: number;
}

export interface ProductionInformation {
  name: string;
  address: string;
  logo: string;
  producer: string;
  productionManager: string;
}

export interface CustomField {
  id: string;
  title: string;
  content: string;
}

export interface QuoteInformation {
  projectName: string;
  projectType: string;
  agency?: string;
  advertiser?: string;
  product?: string;
  title?: string;
  customFields: CustomField[];
}

export type NumberingFormat = 'numeric' | 'alphabetic' | 'roman' | 'none';

export interface NumberingSettings {
  category: NumberingFormat;
  subCategory: NumberingFormat;
  post: NumberingFormat;
  subPost: NumberingFormat;
  separator: string;
  continuousNumbering: boolean;
}

export interface RateLabels {
  rate1Label: string; // Remplace "Frais généraux"
  rate2Label: string; // Remplace "Marge"
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

export interface QuoteSettings {
  socialChargeRates: SocialChargeRate[];
  availableUnits: string[];
  defaultAgencyPercent: number;
  defaultMarginPercent: number;
  showEmptyItems: boolean;
  socialChargesDisplay: 'grouped' | 'detailed';
  applySocialChargesMargins: boolean;
  production: ProductionInformation;
  information: QuoteInformation;
  termsAndConditions: string;
  numbering?: NumberingSettings;
  rateLabels?: RateLabels; // Nouveaux labels personnalisables
  selectedCurrency: string;
  currencies: Currency[];
  budgetLang?: 'fr' | 'en';
}

export const DEFAULT_SETTINGS: QuoteSettings = {
  socialChargeRates: [
    { id: '65', label: 'Techniciens', rate: 0.65 },
    { id: '55', label: 'Artistes', rate: 0.55 },
    { id: '3', label: 'Auteur', rate: 0.03 }
  ],
  availableUnits: ['Jour', 'Forfait', 'Semaine', 'Heure', 'Unités', '%', '-'],
  defaultAgencyPercent: 10,
  defaultMarginPercent: 15,
  showEmptyItems: true,
  socialChargesDisplay: 'detailed',
  applySocialChargesMargins: false,
  production: {
    name: '',
    address: '',
    logo: '',
    producer: '',
    productionManager: ''
  },
  information: {
    projectName: '',
    projectType: '',
    agency: '',
    advertiser: '',
    product: '',
    title: '',
    customFields: [
      { id: '1', title: 'Titre 1', content: '' },
      { id: '2', title: 'Titre 2', content: '' },
      { id: '3', title: 'Titre 3', content: '' },
      { id: '4', title: 'Titre 4', content: '' },
      { id: '5', title: 'Titre 5', content: '' }
    ]
  },
  termsAndConditions: '',
  numbering: {
    category: 'numeric',
    subCategory: 'numeric',
    post: 'numeric',
    subPost: 'numeric',
    separator: '.',
    continuousNumbering: false
  },
  rateLabels: {
    rate1Label: 'TX 1',
    rate2Label: 'TX 2'
  },
  selectedCurrency: 'EUR',
  currencies: [],
  budgetLang: 'fr',
};