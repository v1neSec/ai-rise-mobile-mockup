import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList, SosRequest, useSession } from '../session';
import { Action, Choice, ChoiceGrid, colors, Page, space, styles } from '../components/UI';
import { rescueService } from '../services/rescueService';
import { getApiErrorMessage } from '../api/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Sos'>;
type Step = { id: string; title: string; hint?: string; options: Choice[]; multi?: boolean };
type Icon = NonNullable<Choice['icon']>;

const c = (key: string, icon?: Icon, desc?: string): Choice => ({ key, icon, desc });

const NATURE: Step = {
  id: 'nature',
  title: 'What is your emergency?',
  options: [
    c('Trapped / Need rescue', 'lock-closed-outline', 'Stuck and can’t evacuate'),
    c('Medical emergency', 'medkit-outline', 'Injury, illness or urgent care'),
    c('House flooding', 'home-outline', 'Water entering or rising inside'),
    c('Missing person', 'search-outline', 'Someone is unaccounted for'),
    c('Other', 'help-circle-outline', 'Any other emergency'),
  ],
};

const FOLLOW: Record<string, Step> = {
  'Trapped / Need rescue': {
    id: 'follow', title: 'Where are you trapped?',
    options: [c('Rooftop', 'home-outline'), c('Upper floor', 'layers-outline'), c('Inside a vehicle', 'car-outline'), c('Somewhere else', 'help-circle-outline')],
  },
  'Medical emergency': {
    id: 'follow', title: 'What kind of help is needed?',
    options: [c('Injury', 'bandage-outline'), c('Illness', 'thermometer-outline'), c('Difficulty breathing', 'pulse-outline'), c('Other', 'help-circle-outline')],
  },
  'House flooding': {
    id: 'follow', title: 'How fast is the water rising?',
    options: [c('Slowly', 'trending-up-outline'), c('Steadily', 'trending-up-outline'), c('Very fast', 'flash-outline'), c('Not sure', 'help-circle-outline')],
  },
  'Missing person': {
    id: 'follow', title: 'How long have they been missing?',
    options: [c('Under 1 hour', 'time-outline'), c('1–6 hours', 'time-outline'), c('Over 6 hours', 'time-outline'), c('Not sure', 'help-circle-outline')],
  },
  Other: {
    id: 'follow', title: 'Is anyone in immediate danger?',
    options: [c('Yes', 'warning-outline'), c('No', 'checkmark-outline'), c('Not sure', 'help-circle-outline')],
  },
};

const VULN: Step = {
  id: 'vulnerable', title: 'Who needs extra care?', hint: 'Select all that apply.', multi: true,
  options: [
    c('Elderly', 'walk-outline'), c('Children / infants', 'happy-outline'),
    c('Persons with disability', 'accessibility-outline'), c('Pregnant', 'woman-outline'),
    c('None', 'checkmark-circle-outline'),
  ],
};
const WATER: Step = {
  id: 'water', title: 'How deep is the water where you are?',
  options: [c('No flooding yet', 'footsteps-outline'), c('Ankle-deep', 'water-outline'), c('Knee-deep', 'water-outline'), c('Waist-deep or higher', 'water')],
};
const ACCESS: Step = {
  id: 'access', title: 'Can rescuers reach you by road?', hint: 'Choose one, then press Send SOS.',
  options: [c('Road is passable', 'car-outline'), c('Flooded, need a boat', 'boat-outline'), c('Need air rescue', 'airplane-outline'), c('Not sure', 'help-circle-outline')],
};

const WEIGHT: Record<string, number> = {
  'Trapped / Need rescue': 3, 'Medical emergency': 3, 'House flooding': 2, 'Missing person': 2, Other: 1,
};

function priorityOf(sel: Record<string, string[]>): SosRequest['priority'] {
  const water = WATER.options.findIndex((x) => x.key === sel.water?.[0]);
  const vuln = (sel.vulnerable ?? []).filter((v) => v !== 'None').length;
  const score = (WEIGHT[sel.nature?.[0]] ?? 1) + Math.max(water, 0) + vuln;
  return score >= 6 ? 'Critical' : score >= 4 ? 'High' : 'Medium';
}

async function getPlace(): Promise<{ lat: number; lng: number; address: string }> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') throw new Error('Allow location access to send an SOS.');
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((r) => setTimeout(() => r(null), 6000)),
    ]);
    if (!pos) throw new Error('Could not get your location. Try again.');
    const lat = pos.coords.latitude; const lng = pos.coords.longitude;
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }).catch(() => []);
    const address = [place?.name, place?.street, place?.district, place?.city].filter(Boolean).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    return { lat, lng, address };
  } catch {
    throw new Error('Could not get your location. Try again.');
  }
}

function Row({ k, v, color = colors.text }: { k: string; v: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
      <Text style={styles.subtitle}>{k}</Text>
      <Text style={{ color, fontWeight: '700', fontSize: 15, flexShrink: 1, textAlign: 'right' }}>{v}</Text>
    </View>
  );
}

