export const SUPPLY_OPTIONS = [
  { key: 'needs_food', label: 'Food', icon: 'nutrition-outline' },
  { key: 'needs_water', label: 'Drinking water', icon: 'water-outline' },
  { key: 'needs_medicine', label: 'Medicine', icon: 'medkit-outline' },
  { key: 'needs_baby_supplies', label: 'Baby supplies', icon: 'happy-outline' },
  { key: 'needs_hygiene', label: 'Hygiene kits', icon: 'sparkles-outline' },
  { key: 'needs_clothing_blankets', label: 'Clothing / blankets', icon: 'shirt-outline' },
  { key: 'needs_power_light', label: 'Power / lighting', icon: 'flashlight-outline' },
] as const;

export type SupplyNeed = (typeof SUPPLY_OPTIONS)[number]['key'];
export type SupplyLocation = { latitude: number; longitude: number };
export type SupplyFloodLevel = 'no_flooding' | 'ankle_deep' | 'knee_deep' | 'waist_deep_or_higher';

// Local mock model based on the supplied example, not a confirmed API contract.
export type SupplyRequestDetails = Record<SupplyNeed, boolean> & {
  barangay: string;
  address: string;
  location: SupplyLocation;
  contact_number: string;
  evidence: string | null;
  childrens: number;
  elderly: number;
  pwd: number;
  adults: number;
  flood_level: SupplyFloodLevel;
  other_supplies: string;
  medical_assistance: boolean;
};

export type SupplyRequest = SupplyRequestDetails & {
  id: string;
  user: string | null;
  status: 'need_supplies';
  deliverer: null;
  created_at: string;
  delivered_at: null;
};
