import { api } from '@/src/api/api';
import type { Rescue, RescuePayload, AssignmentResponse, CompletionResponse, AvailableDriver } from '../types/rescue';

export const rescueService = {
  getRescues: async () => {
    const response = await api.get<Rescue[]>('/rescue/markers/');
    return response.data;
  },

  createRescue: async (data: RescuePayload | FormData) => {
    const response = await api.post<Rescue>('/rescue/markers/', data);
    console.log('createRescue response:', response.data);
    return response.data;
  },

  getRescue: async (id: number) => {
    const response = await api.get<Rescue>(`/rescue/markers/${id}/`);
    return response.data;
  },

  updateRescue: async (id: number, data: Partial<RescuePayload> | FormData) => {
    const response = await api.patch<Rescue>(`/rescue/markers/${id}/`, data);
    return response.data;
  },

  deleteRescue: async (id: number) => {
    const response = await api.delete<void>(`/rescue/markers/${id}/`);
    return response.data;
  },

  getMyRescues: async () => {
    const response = await api.get<Rescue[]>('/rescue/my-rescues/');
    return response.data;
  },

  getAssignedRescues: async () => {
    const response = await api.get<Rescue[]>('/rescue/assigned-rescues/');
    return response.data;
  },

  assignRescuer: async (id: number, driverId: number) => {
    const response = await api.post<AssignmentResponse>(`/rescue/markers/${id}/assign-rescuer/`, { driver_id: driverId });
    return response.data;
  },

  completeRescue: async (id: number) => {
    const response = await api.post<CompletionResponse>(`/rescue/markers/${id}/complete/`);
    return response.data;
  },

  getAvailableDrivers: async () => {
    const response = await api.get<AvailableDriver[]>('/rescue/available-drivers/');
    return response.data;
  },
};
