export type ReportStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE' | 'RESOLVED';
export type ReportPayload = { title: string; description?: string; category?: string; address?: string; barangay?: number | null; relevance?: 'RELEVANT' | 'IRRELEVANT'; severity?: 'LOW' | 'MODERATE' | 'SEVERE' | 'CRITICAL'; flood_level?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' };
export type CommunityReport = {
  id: number; user: number; username: string; barangay: number | null; barangay_name?: string;
  address: string; latitude: number | null; longitude: number | null;
  title: string; description: string; image: string | null; category: string;
  relevance: string; severity: string; flood_level: string; status: ReportStatus;
  duplicate_of: number | null; reviewed_by: number | null; reviewed_by_username?: string;
  reviewed_at: string | null; resolved_at: string | null; created_at: string; updated_at: string;
};
export type ModerationResponse = { message: string; id: number; status: ReportStatus; duplicate_of?: number };
