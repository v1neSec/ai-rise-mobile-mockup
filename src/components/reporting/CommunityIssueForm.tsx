import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Text, View } from 'react-native';
import { Action, Choice, ChoiceGrid, colors, Field, Page, PickerRow, space, styles, Upload } from '../UI';
import { useSession } from '../../session';
import { captureReportLocation } from '../../utils/reportLocation';
import { ReportFormHeader } from './ReportFormHeader';

const CATEGORIES: Choice[] = [
  { key: 'Road Flooding', icon: 'water-outline' },
  { key: 'Landslide', icon: 'triangle-outline' },
  { key: 'Structural Damage', icon: 'warning-outline' },
  { key: 'Stranded Person', icon: 'people-outline' },
  { key: 'Power Line Down', icon: 'flash-outline' },
  { key: 'Other', icon: 'help-circle-outline' },
];
const STEPS = ['What type of hazard?', 'Describe the issue', 'Where is the issue?', 'Review your report'];

export function CommunityIssueForm({ onBack, onViewStatus }: { onBack: () => void; onViewStatus: () => void }) {
  const { addReport } = useSession();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [suggestion, setSuggestion] = useState(false);
  const [saved, setSaved] = useState(false);
  const submitted = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => setProgress((value) => Math.min(95, value + 5)), 100);
    const timeout = setTimeout(() => {
      setProgress(100);
      setCategory('Road Flooding');
      setSuggestion(true);
      setScanning(false);
    }, 2000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [scanning]);

  async function pinLocation() {
    setLocating(true); setError('');
    try {
      const place = await captureReportLocation();
      if (mounted.current) setLocation(place);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Could not get location. Enter the address manually.');
    } finally {
      if (mounted.current) setLocating(false);
    }
  }

  function next() {
    if (!category) { setError('Choose a hazard type.'); return; }
    if (step >= 1 && description.trim().length < 10) { setError('Add a description of at least 10 characters.'); return; }
    if (step >= 2 && !location.trim()) { setError('Pin the issue location or enter its address.'); return; }
    setError('');
    if (step < 3) { setStep(step + 1); return; }
    if (submitted.current) return;
    submitted.current = true;
    setSaved(true);
    addReport({ category, description: description.trim(), photo, location: location.trim() });
    Alert.alert('Community report saved (demo)', 'Saved locally for this session. Nothing has been sent to your barangay.',
      [{ text: 'View status', onPress: onViewStatus }, { text: 'Done', onPress: onBack }]);
  }

  return (
    <Page edges={['top']} footer={
      <>
        {!!error && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{error}</Text>}
        {step === 0 && <Action label="Scan with AI" color={colors.teal} secondary
          onPress={() => { setProgress(0); setError(''); setScanning(true); }} />}
        <Action label={saved ? 'Report saved' : step === 3 ? 'Submit Community Report' : 'Next'}
          disabled={locating || saved || (step === 0 && !category)} onPress={next} />
      </>
    }>
      <ReportFormHeader title="Report Community Issue" disabled={locating}
        onBack={() => { if (step > 0) { setStep(step - 1); setError(''); } else onBack(); }} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {STEPS.map((label, index) => <View key={label} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: index <= step ? colors.teal : colors.border }} />)}
      </View>
      <Text style={styles.subtitle}>Step {step + 1} of 4 — {STEPS[step]}</Text>

      {step === 0 && (
        <>
          {suggestion && <View style={[styles.note, { backgroundColor: '#E5F3F1', borderWidth: 1, borderColor: '#A9DAD5', gap: 4 }]}>
            <Text style={{ color: colors.teal, fontWeight: '800', fontSize: 12 }}>AI PREVIEW · DEMO</Text>
            <Text style={styles.rowTitle}>Flood — road inundation detected</Text>
            <Text style={styles.small}>Sample result only. Confirm or change the hazard below.</Text>
          </View>}
          <ChoiceGrid options={CATEGORIES} selected={category ? [category] : []}
            onSelect={(value) => { setCategory(value); setError(''); }} />
        </>
      )}
      {step === 1 && (
        <View style={{ gap: space.lg }}>
          <Field label="What’s happening?" value={description}
            onChangeText={(value) => { setDescription(value); setError(''); }}
            placeholder="Example: Water is knee-deep near the school."
            multiline autoCapitalize="sentences" autoCorrect style={{ minHeight: 120, textAlignVertical: 'top' }} />
          <Upload label="Photo (optional)" uri={photo} onChange={setPhoto} color={colors.blue} />
        </View>
      )}
      {step === 2 && (
        <View style={{ gap: space.lg }}>
          <PickerRow icon="location-outline" title="Pin your location" subtitle={location || 'Use your current device location'}
            done={!!location.trim()} loading={locating} onPress={pinLocation} color={colors.blue} />
          <Field label="Location / address" value={location} editable={!locating}
            onChangeText={(value) => { setLocation(value); setError(''); }} placeholder="Street, landmark, and barangay" autoCapitalize="words" />
          <Text style={styles.small}>If the issue is elsewhere, enter its address instead of your current location.</Text>
        </View>
      )}
      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.label}>Hazard type</Text><Text style={styles.section}>{category}</Text>
          <Text style={styles.label}>Details</Text><Text style={styles.subtitle}>{description.trim()}</Text>
          <Text style={styles.label}>Location</Text><Text style={styles.subtitle}>{location.trim()}</Text>
          <Text style={styles.small}>{photo ? 'Photo attached' : 'No photo attached'}</Text>
        </View>
      )}
      <Text style={styles.small}>Mockup only. Reports and AI analysis are not connected yet.</Text>

      <Modal visible={scanning} transparent animationType="fade" onRequestClose={() => setScanning(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(10,20,30,0.82)', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <View style={{ width: 236, height: 180, borderWidth: 2, borderColor: '#36D2C4', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <View style={{ height: 2, width: '90%', backgroundColor: '#36D2C4', position: 'absolute', top: `${progress}%`, opacity: 0.35 }} />
            <Text accessibilityLiveRegion="polite" style={{ fontSize: 36, fontWeight: '800', color: '#36D2C4' }}>{progress}%</Text>
          </View>
          <Text style={{ color: '#36D2C4', fontWeight: '700', fontSize: 16 }}>AI Hazard Analysis</Text>
          <Text style={{ color: '#D8E5EB', fontSize: 13 }}>Simulated scan · no photo analysis</Text>
          <Action label="Cancel scan" secondary onPress={() => setScanning(false)} />
        </View>
      </Modal>
    </Page>
  );
}
