export type PredictionModel = 'rf' | 'lstm';
export type Barangay = { id: number; name: string; color: string; elevation_m: number; area: { type: 'Polygon'; coordinates: number[][][] } | null };
export type FloodPrediction = { barangay: string; flood_probability_pct: number; predicted_flood_label: 'FLOOD' | 'No Flood'; predicted_tomorrow_rainfall_mm?: number; used_live_weather: boolean };
export type PredictionResponse = { model: PredictionModel; predictions: FloodPrediction[]; errors: { barangay: string; error: string }[] };
export type BarangayGeoJSON = { type: 'FeatureCollection'; features: { type: 'Feature'; geometry: NonNullable<Barangay['area']>; properties: Omit<Barangay, 'area'> }[] };
// Generated insight content varies; callers must check fields before rendering.
export type WeeklyFloodInsights = Record<string, unknown> & { cached: boolean; stale: boolean; stale_reason?: string };
export type RescuePriority = { id: number; priority_score: number; user: { id: number; username: string; first_name: string; last_name: string }; barangay: string; address: string; location: { latitude: number; longitude: number }; flood_level: string; people: { children: number; elderly: number; pwd: number; adults: number; total: number }; rescuer: { id: number; username: string } | null; status: 'need_rescue'; created_at: string };
