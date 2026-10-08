import { api } from '@/src/api/api';
import type { Passenger, PassengerPayload, PassengerUpdatePayload } from '../types/user';

// Passenger is the backend name for Resident. IDs are Django User IDs.
export const passengerService = {
  getPassengers: async (search?: string) => {
    const response = await api.get<Passenger[]>('/passenger/', { params: { search } });
    return response.data;
  },

  register: async (data: PassengerPayload | FormData) => {
    const response = await api.post<Passenger>('/passenger/', data);
    return response.data;
  },

  getPassenger: async (id: number) => {
    const response = await api.get<Passenger>(`/passenger/${id}/`);
    return response.data;
  },

  updatePassenger: async (id: number, data: PassengerUpdatePayload | FormData) => {
    const response = await api.patch<Passenger>(`/passenger/${id}/`, data);
    return response.data;
  },

  deletePassenger: async (id: number) => {
    const response = await api.delete<void>(`/passenger/${id}/`);
    return response.data;
  },
};
