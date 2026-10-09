export type Coordinates = { lat: number; lng: number };
export type UserFields = { id: number; username: string; first_name: string; last_name: string };
export type PassengerProfile = {
  address: string; contact_number: string; profile_picture: string | null;
  emergency_contact_name: string; emergency_contact_number: string;
};
export type DriverProfile = {
  address: string; contact_number: string; location: Coordinates | null;
  profile_picture: string | null; vehicle_plate: string;
  vehicle_front_picture: string | null; vehicle_back_picture: string | null;
  is_available: boolean; status: 'PENDING' | 'ACTIVE';
};
export type Passenger = UserFields & { passenger_profile: PassengerProfile };
export type Driver = UserFields & { driver_profile: DriverProfile };
export type AccountPayload = { username: string; password: string; first_name?: string; last_name?: string };
export type PassengerPayload = AccountPayload & { passenger_profile: Omit<PassengerProfile, 'profile_picture'> };
export type DriverPayload = AccountPayload & { driver_profile: Pick<DriverProfile, 'address' | 'contact_number' | 'vehicle_plate'> & { location?: Coordinates | null } };
export type PassengerUpdatePayload = Partial<AccountPayload> & { passenger_profile?: Partial<PassengerPayload['passenger_profile']> };
export type DriverUpdatePayload = Partial<AccountPayload> & { driver_profile?: Partial<DriverPayload['driver_profile']> & { is_available?: boolean } };
export type DriverApprovalResponse = { message?: string; detail?: string; driver_id?: number; status: 'ACTIVE' };
