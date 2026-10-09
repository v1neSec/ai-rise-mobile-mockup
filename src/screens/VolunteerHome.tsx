import React, { ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Deployment,
  LAST_STAGE,
  RootStackParamList,
  VolunteerTabParamList,
  stepLabels,
  useSession,
} from '../session';
import { colors, Page, space, styles } from '../components/UI';
import { HomeHeader } from '../components/AppChrome';
import { useAppPanels } from '../components/FloatingMenu';
import { FadeIn } from '../components/Motion';
import {
  AvailabilityPill,
  InfoRow,
  PriorityBadge,
  SwipeToAccept,
  priorityColor,
  vt,
  volunteerCard,
  VolunteerAction,
} from '../components/VolunteerUI';
import * as Location from 'expo-location';
import { rescueService } from '../services/rescueService';
import { supplyService, type BackendSupply } from '../services/supplyService';
import { driverService } from '../services/driverService';
import { getApiErrorMessage } from '../api/api';
import type { Rescue } from '../types/rescue';

type Nav = BottomTabNavigationProp<VolunteerTabParamList, 'Hub'>;
type IconName = ComponentProps<typeof Ionicons>['name'];

const toRescueDeployment = (r: Rescue): Deployment => {
  const total = r.childrens + r.elderly + r.pwd + r.adults;
  return { id: `R-${r.id}`, backendId: r.id, kind: 'rescue', title: `Rescue assistance · ${total} ${total === 1 ? 'person' : 'people'}`, location: `${r.address}, ${r.barangay}`, distance: 'Assigned by dispatch', priority: r.medical_assistance || r.flood_level === 'waist_deep_or_higher' ? 'Critical' : 'High', people: `${total} people · ${r.childrens} children, ${r.elderly} elderly`, access: r.flood_level.replace(/_/g, ' '), action: 'Rescuing', briefing: `Rescue request #${r.id}. ${r.medical_assistance ? 'Medical assistance requested. ' : ''}${r.address}.`, tags: [`Barangay: ${r.barangay}`, `Flood: ${r.flood_level.replace(/_/g, ' ')}`], outcome: `Rescue request #${r.id} completed` };
};
const toSupplyDeployment = (r: BackendSupply): Deployment => ({ id: `S-${r.id}`, backendId: r.id, kind: 'supply', title: `Supply delivery · ${r.barangay}`, location: `${r.address}, ${r.barangay}`, distance: 'Assigned by dispatch', priority: r.medical_assistance ? 'Critical' : 'High', people: `${r.childrens + r.elderly + r.pwd + r.adults} residents`, access: r.flood_level.replace(/_/g, ' '), action: 'Delivering', briefing: `Supply request #${r.id}. ${r.other_supplies || 'Deliver requested household supplies.'}`, tags: [`Barangay: ${r.barangay}`, `Flood: ${r.flood_level.replace(/_/g, ' ')}`], outcome: `Supply request #${r.id} delivered` });

/* Small tile: icon + label + value. */
function Tile({
  icon,
  label,
  value,
  color = colors.text,
}: {
  icon: IconName;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderColor: vt.blueBorder,
        borderWidth: 0,
        borderRadius: 18,
        padding: space.md,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={16} color={colors.blue} />
        <Text style={{ fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.muted }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 15, lineHeight: 21, fontWeight: '800', color }}>
        {value}
      </Text>
    </View>
  );
}

function RequestCard({ d, index, onAccept }: { d: Deployment; index: number; onAccept: () => void }) {
  return (
    <FadeIn
      delay={index * 90}
      style={[volunteerCard, { overflow: 'hidden', paddingLeft: 22 }]}
    >
      {/* priority stripe */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: priorityColor(d.priority),
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 17, lineHeight: 23, fontWeight: '800', color: colors.text }}>{d.title}</Text>
          <InfoRow icon="location-outline" text={`${d.location} · ${d.distance}`} />
        </View>
        <PriorityBadge priority={d.priority} />
      </View>
      <View style={{ gap: 8, backgroundColor: '#F7F9FE', borderRadius: 14, padding: 12 }}>
        <InfoRow icon="people-outline" text={d.people} />
        <InfoRow icon="navigate-outline" text={`Access: ${d.access}`} />
      </View>
      <SwipeToAccept label="Open assigned task" doneLabel="Opened" onAccept={onAccept} />
    </FadeIn>
  );
}

