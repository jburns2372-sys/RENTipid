import countryData from './countryData.json';

export interface CountryOption {
  countryCode: string; // ISO 3166-1 alpha-2
  countryName: string;
}

export const COUNTRIES: CountryOption[] = countryData as CountryOption[];
