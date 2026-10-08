import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../../session';
import { captureReportLocation } from '../../utils/reportLocation';
import { Action, colors, Field, Page, space, styles } from '../UI';
import { ReportFormHeader } from './ReportFormHeader';

const VULNERABLE = ['Children / Infants', 'Elderly', 'Persons with Disability', 'Pregnant'];

export function EmergencyAssistanceForm({ onBack, onViewStatus }: { onBack: () => void; onViewStatus: () => void }) {
  const { addSos } = useSession();
  const [people, setPeople] = useState('');
  const [vulnerable, setVulnerable] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function submit() {
    const count = Number(people.trim());
    if (!/^\d+$/.test(people.trim()) || !Number.isSafeInteger(count) || count < 1) {
      setError('Enter a whole number of people, at least 1.');
      return;
    }
    if (details.trim().length < 10) { setError('Describe the emergency in at least 10 characters.'); return; }
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError('');
    let location = 'Location unavailable';
    try { location = await captureReportLocation(); } catch {
      // Unavailable GPS must not block saving this local demo.
    }
    if (!mounted.current) return;
    addSos({ nature: 'Emergency assistance', peopleCount: count, details: [details.trim()], vulnerable, priority: 'High', location });
    setSaving(false);
    submitting.current = false;
    setPeople(''); setVulnerable([]); setDetails('');
    Alert.alert('Emergency request saved (demo)',
      `Saved locally for ${count} ${count === 1 ? 'person' : 'people'}. No responders have been contacted.${location === 'Location unavailable' ? ' Device location was unavailable.' : ''}`,
      [{ text: 'View status', onPress: onViewStatus }, { text: 'Done', onPress: onBack }]);
  }

  return (
    <Page edges={['top']} footer={
      <>
        {!!error && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{error}</Text>}
        <Action label={saving ? 'Getting location…' : 'Send Emergency Request'} color={colors.sos} disabled={saving} onPress={submit} />
      </>
    }>
      <ReportFormHeader title="Request Emergency Assistance" onBack={onBack} disabled={saving} />
      <View style={[styles.card, { backgroundColor: '#FFF7F7', borderColor: '#F1CDD0', gap: space.lg }]}>
        <Field label="Number of people who need help" value={people} editable={!saving}
          onChangeText={(value) => { setPeople(value); setError(''); }} placeholder="e.g. 5" keyboardType="number-pad" />
        <View style={{ gap: space.sm }}>
          <Text style={styles.label}>Vulnerable persons present</Text>
          {VULNERABLE.map((label) => {
            const checked = vulnerable.includes(label);
            return (
              <Pressable key={label} accessibilityRole="checkbox" accessibilityLabel={label}
                accessibilityState={{ checked, disabled: saving }} disabled={saving}
                onPress={() => { setVulnerable((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]); setError(''); }}
                style={({ pressed }) => ({
                  minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: checked ? colors.sos : colors.border,
                  backgroundColor: pressed ? colors.fill : colors.surface, paddingHorizontal: 12,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                })}>
                <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? colors.sos : colors.border} />
                <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Field label="Emergency details" value={details} editable={!saving}
          onChangeText={(value) => { setDetails(value); setError(''); }}
          placeholder="Describe your situation, floor level, road access, or medical needs…"
          multiline autoCapitalize="sentences" autoCorrect style={{ minHeight: 112, textAlignVertical: 'top' }} />
        <View style={[styles.note, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
          <Ionicons name="location-outline" size={18} color={colors.blue} />
          <Text style={[styles.small, { flex: 1 }]}>Your device location is captured when you submit, if permission is allowed.</Text>
        </View>
      </View>
      <Text style={styles.small}>Mockup only. Requests are saved on this device for this session.</Text>
    </Page>
  );
}
