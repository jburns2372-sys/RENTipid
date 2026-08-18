export type ComplianceStatus = 
  | 'SUPPORTED' 
  | 'VALIDATION_REQUIRED' 
  | 'COMPLIANCE_READY' 
  | 'ACTIVE' 
  | 'RESTRICTED' 
  | 'BLOCKED';

export interface LegalControlRecord {
  lawId: string;
  countryOrRegion: string;
  officialName: string;
  primaryApplication: string;
  status: ComplianceStatus;
  effectiveDate?: string;
  isCore?: boolean;
}

export const PHILIPPINE_REGISTER: LegalControlRecord[] = [
  {
    lawId: 'PH-ITA-2023',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 11967 - Internet Transactions Act of 2023',
    primaryApplication: 'Core online marketplace; online sale/lease transactions; merchant/provider transparency; platform duties; complaints; takedown; regulated listings; consumer protection.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-ITA-IRR',
    countryOrRegion: 'Philippines',
    officialName: 'Implementing Rules and Regulations of RA 11967 - Joint Administrative Order No. 24-03',
    primaryApplication: 'Operational implementation of the Internet Transactions Act and marketplace requirements.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-CONSUMER-ACT',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 7394 - Consumer Act of the Philippines',
    primaryApplication: 'Consumer rights, safety, representations, unfair/deceptive practices, information and redress.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-ECOM-ACT',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 8792 - Electronic Commerce Act of 2000 and applicable IRR',
    primaryApplication: 'Electronic contracts, documents, records, signatures and digital transactions.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-DPA-2012',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 10173 - Data Privacy Act of 2012, IRR and applicable NPC issuances',
    primaryApplication: 'Personal data, KYC, identity, bookings, messaging, analytics, AI/profiling, retention, security, breach handling and data-subject rights.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-CYBERCRIME',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 10175 - Cybercrime Prevention Act of 2012 and applicable IRR',
    primaryApplication: 'Unauthorized access, computer/data interference, fraud, identity misuse and platform cybersecurity.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-IP-CODE',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 8293 - Intellectual Property Code of the Philippines, as amended',
    primaryApplication: 'Copyright, trademarks, photos, videos, descriptions, provider branding, notices and infringement controls.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-COMPETITION',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 10667 - Philippine Competition Act and applicable IRR',
    primaryApplication: 'Competition, anti-competitive practices, abuse of dominance and marketplace conduct.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-CIVIL-CODE',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 386 - Civil Code of the Philippines',
    primaryApplication: 'Contracts, obligations and applicable lease principles.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-ANTI-TRAFFICKING',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 11862 - Expanded Anti-Trafficking in Persons Act of 2022',
    primaryApplication: 'Platform safety, exploitation-related prohibited content/services, reporting/preservation/takedown duties where applicable.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-OSAEC',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 11930 - Anti-OSAEC and Anti-CSAEM Act',
    primaryApplication: 'Child-safety content controls, reporting, preservation, blocking/removal and cooperation duties where applicable.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-TAX-CODE',
    countryOrRegion: 'Philippines',
    officialName: 'National Internal Revenue Code of 1997, as amended',
    primaryApplication: 'Income tax, VAT, withholding, invoicing and records according to transaction and entity status.',
    status: 'ACTIVE',
    isCore: true
  },
  {
    lawId: 'PH-BIR-RR-16-2023',
    countryOrRegion: 'Philippines',
    officialName: 'BIR Revenue Regulations No. 16-2023 and RMC No. 8-2024',
    primaryApplication: 'Withholding on qualifying remittances by e-marketplace operators / digital financial service providers.',
    status: 'VALIDATION_REQUIRED' // CONDITIONAL
  },
  {
    lawId: 'PH-VAT-DIGITAL',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 12023 and BIR Revenue Regulations No. 3-2025',
    primaryApplication: 'VAT on digital services; application depends on the service and tax posture.',
    status: 'VALIDATION_REQUIRED' // CONDITIONAL
  },
  {
    lawId: 'PH-PAYMENT-SYSTEMS',
    countryOrRegion: 'Philippines',
    officialName: 'Republic Act No. 11127 - National Payment Systems Act',
    primaryApplication: 'Relevant if RENTipid itself performs regulated payment-system/operator functions rather than only integrating licensed partners.',
    status: 'COMPLIANCE_READY'
  }
];

