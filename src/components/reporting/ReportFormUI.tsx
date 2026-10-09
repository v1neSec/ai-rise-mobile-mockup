import React, { ComponentProps, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Action, ChoiceGrid, colors, Page, PickerRow, Stepper, styles, Upload } from '../UI';
import { softCard } from '../AppChrome';

export const formTheme = {
  accent: colors.blue,
  soft: '#EDF3FF',
  border: '#D8E4F5',
  muted: colors.muted,
};

export const formCard = {
  ...softCard,
  padding: 18,
  gap: 16,
} as const;

export function FormPage({ pageKey, ...props }: ComponentProps<typeof Page> & { pageKey?: number }) {
  // A new step starts at the top; draft values belong to the parent form.
  return <Page key={pageKey} {...props} />;
}

export function FormProgress({ step, total, title, hint }: { step: number; total: number; title: string; hint: string }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 10 }} accessible accessibilityLabel="Form progress" accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: total, now: step + 1, text: `Step ${step + 1} of ${total}` }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ backgroundColor: formTheme.soft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: formTheme.accent }}>Step {step + 1} of {total}</Text>
          </View>
          <Text style={styles.small}>{step === total - 1 ? 'Review & confirm' : 'Your details'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {Array.from({ length: total }, (_, index) => (
            <View key={index} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: index <= step ? formTheme.accent : formTheme.border }} />
          ))}
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <Text style={[styles.title, { fontSize: 24, lineHeight: 30 }]}>{title}</Text>
        <Text style={[styles.subtitle, { fontSize: 14, lineHeight: 21 }]}>{hint}</Text>
      </View>
    </View>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View accessibilityLiveRegion="polite" style={{ padding: 12, borderRadius: 12, backgroundColor: '#FFF0F0', flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
      <Text style={{ flex: 1, color: colors.danger, fontSize: 13, lineHeight: 19 }}>{message}</Text>
    </View>
  );
}

export function FormAction({ label, onPress, secondary = false, disabled = false, busy = false }: ComponentProps<typeof Action> & { busy?: boolean }) {
  const blocked = disabled || busy;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: blocked, busy }} disabled={blocked}
      onPress={() => { Keyboard.dismiss(); onPress(); }}
      style={({ pressed }) => ({
        minHeight: 54, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16,
        borderWidth: 1, borderColor: blocked ? formTheme.border : secondary ? formTheme.border : formTheme.accent,
        backgroundColor: blocked ? '#E5ECF7' : secondary ? formTheme.soft : formTheme.accent,
        opacity: pressed ? 0.82 : 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      })}>
      {busy && <ActivityIndicator size="small" color={formTheme.accent} />}
      <Text style={{ fontSize: 15, lineHeight: 21, fontWeight: '700', textAlign: 'center', color: blocked ? '#637B9E' : secondary ? formTheme.accent : colors.surface }}>{label}</Text>
      {!busy && !blocked && !secondary && <Ionicons name="arrow-forward" size={18} color={colors.surface} />}
    </Pressable>
  );
}

export function FormField({ label, helperText, style, onFocus, onBlur, ...props }: TextInputProps & { label: string; helperText?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '600' }}>{label}</Text>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor="#7C8CA3" underlineColorAndroid="transparent" selectionColor={formTheme.accent}
        autoCapitalize={props.autoCapitalize ?? 'none'} autoCorrect={props.autoCorrect ?? false}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        style={[{
          minHeight: 54, borderWidth: 1.5, borderRadius: 14,
          borderColor: focused ? formTheme.accent : formTheme.border,
          backgroundColor: focused ? '#F8FAFF' : colors.surface,
          paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, lineHeight: 22,
          color: colors.text, opacity: props.editable === false ? 0.65 : 1,
        }, style]} />
      {!!helperText && <Text style={styles.small}>{helperText}</Text>}
    </View>
  );
}

export function FormChoiceGrid({ options, selected, onSelect, multi = false }: ComponentProps<typeof ChoiceGrid>) {
  const rows = Array.from({ length: Math.ceil(options.length / 2) }, (_, index) => options.slice(index * 2, index * 2 + 2));
  return (
    <View style={{ gap: 10 }}>
      {rows.map((row, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((option) => {
            const checked = selected.includes(option.key);
            return (
              <Pressable key={option.key} accessibilityRole={multi ? 'checkbox' : 'radio'}
                accessibilityLabel={option.label ?? option.key} accessibilityState={{ checked, selected: checked }}
                onPress={() => onSelect(option.key)}
                style={({ pressed }) => ({
                  flex: 1, minHeight: 104, padding: 12, borderRadius: 18, borderWidth: 1.5,
                  borderColor: checked ? formTheme.accent : 'transparent',
                  backgroundColor: checked ? formTheme.soft : pressed ? '#F6F9FE' : colors.surface,
                  gap: 10, opacity: pressed ? 0.85 : 1,
                })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: checked ? '#DCE9FF' : '#EAF1F5', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={option.icon ?? 'ellipse-outline'} size={22} color={checked ? formTheme.accent : colors.text} />
                  </View>
                  <Ionicons name={multi ? checked ? 'checkbox' : 'square-outline' : checked ? 'radio-button-on' : 'radio-button-off'} size={20} color={checked ? formTheme.accent : '#A5B5CB'} />
                </View>
                <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: '700', color: checked ? formTheme.accent : colors.text }}>{option.label ?? option.key}</Text>
                {!!option.desc && <Text style={styles.small}>{option.desc}</Text>}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function FormPickerRow(props: ComponentProps<typeof PickerRow>) { return <PickerRow {...props} color={formTheme.accent} />; }
export function FormUpload(props: ComponentProps<typeof Upload>) { return <Upload {...props} color={formTheme.accent} />; }
export function FormStepper(props: ComponentProps<typeof Stepper>) { return <Stepper {...props} color={formTheme.accent} />; }
