import React, { useEffect, useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Choice, colors, space, styles } from '../UI';
import { FormAction as Action, FormChoiceGrid as ChoiceGrid, FormField as Field, FormPage as Page, FormUpload as Upload, FormProgress, FormError, formCard, formTheme } from './ReportFormUI';
import { useSession } from '../../session';
import { MockLocationPin, MockPin } from './MockLocationPin';
import { ReportSuccess } from './ReportSuccess';
import { ReportFormHeader } from './ReportFormHeader';
import { FadeIn } from '../Motion';

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
  const [pin, setPin] = useState<MockPin | null>(null);
  const location = pin?.address ?? '';
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [suggestion, setSuggestion] = useState(false);
  const [saved, setSaved] = useState(false);
  const submitted = useRef(false);

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

  function next() {
    if (!category) { setError('Choose a hazard type.'); return; }
    if (step >= 1 && description.trim().length < 10) { setError('Add a description of at least 10 characters.'); return; }
    if (step >= 2 && !location.trim()) { setError('Choose and confirm your location pin.'); return; }
    setError('');
    if (step < 3) { setStep(step + 1); return; }
    if (submitted.current) return;
    submitted.current = true;
    setSaved(true);
    addReport({ category, description: description.trim(), photo, location: location.trim() });
  }

  if (saved) return <ReportSuccess title="Report sent" summary={`${category} · ${location}`} onBack={onBack} onViewStatus={onViewStatus} />;

  return (
    <Page pageKey={step} edges={['top']} footer={
      <>
        <FormError message={error} />
        {step === 0 && <Action label="Scan with AI" color={colors.blue} secondary
          onPress={() => { setProgress(0); setError(''); setScanning(true); }} />}
        <Action label={saved ? 'Report saved' : step === 3 ? 'Submit Community Report' : 'Continue'}
          disabled={saved} onPress={next} />
      </>
    }>
      <ReportFormHeader title="Report Community Issue" disabled={saved}
        onBack={() => { if (step > 0) { setStep(step - 1); setError(''); } else onBack(); }} />
      <FormProgress step={step} total={STEPS.length} title={STEPS[step]}
        hint={['Choose the hazard you noticed, or scan with AI.', 'Add a short description and an optional photo.', 'Confirm the pin for the issue location.', 'Check the details before saving your report.'][step]} />

      <FadeIn key={step} style={{ gap: space.xl }}>
      {step === 0 && (
        <>
          {suggestion && <View style={[styles.note, { backgroundColor: formTheme.soft, borderWidth: 1, borderColor: formTheme.border, gap: 4 }]}>
            <Text style={{ color: colors.blue, fontWeight: '800', fontSize: 12 }}>AI DETECTED</Text>
            <Text style={styles.rowTitle}>Flood — road inundation detected</Text>
            <Text style={styles.small}>Confirm or change the hazard below.</Text>
          </View>}
          <ChoiceGrid options={CATEGORIES} selected={category ? [category] : []}
            onSelect={(value) => { setCategory(value); setError(''); }} />
        </>
      )}
      {step === 1 && (
        <View style={{ gap: space.lg }}>
          <Field label="What’s happening?" value={description}
            helperText="At least 10 characters. Include the hazard and a nearby landmark."
            onChangeText={(value) => { setDescription(value); setError(''); }}
            placeholder="Example: Water is knee-deep near the school."
            multiline autoCapitalize="sentences" autoCorrect style={{ minHeight: 120, textAlignVertical: 'top' }} />
          <Upload label="Photo (optional)" uri={photo} onChange={setPhoto} color={colors.blue} />
        </View>
      )}
      {step === 2 && <MockLocationPin value={pin} onChange={(value) => { setPin(value); setError(''); }} />}
      {step === 3 && (
        <View style={formCard}>
          <Text style={styles.label}>Hazard type</Text><Text style={styles.section}>{category}</Text>
          <Text style={styles.label}>Details</Text><Text style={styles.subtitle}>{description.trim()}</Text>
          <Text style={styles.label}>Location</Text><Text style={styles.subtitle}>{location.trim()}</Text>
          <Text style={styles.small}>{photo ? 'Photo attached' : 'No photo attached'}</Text>
        </View>
      )}

      </FadeIn>

      <Modal visible={scanning} transparent animationType="fade" onRequestClose={() => setScanning(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(10,20,30,0.82)', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <View style={{ width: 236, height: 180, borderWidth: 2, borderColor: '#91B9FF', borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <View style={{ height: 2, width: '90%', backgroundColor: '#91B9FF', position: 'absolute', top: `${progress}%`, opacity: 0.35 }} />
            <Text accessibilityLiveRegion="polite" style={{ fontSize: 36, fontWeight: '800', color: '#91B9FF' }}>{progress}%</Text>
          </View>
          <Text style={{ color: '#91B9FF', fontWeight: '700', fontSize: 16 }}>AI Hazard Analysis</Text>
          <Text style={{ color: '#D8E5EB', fontSize: 13 }}>Checking hazard details…</Text>
          <Action label="Cancel scan" secondary onPress={() => setScanning(false)} />
        </View>
      </Modal>
    </Page>
  );
}
