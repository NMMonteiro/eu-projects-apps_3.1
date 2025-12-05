// Partner-related type definitions

export interface Partner {
  id: string;
  name: string;
  legalNameNational?: string;
  acronym?: string;
  organisationId?: string;
  pic?: string;
  role?: string;
  organizationType?: string;
  isPublicBody?: boolean;
  isNonProfit?: boolean;
  country?: string;
  contactEmail?: string;
  website?: string;
  description?: string;
  keywords?: string[];
  logoUrl?: string;
  pdfUrl?: string;

  // Legal Representative
  legalRepName?: string;
  legalRepPosition?: string;
  legalRepEmail?: string;
  legalRepPhone?: string;

  // Contact Person
  contactPersonName?: string;
  contactPersonPosition?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;

  // Experience
  experience?: string;
  createdAt: string;
}