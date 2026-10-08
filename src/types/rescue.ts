import type { Coordinates, UserFields } from './user';
export type FloodLevel = 'no_flooding' | 'ankle_deep' | 'knee_deep' | 'waist_deep_or_higher';
export type RescueStatus = 'need_rescue' | 'rescued';
export type RescuePayload = { address: string; location: Coordinates; childrens?: number; elderly?: number; pwd?: number; adults?: number; flood_level?: FloodLevel; medical_assistance?: boolean };
export type Rescue = Required<RescuePayload> & { id: number; user: number; barangay: string; evidence: string | null; status: RescueStatus; rescuer: UserFields | null };
export type AssignmentResponse = { message: string; marker?: { id: number; status: RescueStatus; address: string; flood_level: FloodLevel; medical_assistance: boolean }; rescuer: UserFields & { contact_number?: string; vehicle_plate?: string; distance_meters?: number | null } };
export type CompletionResponse = { message: string; marker: { id: number; status: 'rescued' }; rescuer: Pick<UserFields, 'id' | 'username'> };
export type AvailableDriver = UserFields & { contact_number: string; vehicle_plate: string; is_available: boolean; location: { latitude: number; longitude: number } };
