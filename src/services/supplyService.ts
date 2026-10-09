import { api } from '@/src/api/api';
import type { SupplyNeed, SupplyRequestDetails, SupplyFloodLevel } from '../types/supply';
import type { Coordinates } from '../types/user';

export type BackendSupply = Record<SupplyNeed, boolean> & {
  id: number; user: number; barangay: string; address: string;
  location: Coordinates; contact_number: string; evidence: string | null;
  status: 'need_supplies' | 'delivered' | 'cancelled'; childrens: number; elderly: number;
  pwd: number; adults: number; flood_level: SupplyFloodLevel; other_supplies: string;
  medical_assistance: boolean; deliverer: { id: number; username: string } | null;
  created_at: string; delivered_at: string | null;
};

export type SupplyPayload = Omit<SupplyRequestDetails, 'location' | 'evidence' | 'barangay'> & {
  location: Coordinates; evidence?: string | null;
};

export const supplyService = {
  getRequests: async () => (await api.get<BackendSupply[]>('/supply/supply-requests/')).data,
  getRequest: async (id: number) => (await api.get<BackendSupply>(`/supply/supply-requests/${id}/`)).data,
  createRequest: async (data: SupplyPayload | FormData) => (await api.post<BackendSupply>('/supply/supply-requests/', data)).data,
  updateRequest: async (id: number, data: Partial<SupplyPayload> | FormData) => (await api.patch<BackendSupply>(`/supply/supply-requests/${id}/`, data)).data,
  assignDeliverer: async (id: number, driverId: number) => (await api.post(`/supply/supply-requests/${id}/assign-deliverer/`, { driver_id: driverId })).data,
  completeDelivery: async (id: number) => (await api.post(`/supply/supply-requests/${id}/complete-delivery/`)).data,
  cancelRequest: async (id: number) => (await api.post(`/supply/supply-requests/${id}/cancel/`)).data,
  getMyRequests: async () => (await api.get<BackendSupply[]>('/supply/my-supply-requests/')).data,
  getAssignedDeliveries: async () => (await api.get<BackendSupply[]>('/supply/assigned-deliveries/')).data,
};
