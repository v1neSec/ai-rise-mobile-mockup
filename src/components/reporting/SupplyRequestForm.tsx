import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSession } from '../../session';
import { SUPPLY_OPTIONS, SupplyFloodLevel, SupplyNeed, SupplyRequest } from '../../types/supply';
import { MockLocationPin, MockPin } from './MockLocationPin';
import { ReportSuccess } from './ReportSuccess';
import { Choice, colors, space, styles } from '../UI';
import { FormAction as Action, FormChoiceGrid as ChoiceGrid, FormField as Field, FormPage as Page, FormStepper as Stepper, FormUpload as Upload, FormProgress, FormError, formCard, formTheme } from './ReportFormUI';
import { FadeIn } from '../Motion';
import { ReportFormHeader } from './ReportFormHeader';

const NEEDS: Choice[] = [...SUPPLY_OPTIONS, { key: 'other', label: 'Other supplies', icon: 'ellipsis-horizontal-circle-outline' }];
const GROUPS = [
  { key: 'childrens', label: 'Children / infants' },
  { key: 'elderly', label: 'Elderly' },
  { key: 'pwd', label: 'Persons with disability' },
  { key: 'adults', label: 'Adults' },
] as const;
const FLOOD: Choice[] = [
  { key: 'no_flooding', label: 'No flooding', icon: 'footsteps-outline' },
  { key: 'ankle_deep', label: 'Ankle-deep', icon: 'water-outline' },
  { key: 'knee_deep', label: 'Knee-deep', icon: 'water-outline' },
  { key: 'waist_deep_or_higher', label: 'Waist-deep or higher', icon: 'water' },
];
const STEPS = [
  { title: 'What supplies do you need?', hint: 'Select all that apply to your household.' },
  { title: 'Who are the supplies for?', hint: 'Count each person once, in the group that best fits.' },
  { title: 'What is your situation?', hint: 'Tell us about the water level and medical needs.' },
  { title: 'Where should supplies go?', hint: 'Confirm your delivery pin and add your contact number.' },
  { title: 'Add supporting evidence', hint: 'Check your delivery pin and attach an optional photo.' },
  { title: 'Review your request', hint: 'Check your details before saving the request.' },
];

