import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, styles } from '../UI';

export function ReportFormHeader({ title, onBack, disabled = false }: { title: string; onBack: () => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" disabled={disabled}
        accessibilityState={{ disabled }} onPress={onBack}
        style={({ pressed }) => ({
          width: 48, height: 48, borderRadius: 12, borderWidth: 1,
          borderColor: colors.border, backgroundColor: pressed ? colors.fill : colors.surface,
          alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.45 : 1,
        })}>
        <Ionicons name="arrow-back" size={21} color={colors.text} />
      </Pressable>
      <Text style={[styles.section, { flex: 1, fontSize: 20, lineHeight: 26 }]}>{title}</Text>
    </View>
  );
}
