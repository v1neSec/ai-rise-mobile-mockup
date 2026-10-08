import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../../session';
import { SUPPLY_OPTIONS, SupplyFloodLevel, SupplyNeed, SupplyRequest } from '../../types/supply';
import { captureReportCoordinates } from '../../utils/reportLocation';
import { Action, Choice, ChoiceGrid, colors, Field, Page, PickerRow, space, Stepper, styles, Upload } from '../UI';
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
  { title: 'Where should supplies go?', hint: 'Add your barangay, delivery address, and contact number.' },
  { title: 'Pin your delivery location', hint: 'Use your device location or enter the coordinates. A photo is optional.' },
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
  const [barangay, setBarangay] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [evidence, setEvidence] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<SupplyRequest | null>(null);
  const submitted = useRef(false);
  const mounted = useRef(true);
  const total = counts.childrens + counts.elderly + counts.pwd + counts.adults;
  const normalizedPhone = phone.replace(/[\s()-]/g, '');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function validate(index: number): string {
    if (index === 0) {
      if (!selected.length) return 'Choose at least one supply type.';
      if (selected.includes('other') && !other.trim()) return 'Describe the other supplies you need.';
    }
    if (index === 1 && total < 1) return 'Add at least one person to your household.';
    if (index === 2 && (!flood || medical === null)) return 'Choose the flood level and whether medical assistance is needed.';
    if (index === 3) {
      if (!barangay.trim() || !address.trim()) return 'Enter your barangay and delivery address.';
      if (!/^(09\d{9}|\+639\d{9}|639\d{9})$/.test(normalizedPhone)) return 'Enter a mobile number such as 09171234567 or +639171234567.';
    }
    if (index === 4) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return 'Pin a location or enter valid latitude (−90 to 90) and longitude (−180 to 180).';
      }
    }
    return '';
  }

  function next() {
    const message = step === STEPS.length - 1
      ? STEPS.map((_, index) => validate(index)).find(Boolean) || '' : validate(step);
    if (message) { setError(message); return; }
    setError('');
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    if (submitted.current || !flood || medical === null) return;
    submitted.current = true;
    const flags = Object.fromEntries(SUPPLY_OPTIONS.map((option) => [option.key, selected.includes(option.key)])) as Record<SupplyNeed, boolean>;
    setSent(addSupplyRequest({
      ...flags, ...counts,
      barangay: barangay.trim(), address: address.trim(), contact_number: normalizedPhone,
      location: { latitude: Number(latitude), longitude: Number(longitude) },
      evidence: evidence || null, flood_level: flood,
      other_supplies: other.trim(), medical_assistance: medical,
    }));
  }

  async function pinLocation() {
    setLocating(true); setError('');
    try {
      const coordinates = await captureReportCoordinates();
      if (mounted.current) {
        setLatitude(coordinates.latitude.toFixed(6));
        setLongitude(coordinates.longitude.toFixed(6));
      }
    } catch {
      if (mounted.current) setError('Unable to pin your location. Allow location access and try again, or enter coordinates below.');
    } finally {
      if (mounted.current) setLocating(false);
    }
  }

  if (sent) {
    return (
      <Page edges={['top']} footer={<>
        <Action label="View request status" color={colors.teal} onPress={onViewStatus} />
        <Action label="Back to report options" secondary onPress={onBack} />
      </>}>
        <FadeIn style={{ alignItems: 'center', paddingVertical: 24, gap: space.lg }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#E7F4F1', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark-circle-outline" size={50} color={colors.teal} />
          </View>
          <Text style={[styles.title, { textAlign: 'center' }]}>Supply request saved</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>Saved locally for this demo. No delivery team has been contacted.</Text>
        </FadeIn>
        <View style={styles.card}>
          <Text style={styles.label}>Request reference</Text><Text selectable style={styles.section}>{sent.id}</Text>
          <Text style={styles.subtitle}>{total} {total === 1 ? 'person' : 'people'} · {sent.barangay}</Text>
          <Text style={styles.small}>Awaiting supplies · No deliverer assigned</Text>
        </View>
      </Page>
    );
  }

  const supplyLabels = SUPPLY_OPTIONS.filter((option) => selected.includes(option.key)).map((option) => option.label);
  return (
    <Page edges={['top']} footer={<>
      {!!error && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger, fontSize: 14, lineHeight: 20 }}>{error}</Text>}
      <Action label={step === STEPS.length - 1 ? 'Request Supplies' : 'Continue'} color={colors.teal} disabled={locating} onPress={next} />
    </>}>
      <ReportFormHeader title="Request Supplies" disabled={locating}
        onBack={() => { if (step > 0) { setStep(step - 1); setError(''); } else onBack(); }} />
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.teal, fontWeight: '700', fontSize: 13 }}>HOUSEHOLD SUPPORT</Text>
          <Text style={styles.small}>Step {step + 1} of {STEPS.length}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {STEPS.map((item, index) => <View key={item.title} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: index <= step ? colors.teal : colors.border }} />)}
        </View>
      </View>
      <FadeIn key={step} style={{ gap: space.xl }}>
        <View style={{ gap: 6 }}>
          <Text style={[styles.title, { fontSize: 24, lineHeight: 30 }]}>{STEPS[step].title}</Text>
          <Text style={styles.subtitle}>{STEPS[step].hint}</Text>
        </View>
        {step === 0 && <>
          <ChoiceGrid options={NEEDS} selected={selected} multi tint={colors.teal}
            onSelect={(key) => { setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]); setError(''); }} />
          <Field label={selected.includes('other') ? 'What other supplies do you need?' : 'Specific items / other supplies (optional)'} value={other}
            onChangeText={(value) => { setOther(value); setError(''); }} placeholder="e.g. maintenance medicine, diapers size M"
            multiline autoCapitalize="sentences" style={{ minHeight: 88, textAlignVertical: 'top' }} />
        </>}
        {step === 1 && <>
          <View style={[styles.note, { backgroundColor: '#E7F4F1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text style={{ color: colors.teal, fontWeight: '700' }}>People in your household</Text>
            <Text accessibilityLiveRegion="polite" style={{ color: colors.teal, fontSize: 26, fontWeight: '800' }}>{total}</Text>
          </View>
          <View style={{ gap: space.md }}>
            {GROUPS.map((group) => <Stepper key={group.key} label={group.label} value={counts[group.key]} max={999} color={colors.teal}
              onChange={(value) => { setCounts((current) => ({ ...current, [group.key]: value })); setError(''); }} />)}
          </View>
        </>}
        {step === 2 && <>
          <Text style={styles.section}>Flood level at your location</Text>
          <ChoiceGrid options={FLOOD} selected={flood ? [flood] : []} tint={colors.teal}
            onSelect={(key) => { setFlood(key as SupplyFloodLevel); setError(''); }} />
          <Text style={styles.section}>Is medical assistance needed?</Text>
          <ChoiceGrid options={[{ key: 'yes', label: 'Yes', icon: 'medkit-outline' }, { key: 'no', label: 'No', icon: 'checkmark-circle-outline' }]}
            selected={medical === null ? [] : [medical ? 'yes' : 'no']} tint={colors.teal}
            onSelect={(key) => { setMedical(key === 'yes'); setError(''); }} />
        </>}
        {step === 3 && <View style={[styles.card, { gap: space.lg }]}>
          <Field label="Barangay" value={barangay} onChangeText={(value) => { setBarangay(value); setError(''); }} placeholder="e.g. Barangay San Isidro" autoCapitalize="words" />
          <Field label="Delivery address / landmark" value={address} onChangeText={(value) => { setAddress(value); setError(''); }}
            placeholder="House number, street, and nearby landmark" multiline autoCapitalize="words" style={{ minHeight: 88, textAlignVertical: 'top' }} />
          <Field label="Contact number" value={phone} onChangeText={(value) => { setPhone(value); setError(''); }} placeholder="09171234567" keyboardType="phone-pad" />
        </View>}
        {step === 4 && <View style={{ gap: space.lg }}>
          <PickerRow icon="location-outline" title="Use device location" subtitle={latitude && longitude ? `${latitude}, ${longitude}` : 'Pin where the supplies should be delivered'}
            done={!!latitude && !!longitude} loading={locating} onPress={pinLocation} color={colors.teal} />
          <View style={[styles.card, { gap: space.md }]}>
            <Field label="Latitude" value={latitude} editable={!locating} keyboardType="numeric"
              onChangeText={(value) => { setLatitude(value); setError(''); }} placeholder="e.g. 14.5995" />
            <Field label="Longitude" value={longitude} editable={!locating} keyboardType="numeric"
              onChangeText={(value) => { setLongitude(value); setError(''); }} placeholder="e.g. 120.9842" />
          </View>
          <Text style={styles.small}>Pin only if you are at the delivery address. Otherwise enter the delivery coordinates.</Text>
          <Upload label="Photo evidence (optional)" uri={evidence} onChange={setEvidence} color={colors.teal} />
        </View>}
        {step === 5 && <>
          <View style={[styles.card, { borderColor: '#B9DDD5', backgroundColor: '#F0F8F5' }]}>
            <Text style={styles.section}>Requested supplies</Text>
            <Text style={styles.subtitle}>{supplyLabels.join(' · ') || 'Other supplies'}</Text>
            {!!other.trim() && <Text style={styles.subtitle}>{other.trim()}</Text>}
          </View>
          <View style={styles.card}>
            <Text style={styles.section}>Household & situation</Text>
            <Text style={styles.subtitle}>{total} {total === 1 ? 'person' : 'people'} in total</Text>
            {GROUPS.map((group) => <Text key={group.key} style={styles.small}>{group.label}: {counts[group.key]}</Text>)}
            <Text style={styles.subtitle}>Flood level: {FLOOD.find((item) => item.key === flood)?.label}</Text>
            <Text style={styles.subtitle}>Medical assistance: {medical ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.section}>Delivery details</Text>
            <Text style={styles.subtitle}>{barangay.trim()}</Text><Text style={styles.subtitle}>{address.trim()}</Text>
            <Text style={styles.small}>Contact: {normalizedPhone}</Text>
            <Text style={styles.small}>Location: {latitude}, {longitude}</Text>
            <Text style={styles.small}>{evidence ? 'Photo evidence attached' : 'No photo evidence attached'}</Text>
          </View>
          <Text style={styles.small}>Mockup only. This saves the request for this session and does not arrange a real delivery.</Text>
        </>}
      </FadeIn>
    </Page>
  );
}
