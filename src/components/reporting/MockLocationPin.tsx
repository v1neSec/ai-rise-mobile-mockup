import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, styles } from '../UI';
import { FormAction, formCard, formTheme } from './ReportFormUI';

export const MOCK_PINS = [
  { label: 'San Vicente', barangay: 'Barangay San Vicente', address: 'Near San Vicente barangay hall, Apalit', latitude: 14.9533, longitude: 120.7696 },
  { label: 'San Juan', barangay: 'Barangay San Juan', address: 'Near San Juan covered court, Apalit', latitude: 14.9478, longitude: 120.7589 },
] as const;
export type MockPin = (typeof MOCK_PINS)[number];

export function MockLocationPin({ value, onChange }: { value: MockPin | null; onChange: (pin: MockPin) => void }) {
  const [preview, setPreview] = useState<MockPin>(value ?? MOCK_PINS[0]);
  return (
    <View style={formCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="location-outline" size={20} color={colors.blue} />
        <Text style={[styles.section, { flex: 1 }]}>Pin location</Text>
        <Text style={{ color: colors.blue, fontSize: 11, fontWeight: '700' }}>APALIT</Text>
      </View>
      <View accessibilityLabel={`Location: ${preview.address}`} style={{ height: 164, borderRadius: 16, backgroundColor: '#EDF3F8', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: '150%', height: 18, backgroundColor: '#FFFFFF', transform: [{ rotate: '-24deg' }] }} />
        <View style={{ position: 'absolute', width: 18, height: '160%', backgroundColor: '#FFFFFF', transform: [{ rotate: '18deg' }] }} />
        <View style={{ position: 'absolute', right: 12, top: 14, width: 56, height: 38, borderRadius: 12, backgroundColor: '#DCE9E8' }} />
        <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#2264DF15', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="location" size={42} color={colors.blue} />
        </View>
        <View style={{ position: 'absolute', bottom: 10, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{preview.label} · Apalit</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {MOCK_PINS.map((pin) => <Pressable key={pin.label} accessibilityRole="radio" accessibilityLabel={`Select ${pin.label} location`} accessibilityState={{ checked: preview.label === pin.label }} onPress={() => setPreview(pin)}
          style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: preview.label === pin.label ? colors.blue : formTheme.border, backgroundColor: preview.label === pin.label ? formTheme.soft : colors.surface }}>
          <Text style={{ color: preview.label === pin.label ? colors.blue : colors.muted, textAlign: 'center', fontSize: 13, fontWeight: '600' }}>{pin.label}</Text>
        </Pressable>)}
      </View>
      <FormAction label={value?.label === preview.label ? 'Location pinned ✓' : 'Confirm this location'} secondary onPress={() => onChange(preview)} />
      {value && <Text accessibilityLiveRegion="polite" style={styles.small}>Pinned: {value.address}</Text>}
      <Text style={styles.small}>Choose a location and confirm the pin to continue.</Text>
    </View>
  );
}
