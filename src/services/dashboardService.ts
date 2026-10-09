import { api } from '@/src/api/api';
import type { Barangay, BarangayGeoJSON, FloodPrediction, PredictionModel, PredictionResponse, RescuePriority, WeeklyFloodInsights } from '../types/dashboard';
import type { Coordinates } from '../types/user';

export const dashboardService = {
  getBarangays: async () => {
    const response = await api.get<Barangay[]>('/dashboard/barangays/');
    return response.data;
  },

  getBarangayGeoJSON: async () => {
    const response = await api.get<BarangayGeoJSON>('/dashboard/barangays/geojson/');
    return response.data;
  },

  getFloodPrediction: async (barangay: string, model: PredictionModel = 'rf') => {
    const response = await api.get<FloodPrediction>(`/dashboard/predict/${encodeURIComponent(barangay)}/`, { params: { model } });
    return response.data;
  },

  getAllFloodPredictions: async (model: PredictionModel = 'rf') => {
    const response = await api.get<PredictionResponse>('/dashboard/predict/', { params: { model } });
    return response.data;
  },

  getFloodPredictionByLocation: async (location: Coordinates, model: PredictionModel = 'rf') => {
    const response = await api.get<FloodPrediction>('/dashboard/predict/by-location/', { params: { lat: location.lat, lng: location.lng, model } });
    return response.data;
  },

  getRescuePriority: async () => {
    const response = await api.get<RescuePriority[]>('/dashboard/admin/rescue-priority/');
    return response.data;
  },

  getWeeklyFloodInsights: async () => {
    const response = await api.get<WeeklyFloodInsights>('/dashboard/weekly-flood-insights/');
    return response.data;
  },
};