export default function VolunteerHome() {
  const navigation = useNavigation<Nav>();
  const {
    session,
    volunteerOnline,
    setVolunteerOnline,
    requests,
    active,
    acceptRequest,
    broadcasts,
    completedCount,
    setRequests,
  } = useSession();
  const [driverProfile, setDriverProfile] = useState<{ vehicle_plate: string; location: { lat: number; lng: number } | null; is_available: boolean } | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [reload, setReload] = useState(0);
  const lastLocation = useRef<{ latitude: number; longitude: number } | null>(null);

  /* Swiping right from the screen edge triggers the stack's "go back" gesture,
   * which is what sent you to the previous screen while using Swipe to accept.
   * Turn that gesture off while this screen is focused, and restore it after. */
  useFocusEffect(
    useCallback(() => {
      const stack = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
      stack?.setOptions({ gestureEnabled: false });
      return () => stack?.setOptions({ gestureEnabled: true });
    }, [navigation]),
  );

  useFocusEffect(useCallback(() => {
    void reload;
    if (!session?.userId) return;
    let alive = true;
    setLoadingTasks(true); setLoadError('');
    Promise.all([rescueService.getAssignedRescues(), supplyService.getAssignedDeliveries(), driverService.getDriver(session.userId)])
      .then(([rescueItems, supplyItems, profile]) => {
        if (!alive) return;
        setRequests([...rescueItems.map(toRescueDeployment), ...supplyItems.map(toSupplyDeployment)]);
        setDriverProfile({ vehicle_plate: profile.driver_profile.vehicle_plate, location: profile.driver_profile.location, is_available: profile.driver_profile.is_available });
        setVolunteerOnline(profile.driver_profile.is_available);
      })
      .catch((cause) => { if (alive) setLoadError(getApiErrorMessage(cause)); })
      .finally(() => { if (alive) setLoadingTasks(false); });
    return () => { alive = false; };
  }, [session?.userId, reload, setRequests, setVolunteerOnline]));

  useEffect(() => {
    if (!volunteerOnline || !session?.userId) return;
    let alive = true;
    let subscription: Location.LocationSubscription | undefined;
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!alive || permission.status !== 'granted') return;
        subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 50 }, (position) => {
          const { latitude, longitude } = position.coords; const prior = lastLocation.current;
          if (prior && Math.abs(prior.latitude - latitude) < 0.0001 && Math.abs(prior.longitude - longitude) < 0.0001) return;
          lastLocation.current = { latitude, longitude };
          void driverService.updateDriver(session.userId, { driver_profile: { location: { lat: latitude, lng: longitude } } }).catch(() => {});
          setDriverProfile((current) => current ? { ...current, location: { lat: latitude, lng: longitude } } : current);
        });
      } catch { /* GPS reporting is best-effort. */ }
    })();
    return () => { alive = false; subscription?.remove(); };
  }, [volunteerOnline, session?.userId]);

  function accept(id: string) {
    acceptRequest(id);
    navigation.navigate('Deployment');
  }

  async function toggleAvailability() {
    if (!session?.userId || !driverProfile) { setVolunteerOnline(!volunteerOnline); return; }
    const next = !volunteerOnline;
    setVolunteerOnline(next); setDriverProfile({ ...driverProfile, is_available: next });
    try { await driverService.updateDriver(session.userId, { driver_profile: { is_available: next } }); }
    catch (cause) { setVolunteerOnline(!next); setDriverProfile({ ...driverProfile, is_available: !next }); Alert.alert('Availability not updated', getApiErrorMessage(cause)); }
  }

  const { showProfile, showUpdates } = useAppPanels();

  const complete = !!active && active.stage >= LAST_STAGE;
  const statusText = active ? 'On deployment' : volunteerOnline ? 'Available' : 'Offline';

  return (
    <Page edges={['top']} bottomSpace={90}>
      {/* Header */}
      <FadeIn>
        <HomeHeader role="Volunteer" onProfile={showProfile} onUpdates={showUpdates} />
      </FadeIn>

      {/* Profile */}
      <FadeIn delay={60}>
        <View style={[volunteerCard, { backgroundColor: '#FFFFFFB8' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            <View style={{ gap: 3 }}>
              <Text style={styles.section}>Hello, {session?.name ?? 'Volunteer'}</Text>
              <Text style={styles.small}>{completedCount} deployments completed</Text>
            </View>
            <AvailabilityPill online={volunteerOnline} onToggle={() => { void toggleAvailability(); }} />
          </View>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Tile icon="car-outline" label="Vehicle plate" value={driverProfile?.vehicle_plate || 'Loading profile'} />
            <Tile icon="people-outline" label="Assigned tasks" value={String(requests.length)} />
          </View>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Tile icon="location-outline" label="Live location" value={driverProfile?.location ? `${driverProfile.location.lat.toFixed(4)}, ${driverProfile.location.lng.toFixed(4)}` : 'Waiting for GPS'} />
            <Tile
              icon={active ? 'navigate-outline' : volunteerOnline ? 'radio-button-on' : 'moon-outline'}
              label="Status"
              value={statusText}
              color={volunteerOnline || active ? colors.blue : colors.muted}
            />
          </View>
        </View>
      </FadeIn>

      {/* Requests */}
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text style={[styles.section, { flex: 1 }]}>Deployment requests</Text>
          {volunteerOnline && !active && requests.length > 0 && (
            <View
              style={{
                minWidth: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.blue,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{requests.length}</Text>
            </View>
          )}
        </View>

        {!!loadError && <View style={volunteerCard}><Text style={{ color: colors.danger }}>{loadError}</Text><VolunteerAction label="Retry assignments" secondary onPress={() => setReload((value) => value + 1)} /></View>}
        {loadingTasks && <Text style={styles.small}>Loading assigned tasks…</Text>}
        {active ? (
          <FadeIn style={[volunteerCard, { backgroundColor: vt.blueSoft }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Ionicons name={complete ? 'checkmark-circle' : 'navigate-circle'} size={30} color={colors.blue} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, lineHeight: 22, fontWeight: '800', color: colors.blue }}>
                  {complete ? 'Deployment complete' : 'Deployment in progress'}
                </Text>
                <Text style={styles.small} numberOfLines={2}>
                  {complete
                    ? 'Close it out in the Deployment tab.'
                    : `${active.deployment.title} · ${stepLabels(active.deployment)[active.stage]}`}
                </Text>
              </View>
            </View>
            <VolunteerAction label="Open deployment" onPress={() => navigation.navigate('Deployment')} />
          </FadeIn>
        ) : !volunteerOnline ? (
          <FadeIn style={[volunteerCard, { alignItems: 'center' }]}>
            <Ionicons name="moon-outline" size={30} color={colors.muted} />
            <Text style={styles.section}>You’re offline</Text>
            <Text style={[styles.subtitle, { textAlign: 'center' }]}>
              Go available to start receiving deployment requests.
            </Text>
            <View style={{ alignSelf: 'stretch' }}>
              <VolunteerAction label="Go available" onPress={() => setVolunteerOnline(true)} />
            </View>
          </FadeIn>
        ) : requests.length === 0 ? (
          <FadeIn style={[volunteerCard, { alignItems: 'center' }]}>
            <Ionicons name="checkmark-circle-outline" size={30} color={colors.blue} />
            <Text style={styles.section}>All clear</Text>
            <Text style={[styles.subtitle, { textAlign: 'center' }]}>
              No tasks are assigned right now. The backend assigns available volunteers automatically.
            </Text>
          </FadeIn>
        ) : (
          requests.map((d, i) => <RequestCard key={d.id} d={d} index={i} onAccept={() => accept(d.id)} />)
        )}
      </View>

      {/* Broadcast */}
        <FadeIn delay={120} style={volunteerCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name="radio-outline" size={20} color={colors.blue} />
          <Text style={styles.section}>Team broadcast</Text>
        </View>
        {broadcasts.length === 0 && <Text style={styles.subtitle}>Team broadcasts aren’t available from the current API.</Text>}
        {broadcasts.slice(0, 5).map((b, i) => (
          <FadeIn
            key={b.id}
            delay={i * 70}
            style={{
              flexDirection: 'row',
              gap: space.md,
              paddingTop: i ? space.md : 0,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: b.urgent ? vt.criticalSoft : vt.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons
                name={b.urgent ? 'megaphone-outline' : 'chatbubble-ellipses-outline'}
                size={20}
                color={b.urgent ? colors.danger : colors.blue}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 22,
                  color: colors.text,
                  fontWeight: b.urgent ? '700' : '400',
                }}
              >
                {b.message}
              </Text>
              <Text style={styles.small}>
                {b.from} · {b.time}
              </Text>
            </View>
          </FadeIn>
        ))}
      </FadeIn>
    </Page>
  );
}