export default function SosScreen({ navigation }: Props) {
  const { session } = useSession();
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [phase, setPhase] = useState<'form' | 'sending' | 'done'>('form');
  const [sent, setSent] = useState<SosRequest | null>(null);
  const [sendError, setSendError] = useState('');
  const sending = useRef(false);
  const progress = useRef(new Animated.Value(0.2)).current;
  const pop = useRef(new Animated.Value(0)).current;

  const steps: Step[] = [NATURE, FOLLOW[sel.nature?.[0]] ?? FOLLOW.Other, VULN, WATER, ACCESS];
  const cur = steps[step];
  const chosen = sel[cur.id] ?? [];
  const last = step === steps.length - 1;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (step + 1) / steps.length,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step, progress, steps.length]);

  useEffect(() => {
    if (phase === 'done') Animated.spring(pop, { toValue: 1, useNativeDriver: true, bounciness: 10 }).start();
  }, [phase, pop]);

  function choose(key: string) {
    if (cur.multi) {
      const now = sel[cur.id] ?? [];
      const next =
        key === 'None' ? ['None']
          : now.includes(key) ? now.filter((k) => k !== key)
            : [...now.filter((k) => k !== 'None'), key];
      setSel({ ...sel, [cur.id]: next });
      return;
    }
    const next = { ...sel, [cur.id]: [key] };
    if (cur.id === 'nature' && sel.nature?.[0] !== key) delete next.follow;
    setSel(next);
    // The last step needs an explicit "Send SOS" press, so a stray tap can't send it.
    if (!last) setTimeout(() => setStep((s) => s + 1), 200);
  }

  function back() {
    if (step > 0) setStep(step - 1);
    else navigation.goBack();
  }

  async function send() {
    if (sending.current) return;
    if (!session) { navigation.navigate('Auth', { role: 'resident', returnTo: 'Sos' }); return; }
    sending.current = true;
    setPhase('sending');
    setSendError('');
    try {
      const place = await getPlace();
      const vulnerable = sel.vulnerable ?? [];
      const result = await rescueService.createRescue({
        address: place.address, location: { lat: place.lat, lng: place.lng },
        childrens: vulnerable.includes('Children / infants') ? 1 : 0,
        elderly: vulnerable.includes('Elderly') ? 1 : 0,
        pwd: vulnerable.includes('Persons with disability') ? 1 : 0,
        adults: vulnerable.includes('Pregnant') || vulnerable.includes('None') || vulnerable.length === 0 ? 1 : 0,
        flood_level: ({ 'No flooding yet': 'no_flooding', 'Ankle-deep': 'ankle_deep', 'Knee-deep': 'knee_deep', 'Waist-deep or higher': 'waist_deep_or_higher' } as Record<string, 'no_flooding' | 'ankle_deep' | 'knee_deep' | 'waist_deep_or_higher'>)[sel.water?.[0] ?? 'No flooding yet'],
        medical_assistance: sel.nature?.[0] === 'Medical emergency',
      });
      const req: SosRequest = { id: String(result.id), createdAt: result.created_at, nature: sel.nature?.[0] ?? 'Emergency', details: [sel.follow?.[0], sel.water?.[0], sel.access?.[0]].filter(Boolean) as string[], vulnerable, priority: priorityOf(sel), location: result.address, status: result.status === 'rescued' ? 'Completed' : result.rescuer ? 'Assigned' : 'Pending' };
      setSent(req); setPhase('done');
    } catch (cause) { setSendError(getApiErrorMessage(cause)); setPhase('form'); sending.current = false; }
  }

  if (phase === 'sending') {
    return (
      <Page>
        <View style={{ minHeight: 480, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
          <ActivityIndicator size="large" color={colors.sos} />
          <Text style={styles.section}>Sending your SOS…</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Preparing your location and request details.
          </Text>
        </View>
      </Page>
    );
  }

  if (phase === 'done' && sent) {
    return (
      <Page
        footer={
          <>
            <Action label="Track my request" onPress={() => navigation.replace('ResidentTabs', { screen: 'Status' })} />
            <Action label="Back to home" secondary onPress={() => navigation.replace('ResidentTabs', { screen: 'Home' })} />
          </>
        }
      >
        <View style={{ alignItems: 'center', gap: space.lg, paddingTop: space.xl }}>
          <Animated.View
            style={{
              width: 88, height: 88, borderRadius: 44, backgroundColor: '#E8F6EF',
              alignItems: 'center', justifyContent: 'center', transform: [{ scale: pop }],
            }}
          >
            <Ionicons name="checkmark" size={48} color={colors.green} />
          </Animated.View>
          <Text style={[styles.title, { textAlign: 'center' }]}>SOS sent</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Keep your phone on and track your request in Status.
          </Text>
        </View>
        <View style={styles.card}>
          <Row k="Reference" v={sent.id} />
          <Row k="Request status" v={sent.status} color={colors.blue} />
          <Row k="Responder" v="Volunteer assignment is automatic" />
          <Row k="Location" v={sent.location} />
        </View>
      </Page>
    );
  }

  return (
    <Page
      footer={
        cur.multi || last ? (
          <Action
            label={last ? 'Send SOS' : 'Continue'}
            color={colors.sos}
            disabled={chosen.length === 0}
            onPress={() => (last ? send() : setStep(step + 1))}
          />
        ) : undefined
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={back}
          style={({ pressed }) => ({
            width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
            backgroundColor: pressed ? colors.fill : '#FFFFFF', alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 14 }}>Emergency SOS</Text>
            <Text style={styles.small}>Step {step + 1} of {steps.length}</Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: '#E1E7EF', overflow: 'hidden' }}>
            <Animated.View
              style={{ height: 6, backgroundColor: colors.sos, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}
            />
          </View>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <Text style={[styles.title, { fontSize: 24, lineHeight: 30 }]}>{cur.title}</Text>
        {!!cur.hint && <Text style={styles.subtitle}>{cur.hint}</Text>}
      </View>

      <ChoiceGrid
        key={cur.id + step}
        options={cur.options}
        selected={chosen}
        onSelect={choose}
        tint={colors.sos}
        multi={cur.multi}
      />
      {!!sendError && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{sendError}</Text>}
    </Page>
  );
}
