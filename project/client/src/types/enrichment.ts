// client/src/types/enrichment.ts
export type EnrichmentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface EnrichmentJob {
  id: number;
  productIds: number[];
  status: EnrichmentStatus;
  progress: number;
  result?: {
    enrichedCount?: number;
    failedCount?: number;
    error?: string;
  };
  createdAt: string;
  updatedAt: string;
}