import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SosRequest, useSession } from '../../session';
import { MockLocationPin, MockPin } from './MockLocationPin';
import { ReportSuccess } from './ReportSuccess';
import { colors, space, styles } from '../UI';
import { FormAction as Action, FormField as Field, FormPage as Page, FormError, FormProgress, formCard, formTheme } from './ReportFormUI';
import { ReportFormHeader } from './ReportFormHeader';
import { FadeIn } from '../Motion';

const VULNERABLE = ['Children / Infants', 'Elderly', 'Persons with Disability', 'Pregnant'];
const STEPS = [
  { title: 'Who needs help?', hint: 'Add the number of people and anyone who needs extra care.' },
  { title: 'What is happening?', hint: 'Describe the emergency so the situation is clear.' },
  { title: 'Review your request', hint: 'Check your answers before saving your request.' },
];

export function EmergencyAssistanceForm({ onBack, onViewStatus }: { onBack: () => void; onViewStatus: () => void }) {
  const { addSos } = useSession();
  const [step, setStep] = useState(0);
  const [people, setPeople] = useState('');
  const [vulnerable, setVulnerable] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState<SosRequest | null>(null);
  const [pin, setPin] = useState<MockPin | null>(null);
  const saving = !!sent;
  const [error, setError] = useState('');
  const submitting = useRef(false);

  function validate(index: number): string {
    const count = Number(people.trim());
    if (index !== 1 && (!/^\d+$/.test(people.trim()) || !Number.isSafeInteger(count) || count < 1)) {
      return 'Enter a whole number of people, at least 1.';
    }
    if (index !== 0 && details.trim().length < 10) return 'Describe the emergency in at least 10 characters.';
    if (index === 2 && !pin) return 'Choose and confirm your location pin.';
    return '';
  }

  function next() {
    const message = validate(step);
    if (message) { setError(message); return; }
    setError(''); setStep(step + 1);
  }

  function submit() {
    const message = validate(2);
    if (message) { setError(message); return; }
    if (submitting.current || !pin) return;
    submitting.current = true;
    setError('');
    setSent(addSos({ nature: 'Emergency assistance', peopleCount: Number(people.trim()), details: [details.trim()], vulnerable, priority: 'High', location: pin.address }));
  }

  if (sent) return <ReportSuccess title="Help request sent" reference={sent.id} summary={`${people.trim()} people · ${sent.location}`} onBack={onBack} onViewStatus={onViewStatus} />;

  return (
    <Page pageKey={step} edges={['top']} footer={
      <>
        <FormError message={error} />
        <Action label={step === 2 ? 'Send Emergency Request' : 'Continue'} busy={saving}
          onPress={() => { if (step < 2) next(); else void submit(); }} />
      </>
    }>
      <ReportFormHeader title="Request Help" disabled={saving}
        onBack={() => { if (step > 0) { setStep(step - 1); setError(''); } else onBack(); }} />
      <FormProgress step={step} total={STEPS.length} title={STEPS[step].title} hint={STEPS[step].hint} />
      <FadeIn key={step} style={{ gap: space.xl }}>
      {step === 0 && <View style={formCard}>
        <Field label="Number of people who need help" value={people} editable={!saving}
          helperText="Include everyone who needs assistance."
          onChangeText={(value) => { setPeople(value); setError(''); }} placeholder="e.g. 5" keyboardType="number-pad" />
        <View style={{ gap: space.sm }}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>Who needs extra care? (optional)</Text>
          {VULNERABLE.map((label) => {
            const checked = vulnerable.includes(label);
            return (
              <Pressable key={label} accessibilityRole="checkbox" accessibilityLabel={label}
                accessibilityState={{ checked, disabled: saving }} disabled={saving}
                onPress={() => { setVulnerable((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]); setError(''); }}
                style={({ pressed }) => ({
                  minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: checked ? formTheme.accent : formTheme.border,
                  backgroundColor: checked ? formTheme.soft : pressed ? colors.fill : colors.surface, paddingHorizontal: 12,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                })}>
                <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? formTheme.accent : '#A5B5CB'} />
                <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>}
      {step === 1 && <View style={formCard}>
        <Field label="Emergency details" value={details} editable={!saving} helperText="At least 10 characters. Include floor level, road access, or medical needs."
          onChangeText={(value) => { setDetails(value); setError(''); }}
          placeholder="Describe your situation, floor level, road access, or medical needs…"
          multiline autoCapitalize="sentences" autoCorrect style={{ minHeight: 112, textAlignVertical: 'top' }} />
      </View>}
      {step === 2 && <>
        <View style={formCard}>
          <Text style={styles.label}>People who need help</Text>
          <Text style={styles.section}>{people.trim()} {Number(people) === 1 ? 'person' : 'people'}</Text>
          <Text style={styles.label}>Extra care</Text>
          <Text style={styles.subtitle}>{vulnerable.length ? vulnerable.join(' · ') : 'No groups selected'}</Text>
          <Text style={styles.label}>Emergency details</Text>
          <Text style={styles.subtitle}>{details.trim()}</Text>
        </View>
        <MockLocationPin value={pin} onChange={(value) => { setPin(value); setError(''); }} />

      </>}
      </FadeIn>
    </Page>
  );
}
