import React, { ComponentProps, useCallback } from 'react';
import { Text, View } from 'react-native';
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
import { Action, colors, Page, space, styles } from '../components/UI';
import { FadeIn } from '../components/Motion';
import {
  AvailabilityPill,
  InfoRow,
  PriorityBadge,
  SwipeToAccept,
  priorityColor,
  vt,
} from '../components/VolunteerUI';

type Nav = BottomTabNavigationProp<VolunteerTabParamList, 'Hub'>;
type IconName = ComponentProps<typeof Ionicons>['name'];

const PROFILE = { vehicle: 'SUV', capacity: '6 persons', location: 'Brgy. San Vicente' };

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
        backgroundColor: colors.fill,
        borderRadius: 12,
        padding: space.md,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={15} color={colors.muted} />
        <Text style={{ fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.muted }}>{label}</Text>
      </View>
      <Text numberOfLines={1} style={{ fontSize: 16, lineHeight: 22, fontWeight: '800', color }}>
        {value}
      </Text>
    </View>
  );
}

function RequestCard({ d, index, onAccept }: { d: Deployment; index: number; onAccept: () => void }) {
  return (
    <FadeIn
      delay={index * 90}
      style={[styles.card, { gap: space.md, overflow: 'hidden', paddingLeft: space.lg + 4 }]}
    >
      {/* priority stripe */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
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
      <SwipeToAccept onAccept={onAccept} />
    </FadeIn>
  );
}

export default function VolunteerHome() {
  const navigation = useNavigation<Nav>();
  const {
    session,
    signOut,
    volunteerOnline,
    setVolunteerOnline,
    requests,
    active,
    acceptRequest,
    broadcasts,
    completedCount,
  } = useSession();

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

  function accept(id: string) {
    acceptRequest(id);
    navigation.navigate('Deployment');
  }

  function logout() {
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
    signOut();
  }

  const complete = !!active && active.stage >= LAST_STAGE;
  const statusText = active ? 'On deployment' : volunteerOnline ? 'Available' : 'Offline';

  return (
    <Page edges={['top']}>
      {/* Header */}
      <FadeIn style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Volunteer Hub</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Hello, {session?.name} · {completedCount} completed
          </Text>
        </View>
        <AvailabilityPill online={volunteerOnline} onToggle={() => setVolunteerOnline(!volunteerOnline)} />
      </FadeIn>

      {/* Profile */}
      <FadeIn delay={60} style={[styles.card, { gap: space.md }]}>
        <Text style={styles.section}>My profile</Text>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Tile icon="car-outline" label="Vehicle" value={PROFILE.vehicle} />
          <Tile icon="people-outline" label="Capacity" value={PROFILE.capacity} />
        </View>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Tile icon="location-outline" label="Location" value={PROFILE.location} />
          <Tile
            icon={active ? 'navigate-outline' : volunteerOnline ? 'radio-button-on' : 'moon-outline'}
            label="Status"
            value={statusText}
            color={volunteerOnline || active ? colors.teal : colors.muted}
          />
        </View>
      </FadeIn>

      {/* Requests */}
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text style={styles.section}>Deployment requests</Text>
          {volunteerOnline && !active && requests.length > 0 && (
            <View
              style={{
                minWidth: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.teal,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{requests.length}</Text>
            </View>
          )}
        </View>

        {active ? (
          <FadeIn style={[styles.card, { backgroundColor: vt.tealSoft, borderColor: vt.tealBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Ionicons name={complete ? 'checkmark-circle' : 'navigate-circle'} size={30} color={colors.teal} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, lineHeight: 22, fontWeight: '800', color: colors.teal }}>
                  {complete ? 'Deployment complete' : 'Deployment in progress'}
                </Text>
                <Text style={styles.small} numberOfLines={2}>
                  {complete
                    ? 'Close it out in the Deployment tab.'
                    : `${active.deployment.title} · ${stepLabels(active.deployment)[active.stage]}`}
                </Text>
              </View>
            </View>
            <Action label="Open deployment" color={colors.teal} onPress={() => navigation.navigate('Deployment')} />
          </FadeIn>
        ) : !volunteerOnline ? (
          <FadeIn style={[styles.card, { alignItems: 'center', gap: space.md }]}>
            <Ionicons name="moon-outline" size={30} color={colors.muted} />
            <Text style={styles.section}>You’re offline</Text>
            <Text style={[styles.subtitle, { textAlign: 'center' }]}>
              Go available to start receiving deployment requests.
            </Text>
            <View style={{ alignSelf: 'stretch' }}>
              <Action label="Go available" color={colors.teal} onPress={() => setVolunteerOnline(true)} />
            </View>
          </FadeIn>
        ) : requests.length === 0 ? (
          <FadeIn style={[styles.card, { alignItems: 'center', gap: space.sm }]}>
            <Ionicons name="checkmark-circle-outline" size={30} color={colors.teal} />
            <Text style={styles.section}>All clear</Text>
            <Text style={[styles.subtitle, { textAlign: 'center' }]}>
              No requests right now. New ones will appear here.
            </Text>
          </FadeIn>
        ) : (
          requests.map((d, i) => <RequestCard key={d.id} d={d} index={i} onAccept={() => accept(d.id)} />)
        )}
      </View>

      {/* Broadcast */}
      <FadeIn delay={120} style={[styles.card, { gap: space.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name="radio-outline" size={20} color={colors.teal} />
          <Text style={styles.section}>Team broadcast</Text>
        </View>
        {broadcasts.length === 0 && <Text style={styles.subtitle}>No messages from your team yet.</Text>}
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
            <Ionicons
              name={b.urgent ? 'megaphone-outline' : 'chatbubble-ellipses-outline'}
              size={20}
              color={b.urgent ? colors.danger : colors.teal}
              style={{ marginTop: 1 }}
            />
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

      <Action label="Sign out" secondary onPress={logout} />
    </Page>
  );
}