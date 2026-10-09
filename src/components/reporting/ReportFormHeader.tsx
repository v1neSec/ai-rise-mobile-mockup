import React from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, styles } from '../UI';
import { formTheme } from './ReportFormUI';

export function ReportFormHeader({ title, onBack, disabled = false }: { title: string; onBack: () => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" disabled={disabled}
        accessibilityState={{ disabled }} onPress={() => { Keyboard.dismiss(); onBack(); }}
        style={({ pressed }) => ({
          width: 48, height: 48, borderRadius: 12, borderWidth: 1,
          borderColor: formTheme.border, backgroundColor: pressed ? '#DCE9FF' : formTheme.soft,
          alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.45 : 1,
        })}>
        <Ionicons name="arrow-back" size={21} color={formTheme.accent} />
      </Pressable>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.section, { fontSize: 19, lineHeight: 25, fontWeight: '800' }]}>{title}</Text>
        <Text style={{ fontSize: 12, lineHeight: 18, color: colors.muted }}>Resident support</Text>
      </View>
    </View>
  );
}
