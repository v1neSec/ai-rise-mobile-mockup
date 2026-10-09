import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Polygon, type LatLng, type Region } from 'react-native-maps';
import { dashboardService } from '../../services/dashboardService';
import type { BarangayGeoJSON } from '../../types/dashboard';
import type { Coordinates } from '../../types/user';
import { colors, styles } from '../UI';
import { FormAction, formCard } from './ReportFormUI';

const APALIT: Region = { latitude: 14.953, longitude: 120.769, latitudeDelta: 0.07, longitudeDelta: 0.07 };
export type MockPin = { label: string; barangay: string; barangayId: number | null; address: string; latitude: number; longitude: number };
type Props = { value: MockPin | null; onChange: (pin: MockPin) => void };

function toCoordinates(ring: number[][]): LatLng[] {
  return ring.map(([longitude, latitude]) => ({ latitude, longitude }));
}
function containsPoint(point: Coordinates, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    if (yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi) inside = !inside;
  }
  return inside;
}
async function addressAt(point: Coordinates, barangay: string) {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: point.lat, longitude: point.lng });
    const parts = [place?.name, place?.street, place?.district, place?.city].filter(Boolean);
    return parts.length ? [...new Set(parts)].join(', ') : `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}${barangay ? ` · ${barangay}` : ''}`;
  } catch { return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}${barangay ? ` · ${barangay}` : ''}`; }
}
export function MockLocationPin({ value, onChange }: Props) {
  const mapRef = React.useRef<MapView>(null);
  const [geojson, setGeojson] = useState<BarangayGeoJSON | null>(null);
  const [region, setRegion] = useState<Region>(value ? { ...APALIT, latitude: value.latitude, longitude: value.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 } : APALIT);
  const [point, setPoint] = useState<Coordinates | null>(value ? { lat: value.latitude, lng: value.longitude } : null);
  const [address, setAddress] = useState(value?.address ?? '');
  const [barangay, setBarangay] = useState(value?.barangay ?? '');
  const [barangayId, setBarangayId] = useState<number | null>(value?.barangayId ?? null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    dashboardService.getBarangayGeoJSON().then((data) => { if (alive) setGeojson(data); })
      .catch(() => { if (alive) setError('Barangay boundaries are unavailable. You can still pin your location on the map.'); });
    return () => { alive = false; };
  }, []);
  const polygons = useMemo(() => geojson?.features.flatMap((feature) => {
    const rings = feature.geometry.coordinates;
    if (!rings?.[0]?.length) return [];
    return [{ id: feature.properties.id, name: feature.properties.name, color: feature.properties.color, coordinates: toCoordinates(rings[0]), ring: rings[0] }];
  }) ?? [], [geojson]);
  async function setPin(next: Coordinates) {
    setPoint(next);
    const feature = polygons.find((item) => containsPoint(next, item.ring));
    const name = feature?.name ?? '';
    setBarangay(name); setBarangayId(feature?.id ?? null); setLoading(true); setError('');
    setAddress(await addressAt(next, name)); setLoading(false);
  }
  async function locateCurrentPosition() {
    setLocating(true); setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Allow location access to pin your current location.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      const nextRegion = { ...APALIT, latitude: next.lat, longitude: next.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 };
      setRegion(nextRegion); mapRef.current?.animateToRegion(nextRegion, 450);
      await setPin(next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not get your current location.'); }
    finally { setLocating(false); }
  }
  function confirm() {
    if (!point) { setError('Tap the map or use your current location to place a pin.'); return; }
    if (!barangayId) { setError('Choose a point inside an Apalit barangay boundary.'); return; }
    onChange({ label: barangay, barangay, barangayId, address, latitude: point.lat, longitude: point.lng });
  }
  return <View style={formCard}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="location-outline" size={20} color={colors.blue} /><Text style={[styles.section, { flex: 1 }]}>Pin location</Text><Text style={{ color: colors.blue, fontSize: 11, fontWeight: '700' }}>APALIT</Text></View>
    <View style={{ height: 224, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E8F0F7' }}>
      <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={region} onPress={(event) => { const { latitude, longitude } = event.nativeEvent.coordinate; void setPin({ lat: latitude, lng: longitude }); }} onRegionChangeComplete={setRegion} showsUserLocation showsMyLocationButton={false} toolbarEnabled={false}>
        {polygons.map((shape) => <Polygon key={shape.id} coordinates={shape.coordinates} strokeColor={shape.color || colors.blue} fillColor={`${shape.color || colors.blue}22`} strokeWidth={2} />)}
        {point && <Marker coordinate={{ latitude: point.lat, longitude: point.lng }} title={barangay || 'Selected location'} description={address || 'Confirm this pin'} />}
      </MapView>
      <Pressable accessibilityRole="button" accessibilityLabel="Use my current location" onPress={() => void locateCurrentPosition()} style={{ position: 'absolute', right: 10, top: 10, backgroundColor: '#FFFFFF', borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
        {locating ? <ActivityIndicator color={colors.blue} /> : <Ionicons name="locate-outline" size={22} color={colors.blue} />}
      </Pressable>
      {!geojson && <View pointerEvents="none" style={{ position: 'absolute', left: 12, bottom: 12, backgroundColor: '#FFFFFFE8', padding: 8, borderRadius: 10 }}><Text style={styles.small}>Loading barangay boundaries…</Text></View>}
    </View>
    <Text style={styles.subtitle}>{loading ? 'Finding address…' : address || 'Tap inside an Apalit barangay or use your current location.'}</Text>
    {!!barangay && <Text style={styles.small}>{barangay} · {point?.lat.toFixed(5)}, {point?.lng.toFixed(5)}</Text>}
    {!!error && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}
    <FormAction label={value && value.latitude === point?.lat && value.longitude === point?.lng ? 'Location pinned ✓' : 'Confirm this location'} secondary onPress={confirm} />
    <Text style={styles.small}>{value ? `Pinned: ${value.address}` : 'The pin must be inside an Apalit barangay.'}</Text>
  </View>;
}
