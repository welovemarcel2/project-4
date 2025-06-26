import { QuoteSettings } from './quoteSettings';

export interface Project {
  id: string;
  name: string;
  client: string;
  settings: QuoteSettings;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  sharedWith: ProjectShare[];
  archived?: boolean;
  
  // New foreign key references
  producersId?: string;
  informationsId?: string;
  ratesId?: string;
  socialChargesId?: string;
  currenciesId?: string;
  
  // Related data
  producers?: ProjectProducers;
  informations?: ProjectInformations;
  rates?: ProjectRates;
  socialCharges?: ProjectSocialCharges;
  currencies?: ProjectCurrencies;
}

export interface ProjectProducers {
  id: string;
  projectId: string;
  producer: string;
  productionManager: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectInformations {
  id: string;
  projectId: string;
  agency: string;
  advertiser: string;
  product: string;
  title: string;
  customFields: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectRates {
  id: string;
  projectId: string;
  defaultAgencyPercent: number;
  defaultMarginPercent: number;
  rateLabels: {
    rate1Label: string;
    rate2Label: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSocialCharges {
  id: string;
  projectId: string;
  socialChargeRates: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCurrencies {
  id: string;
  projectId: string;
  selectedCurrency: string;
  currencies: any[];
  lastUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectShare {
  email: string;
  sharedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sharedAt: Date;
  permissions: {
    canEdit: boolean;
    canShare: boolean;
  };
}

export type QuoteType = 'main' | 'additive';
export type QuoteStatus = 'draft' | 'validated' | 'rejected';

export interface Quote {
  id: string;
  projectId: string;
  name: string;
  type: QuoteType;
  parentQuoteId?: string;
  status: QuoteStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  validatedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  isOffline?: boolean;
  is_deleted?: boolean;
  
  // New foreign key references
  displaysId?: string;
  numberingsId?: string;
  unitsId?: string;
  
  // Related data
  displays?: QuoteDisplays;
  numberings?: QuoteNumberings;
  units?: QuoteUnits;
}

export interface QuoteDisplays {
  id: string;
  quoteId: string;
  showEmptyItems: boolean;
  socialChargesDisplay: 'detailed' | 'grouped';
  applySocialChargesMargins: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteNumberings {
  id: string;
  quoteId: string;
  category: string;
  subCategory: string;
  post: string;
  subPost: string;
  separator: string;
  continuousNumbering: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteUnits {
  id: string;
  quoteId: string;
  availableUnits: string[];
  createdAt: Date;
  updatedAt: Date;
}