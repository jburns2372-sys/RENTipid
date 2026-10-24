export type PsgcLevel = 'REGION' | 'PROVINCE' | 'CITY' | 'MUNICIPALITY' | 'SUB_MUNICIPALITY' | 'BARANGAY';

export interface PsgcSubdivisionRecord {
  psgcCode: string;
  name: string;
  geographicLevel: PsgcLevel;
  parentPsgcCode: string | null;
  isActive: boolean;
  source: string;
  sourceVersion: string;
}

export interface PsgcBarangayOption {
  psgcCode: string;
  name: string;
}

export interface PsgcCityOption {
  psgcCode: string;
  name: string;
  geographicLevel: 'CITY' | 'MUNICIPALITY';
}

export interface PsgcCityResolution {
  resolved: boolean;
  psgcCode?: string;
  canonicalName?: string;
  geographicLevel?: 'CITY' | 'MUNICIPALITY';
}