export function SupplyRequestForm({ onBack, onViewStatus }: { onBack: () => void; onViewStatus: () => void }) {
  const { addSupplyRequest } = useSession();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [counts, setCounts] = useState({ childrens: 0, elderly: 0, pwd: 0, adults: 0 });
  const [flood, setFlood] = useState<SupplyFloodLevel | ''>('');
  const [medical, setMedical] = useState<boolean | null>(null);
  const [pin, setPin] = useState<MockPin | null>(null);
  const barangay = pin?.barangay ?? '';
  const address = pin?.address ?? '';
  const latitude = pin?.latitude;
  const longitude = pin?.longitude;
  const [phone, setPhone] = useState('');
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState<SupplyRequest | null>(null);
  const submitted = useRef(false);
  const total = counts.childrens + counts.elderly + counts.pwd + counts.adults;
  const normalizedPhone = phone.replace(/[\s()-]/g, '');


  function validate(index: number): string {
    if (index === 0) {
      if (!selected.length) return 'Choose at least one supply type.';
      if (selected.includes('other') && !other.trim()) return 'Describe the other supplies you need.';
    }
    if (index === 1 && total < 1) return 'Add at least one person to your household.';
    if (index === 2 && (!flood || medical === null)) return 'Choose the flood level and whether medical assistance is needed.';
    if (index === 3) {
      if (!pin) return 'Choose and confirm your delivery pin.';
      if (!/^(09\d{9}|\+639\d{9}|639\d{9})$/.test(normalizedPhone)) return 'Enter a mobile number such as 09171234567 or +639171234567.';
    }
    if (index === 4 && !pin) return 'Choose and confirm your delivery pin.';
    return '';
  }

  function next() {
    const message = step === STEPS.length - 1
      ? STEPS.map((_, index) => validate(index)).find(Boolean) || '' : validate(step);
    if (message) { setError(message); return; }
    setError('');
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    if (submitted.current || !flood || medical === null || !pin) return;
    submitted.current = true;
    const flags = Object.fromEntries(SUPPLY_OPTIONS.map((option) => [option.key, selected.includes(option.key)])) as Record<SupplyNeed, boolean>;
    setSent(addSupplyRequest({
      ...flags, ...counts,
      barangay: barangay.trim(), address: address.trim(), contact_number: normalizedPhone,
      location: { latitude: pin.latitude, longitude: pin.longitude },
      evidence: evidence || null, flood_level: flood,
      other_supplies: other.trim(), medical_assistance: medical,
    }));
  }

  if (sent) return <ReportSuccess title="Supply request sent" reference={sent.id} summary={`${total} people · ${sent.barangay}`} onBack={onBack} onViewStatus={onViewStatus} />;

  const supplyLabels = SUPPLY_OPTIONS.filter((option) => selected.includes(option.key)).map((option) => option.label);
  return (
    <Page pageKey={step} edges={['top']} footer={<>
      <FormError message={error} />
      <Action label={step === STEPS.length - 1 ? 'Request Supplies' : 'Continue'} onPress={next} />
    </>}>
      <ReportFormHeader title="Request Supplies"
        onBack={() => { if (step > 0) { setStep(step - 1); setError(''); } else onBack(); }} />
      <FormProgress step={step} total={STEPS.length} title={STEPS[step].title} hint={STEPS[step].hint} />
      <FadeIn key={step} style={{ gap: space.xl }}>
        {step === 0 && <>
          <ChoiceGrid options={NEEDS} selected={selected} multi tint={colors.blue}
            onSelect={(key) => { setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]); setError(''); }} />
          <Field label={selected.includes('other') ? 'What other supplies do you need?' : 'Specific items / other supplies (optional)'} value={other}
            onChangeText={(value) => { setOther(value); setError(''); }} placeholder="e.g. maintenance medicine, diapers size M"
            multiline autoCapitalize="sentences" style={{ minHeight: 88, textAlignVertical: 'top' }} />
        </>}
        {step === 1 && <>
          <View style={[styles.note, { backgroundColor: formTheme.soft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text style={{ color: colors.blue, fontWeight: '700' }}>People in your household</Text>
            <Text accessibilityLiveRegion="polite" style={{ color: colors.blue, fontSize: 26, fontWeight: '800' }}>{total}</Text>
          </View>
          <View style={{ gap: space.md }}>
            {GROUPS.map((group) => <Stepper key={group.key} label={group.label} value={counts[group.key]} max={999} color={colors.blue}
              onChange={(value) => { setCounts((current) => ({ ...current, [group.key]: value })); setError(''); }} />)}
          </View>
        </>}
        {step === 2 && <>
          <Text style={styles.section}>Flood level at your location</Text>
          <ChoiceGrid options={FLOOD} selected={flood ? [flood] : []} tint={colors.blue}
            onSelect={(key) => { setFlood(key as SupplyFloodLevel); setError(''); }} />
          <Text style={styles.section}>Is medical assistance needed?</Text>
          <ChoiceGrid options={[{ key: 'yes', label: 'Yes', icon: 'medkit-outline' }, { key: 'no', label: 'No', icon: 'checkmark-circle-outline' }]}
            selected={medical === null ? [] : [medical ? 'yes' : 'no']} tint={colors.blue}
            onSelect={(key) => { setMedical(key === 'yes'); setError(''); }} />
        </>}
        {step === 3 && <>
          <MockLocationPin value={pin} onChange={(value) => { setPin(value); setError(''); }} />
          <View style={formCard}>
            <Field label="Contact number" value={phone} onChangeText={(value) => { setPhone(value); setError(''); }} placeholder="09171234567" keyboardType="phone-pad" />
          </View>
        </>}
        {step === 4 && <View style={{ gap: space.lg }}>
          <View style={formCard}>
            <Text style={styles.section}>Pinned delivery location</Text>
            <Text style={styles.subtitle}>{address}</Text>
            <Text style={styles.small}>{barangay} · Location pinned</Text>
          </View>
          <Upload label="Photo evidence (optional)" uri={evidence} onChange={setEvidence} color={colors.blue} />
        </View>}
        {step === 5 && <>
          <View style={[formCard, { borderColor: formTheme.border, backgroundColor: formTheme.soft }]}>
            <Text style={styles.section}>Requested supplies</Text>
            <Text style={styles.subtitle}>{supplyLabels.join(' · ') || 'Other supplies'}</Text>
            {!!other.trim() && <Text style={styles.subtitle}>{other.trim()}</Text>}
          </View>
          <View style={formCard}>
            <Text style={styles.section}>Household & situation</Text>
            <Text style={styles.subtitle}>{total} {total === 1 ? 'person' : 'people'} in total</Text>
            {GROUPS.map((group) => <Text key={group.key} style={styles.small}>{group.label}: {counts[group.key]}</Text>)}
            <Text style={styles.subtitle}>Flood level: {FLOOD.find((item) => item.key === flood)?.label}</Text>
            <Text style={styles.subtitle}>Medical assistance: {medical ? 'Yes' : 'No'}</Text>
          </View>
          <View style={formCard}>
            <Text style={styles.section}>Delivery details</Text>
            <Text style={styles.subtitle}>{barangay.trim()}</Text><Text style={styles.subtitle}>{address.trim()}</Text>
            <Text style={styles.small}>Contact: {normalizedPhone}</Text>
            <Text style={styles.small}>Location: {latitude}, {longitude}</Text>
            <Text style={styles.small}>{evidence ? 'Photo evidence attached' : 'No photo evidence attached'}</Text>
          </View>

        </>}
      </FadeIn>
    </Page>
  );
}
