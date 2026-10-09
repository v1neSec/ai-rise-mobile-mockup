import React, { ComponentProps, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppBackground } from './AppChrome';
import { colors, space, softCard } from './theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/* ---------- Design tokens ---------- */
export { colors, space } from './theme';

/* ---------- Page: safe area, keyboard, scroll, optional pinned footer ---------- */
export function Page({
  children,
  edges,
  footer,
  bottomSpace = 0,
}: {
  children: React.ReactNode;
  edges?: Edge[];
  footer?: React.ReactNode;
  bottomSpace?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <AppBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scroll, { paddingBottom: 20 + insets.bottom + bottomSpace }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>

        {footer ? (
          <View style={[styles.footer, { paddingBottom: 12 + (edges?.includes('bottom') || !edges ? 0 : insets.bottom) }]}>
            <View style={styles.footerInner}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Buttons ---------- */
export function Action({
  label,
  onPress,
  color = colors.blue,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? '#FFFFFF' : color,
          borderColor: secondary ? colors.border : color,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: secondary ? colors.text : '#FFFFFF' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------- Text field ---------- */
export function Field({
  label,
  password = false,
  style,
  ...props
}: TextInputProps & { label: string; password?: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          placeholderTextColor="#7C8BA1"
          autoCapitalize={props.autoCapitalize ?? 'none'}
          autoCorrect={props.autoCorrect ?? false}
          secureTextEntry={password && !visible}
          style={[styles.input, style]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible(!visible)}
            style={styles.eye}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={21}
              color={colors.muted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ---------- Tappable row (used for photo, location, etc.) ---------- */
export function PickerRow({
  icon,
  title,
  subtitle,
  done = false,
  loading = false,
  onPress,
  color = colors.blue,
  leading,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  done?: boolean;
  loading?: boolean;
  onPress: () => void;
  color?: string;
  leading?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: done ? color : colors.border, backgroundColor: pressed ? colors.fill : '#FFFFFF' },
      ]}
    >
      {leading ?? (
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={22} color={done ? color : colors.text} />
        </View>
      )}
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.small} numberOfLines={2}>{subtitle}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Ionicons
          name={done ? 'checkmark-circle' : 'chevron-forward'}
          size={22}
          color={done ? color : colors.muted}
        />
      )}
    </Pressable>
  );
}

export function Upload({
  label,
  uri,
  onChange,
  color = colors.teal,
}: {
  label: string;
  uri: string;
  onChange: (uri: string) => void;
  color?: string;
}) {
  async function chooseImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to choose an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled) onChange(result.assets[0].uri);
    } catch {
      Alert.alert('Unable to open photos', 'Please try again.');
    }
  }

  return (
    <PickerRow
      icon="camera-outline"
      title={label}
      subtitle={uri ? 'Photo selected. Tap to change.' : 'Choose from your photos'}
      done={!!uri}
      color={color}
      onPress={chooseImage}
      leading={uri ? <Image source={{ uri }} style={styles.thumbnail} /> : undefined}
    />
  );
}

/* ---------- Equal-size selectable tiles ---------- */
export type Choice = { key: string; label?: string; desc?: string; icon?: IconName };

export function ChoiceGrid({
  options,
  selected,
  onSelect,
  tint = colors.blue,
  multi = false,
}: {
  options: Choice[];
  selected: string[];
  onSelect: (key: string) => void;
  tint?: string;
  multi?: boolean;
}) {
  const minHeight = options.some((o) => o.desc) ? 118 : 96;
  const rows: Choice[][] = [];
  for (let i = 0; i < options.length; i += 2) rows.push(options.slice(i, i + 2));

  return (
    <View style={{ gap: space.md }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: space.md }}>
          {row.map((o) => {
            const on = selected.includes(o.key);
            const wide = row.length === 1;
            const indicator = (
              <Ionicons
                name={
                  multi
                    ? on ? 'checkbox' : 'square-outline'
                    : on ? 'radio-button-on' : 'radio-button-off'
                }
                size={22}
                color={on ? tint : '#A9B5C6'}
              />
            );
            const icon = o.icon ? (
              <View
                style={[
                  styles.tileIcon,
                  { backgroundColor: on ? `${tint}1A` : colors.fill },
                ]}
              >
                <Ionicons name={o.icon} size={22} color={on ? tint : colors.text} />
              </View>
            ) : null;

            return (
              <Pressable
                key={o.key}
                accessibilityRole={multi ? 'checkbox' : 'radio'}
                accessibilityState={{ checked: on, selected: on }}
                accessibilityLabel={o.label ?? o.key}
                onPress={() => onSelect(o.key)}
                style={({ pressed }) => [
                  styles.tile,
                  {
                    minHeight,
                    borderColor: on ? tint : colors.border,
                    backgroundColor: on ? `${tint}0D` : pressed ? colors.fill : '#FFFFFF',
                    flexDirection: wide ? 'row' : 'column',
                    alignItems: wide ? 'center' : 'stretch',
                  },
                ]}
              >
                {wide ? (
                  <>
                    {icon}
                    <View style={styles.flex}>
                      <Text style={styles.tileTitle}>{o.label ?? o.key}</Text>
                      {!!o.desc && <Text style={styles.small}>{o.desc}</Text>}
                    </View>
                    {indicator}
                  </>
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      {icon ?? <View />}
                      {indicator}
                    </View>
                    <View style={{ gap: 2 }}>
                      <Text style={styles.tileTitle} numberOfLines={2}>{o.label ?? o.key}</Text>
                      {!!o.desc && (
                        <Text style={styles.small} numberOfLines={3}>{o.desc}</Text>
                      )}
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* ---------- Number stepper ---------- */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  color = colors.blue,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  color?: string;
}) {
  const button = (icon: IconName, delta: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${delta > 0 ? 'Increase' : 'Decrease'} ${label}`}
      disabled={disabled}
      onPress={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.fill : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );

  return (
    <View style={styles.row}>
      <Text style={[styles.rowTitle, styles.flex]}>{label}</Text>
      {button('remove', -1, value <= min)}
      <Text style={styles.stepValue} accessibilityLiveRegion="polite">{value}</Text>
      {button('add', 1, value >= max)}
    </View>
  );
}

/* ---------- Shared styles ---------- */
export const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xl },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: space.xl },
  footer: {
    backgroundColor: '#F5F8FA',
    borderTopWidth: 0,
    borderTopColor: colors.border,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  footerInner: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: space.sm },

  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.text },
  section: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.muted },

  card: {
    ...softCard,
    padding: space.lg,
    gap: space.md,
  },
  note: { padding: space.md, borderRadius: 12, backgroundColor: '#EAF0F8' },

  button: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },

  field: { gap: space.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  eye: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 72,
    padding: space.md,
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: colors.text },
  thumbnail: { width: 48, height: 48, borderRadius: 12 },
  stepValue: { minWidth: 40, textAlign: 'center', fontSize: 20, fontWeight: '700', color: colors.text },

  tile: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: space.md, gap: space.md },
  tileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: colors.text },

  // Kept for backward compatibility with older screens.
  upload: {},
  photoIcon: {},
  uploadTitle: {},
});
