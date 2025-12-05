export interface PartnerSearchSource {
  id: string;
  name: string;
  url: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  lastUsed?: string;
}

export interface ProjectOpportunity {
  id: string;
  sourceId: string;
  sourceName: string;
  url: string;
  title: string;
  description: string;
  matchScore: number;
  matchReasoning: string;
  deadline: string;
  roleDescription: string;
  coordinator: string;
  countries: string[];
}