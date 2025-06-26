import { QuoteSettings } from '../types';
import { DEFAULT_SOCIAL_CHARGES } from './socialCharges';
import { DEFAULT_UNITS } from './units';

export const DEFAULT_SETTINGS: QuoteSettings = {
  socialChargeRates: DEFAULT_SOCIAL_CHARGES,
  availableUnits: DEFAULT_UNITS,
  defaultAgencyPercent: 10,
  defaultMarginPercent: 15,
  showEmptyItems: true
};