// Funding search type definitions

export interface FundingSource {
  id: string;
  name: string;
  url: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  lastUsed?: string;
}

export interface FundingOpportunity {
  id: string;
  sourceId: string;
  sourceName: string;
  url: string;
  title: string;
  deadline: string;
  fundingAmount: string;
  description: string;
  matchScore: number;
  matchReasoning: string;
  status: 'open' | 'closing-soon' | 'upcoming';
  eligibility?: string[];
  focusAreas?: string[];
}

export interface SearchOptions {
  partnerId: string;
  partnerProfile?: string;
  sourceIds?: string[];
  maxLinksPerSource?: number;
  geminiApiKey?: string;
}

export interface SearchResponse {
  opportunities: FundingOpportunity[];
  sourcesSearched: number;
  totalLinksAnalyzed: number;
  searchDuration: number;
  timestamp: string;
}