import { api } from '@/src/api/api';
import type { Driver, DriverPayload, DriverUpdatePayload, DriverApprovalResponse } from '../types/user';

// Driver is the backend name for Volunteer. IDs are Django User IDs.
export const driverService = {
  getDrivers: async (search?: string) => {
    const response = await api.get<Driver[]>('/driver/', { params: { search } });
    return response.data;
  },

  register: async (data: DriverPayload | FormData) => {
    const response = await api.post<Driver>('/driver/', data);
    return response.data;
  },

  getDriver: async (id: number) => {
    const response = await api.get<Driver>(`/driver/${id}/`);
    return response.data;
  },

  updateDriver: async (id: number, data: DriverUpdatePayload | FormData) => {
    const response = await api.patch<Driver>(`/driver/${id}/`, data);
    return response.data;
  },

  deleteDriver: async (id: number) => {
    const response = await api.delete<void>(`/driver/${id}/`);
    return response.data;
  },

  approveDriver: async (id: number) => {
    const response = await api.patch<DriverApprovalResponse>(`/drivers/${id}/approve/`);
    return response.data;
  },
};