export const INTERNATIONAL_REGISTER: LegalControlRecord[] = [
  {
    lawId: 'EU-DSA',
    countryOrRegion: 'European Union / EEA',
    officialName: 'Regulation (EU) 2022/2065 - Digital Services Act (DSA)',
    primaryApplication: 'Online intermediary/platform duties, illegal-content notice/action, moderation, reasons, ads, recommendations, trader traceability where applicable.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'EU-GDPR',
    countryOrRegion: 'European Union / EEA',
    officialName: 'Regulation (EU) 2016/679 - General Data Protection Regulation (GDPR)',
    primaryApplication: 'EU personal data, rights, controllers/processors, security, transfers, privacy-by-design and applicable profiling/automated processing.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'EU-P2B',
    countryOrRegion: 'European Union / EEA',
    officialName: 'Regulation (EU) 2019/1150 - Platform-to-Business Regulation',
    primaryApplication: 'Business-user terms, ranking transparency, restrictions/suspension, data access and complaint mechanisms.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'EU-AI-ACT',
    countryOrRegion: 'European Union / EEA',
    officialName: 'Regulation (EU) 2024/1689 - Artificial Intelligence Act',
    primaryApplication: 'AI-system obligations according to classification, role, deployment and territorial scope.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'EU-CRD',
    countryOrRegion: 'European Union / EEA',
    officialName: 'Directive 2011/83/EU - Consumer Rights Directive',
    primaryApplication: 'Distance-contract and consumer information/cancellation requirements as implemented nationally.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'UK-GDPR',
    countryOrRegion: 'United Kingdom',
    officialName: 'UK GDPR + Data Protection Act 2018',
    primaryApplication: 'UK personal-data processing, rights, security, transfers and accountability.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'US-FTC',
    countryOrRegion: 'United States',
    officialName: 'Federal Trade Commission Act - Section 5',
    primaryApplication: 'Unfair or deceptive acts/practices, marketing and marketplace representations.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'US-CCPA',
    countryOrRegion: 'United States',
    officialName: 'California Consumer Privacy Act (CCPA), as amended by CPRA; plus other applicable state privacy/consumer laws',
    primaryApplication: 'State-specific privacy rights, disclosures, opt-outs and business obligations according to thresholds and state coverage.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'CA-PIPEDA',
    countryOrRegion: 'Canada',
    officialName: 'Personal Information Protection and Electronic Documents Act (PIPEDA)',
    primaryApplication: 'Federal private-sector privacy where applicable, subject to provincial regimes.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'AU-PRIVACY',
    countryOrRegion: 'Australia',
    officialName: 'Privacy Act 1988 + Australian Privacy Principles',
    primaryApplication: 'Personal-information handling, security and privacy rights for covered entities.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'SG-PDPA',
    countryOrRegion: 'Singapore',
    officialName: 'Personal Data Protection Act 2012 (PDPA)',
    primaryApplication: 'Personal-data collection, use, disclosure, protection and accountability.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'MY-PDPA',
    countryOrRegion: 'Malaysia',
    officialName: 'Personal Data Protection Act 2010 [Act 709], as amended by Act A1727 (2024)',
    primaryApplication: 'Personal-data protection and updated duties.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'ID-PDP',
    countryOrRegion: 'Indonesia',
    officialName: 'Law No. 27 of 2022 concerning Personal Data Protection',
    primaryApplication: 'Personal-data protection and data-subject/controller obligations.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'VN-ECOMMERCE',
    countryOrRegion: 'Vietnam',
    officialName: 'Law No. 122/2025/QH15 - Law on E-Commerce (effective 1 July 2026)',
    primaryApplication: 'Current e-commerce/platform framework.',
    status: 'VALIDATION_REQUIRED',
    effectiveDate: '2026-07-01'
  },
  {
    lawId: 'JP-APPI',
    countryOrRegion: 'Japan',
    officialName: 'Act on the Protection of Personal Information (APPI), Act No. 57 of 2003, as amended',
    primaryApplication: 'Personal-information protection and cross-border data obligations.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'KR-PIPA',
    countryOrRegion: 'South Korea',
    officialName: 'Personal Information Protection Act (PIPA), as amended',
    primaryApplication: 'Comprehensive personal-data protection and processing requirements.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'IN-DPDP',
    countryOrRegion: 'India',
    officialName: 'Digital Personal Data Protection Act, 2023',
    primaryApplication: 'Personal-data processing according to commencement and implementing framework.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'AE-ECOMMERCE',
    countryOrRegion: 'United Arab Emirates',
    officialName: 'Federal Decree-Law No. 14 of 2023 Concerning Modern Technology-Based Trade',
    primaryApplication: 'Technology-based trade/e-commerce framework.',
    status: 'VALIDATION_REQUIRED'
  },
  {
    lawId: 'BR-LGPD',
    countryOrRegion: 'Brazil',
    officialName: 'Law No. 13.709/2018 - Lei Geral de Protecao de Dados Pessoais (LGPD)',
    primaryApplication: 'Personal-data protection and rights.',
    status: 'VALIDATION_REQUIRED'
  }
];

export const ALL_REGISTERS = [...PHILIPPINE_REGISTER, ...INTERNATIONAL_REGISTER];

export function getLawsByJurisdiction(jurisdiction: string) {
  return ALL_REGISTERS.filter(
    law => law.countryOrRegion.toLowerCase() === jurisdiction.toLowerCase() || 
           law.countryOrRegion.toLowerCase().includes(jurisdiction.toLowerCase())
  );
}

export function getAllJurisdictions() {
  return Array.from(new Set(ALL_REGISTERS.map(law => law.countryOrRegion)));
}
