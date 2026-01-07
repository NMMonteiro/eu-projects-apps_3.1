// Partner-related type definitions

export interface Partner {
  id: string;
  name: string;
  legalNameNational?: string;
  acronym?: string;
  organisationId?: string; // OID or PIC
  pic?: string;
  vatNumber?: string;
  businessId?: string;
  organizationType?: string; // SME, University, Research, NGO, Public, etc.
  isPublicBody?: boolean;
  isNonProfit?: boolean;
  country?: string;
  legalAddress?: string;
  city?: string;
  postcode?: string;
  region?: string;
  contactEmail?: string;
  website?: string;
  description?: string;
  department?: string;
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
  contactPersonRole?: string;

  // Expertise & Experience
  experience?: string;
  staffSkills?: string;
  relevantProjects?: string;
  
  // Role specifically for a project/proposal
  role?: string; // e.g. "Coordinator", "Partner"
  isCoordinator?: boolean;
  
  createdAt: string;
}