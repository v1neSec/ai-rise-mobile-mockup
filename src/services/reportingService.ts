import { api } from '@/src/api/api';
import type { CommunityReport, ReportPayload } from '../types/report';
import type { Rescue, RescuePayload } from '../types/rescue';

// Prepared for later integration. These methods accept the current backend contract,
// not the mock form's unsupported fields (pregnancy, headcount, or rescue details).
export const reportingService = {
  submitCommunityIssue: async (data: ReportPayload | FormData) => {
    const response = await api.post<CommunityReport>('/community/reports/', data);
    return response.data;
  },

  requestEmergencyAssistance: async (data: RescuePayload | FormData) => {
    const response = await api.post<Rescue>('/rescue/markers/', data);
    return response.data;
  },
};
