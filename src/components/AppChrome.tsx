import React, { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, appGradient } from './theme';
export { appGradient, softCard } from './theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function AppBackground() {
  return <LinearGradient pointerEvents="none" colors={appGradient} locations={[0, 0.58, 1]} style={StyleSheet.absoluteFill} />;
}

export function ChromeIcon({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#FFFFFF80' : 'transparent' })}>
    <Ionicons name={icon} size={23} color={colors.text} />
  </Pressable>;
}

export function HomeHeader({ onProfile, onUpdates, role }: { onProfile: () => void; onUpdates: () => void; role: 'Resident' | 'Volunteer' }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <ChromeIcon icon="person-outline" label="Open profile" onPress={onProfile} />
    <View style={{ alignItems: 'center', gap: 1 }}>
      <Text style={{ fontSize: 24, lineHeight: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.8 }}>Agap-AI</Text>
      <Text style={{ fontSize: 11, lineHeight: 15, color: colors.muted }}>{role} support</Text>
    </View>
    <ChromeIcon icon="notifications-outline" label="Open updates" onPress={onUpdates} />
  </View>;
}

export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <ChromeIcon icon="arrow-back" label="Back to home" onPress={onBack} />
    <Text accessibilityRole="header" style={{ flex: 1, color: colors.text, fontSize: 18, lineHeight: 25, fontWeight: '700' }}>{title}</Text>
    <View style={{ width: 48 }} />
  </View>;
}
