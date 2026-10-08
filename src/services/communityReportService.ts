import { api } from '@/src/api/api';
import type { CommunityReport, ReportPayload, ReportStatus, ModerationResponse } from '../types/report';

export const communityReportService = {
  getReports: async (status?: ReportStatus) => {
    const response = await api.get<CommunityReport[]>('/community/reports/', { params: { status } });
    return response.data;
  },

  createReport: async (data: ReportPayload | FormData) => {
    const response = await api.post<CommunityReport>('/community/reports/', data);
    return response.data;
  },

  getReport: async (id: number) => {
    const response = await api.get<CommunityReport>(`/community/reports/${id}/`);
    return response.data;
  },

  updateReport: async (id: number, data: Partial<ReportPayload> | FormData) => {
    const response = await api.patch<CommunityReport>(`/community/reports/${id}/`, data);
    return response.data;
  },

  deleteReport: async (id: number) => {
    const response = await api.delete<void>(`/community/reports/${id}/`);
    return response.data;
  },

  verifyReport: async (id: number) => {
    const response = await api.post<ModerationResponse>(`/community/reports/${id}/verify/`);
    return response.data;
  },

  rejectReport: async (id: number) => {
    const response = await api.post<ModerationResponse>(`/community/reports/${id}/reject/`);
    return response.data;
  },

  markDuplicate: async (id: number, originalId: number) => {
    const response = await api.post<ModerationResponse>(`/community/reports/${id}/mark-duplicate/`, { duplicate_of: originalId });
    return response.data;
  },

  resolveReport: async (id: number) => {
    const response = await api.post<ModerationResponse>(`/community/reports/${id}/resolve/`);
    return response.data;
  },
};
