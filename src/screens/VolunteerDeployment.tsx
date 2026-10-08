import React, { ComponentProps, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAST_STAGE, VolunteerTabParamList, stepLabels, useSession } from '../session';
import { Action, colors, Page, space, styles } from '../components/UI';
import { FadeIn } from '../components/Motion';
import { InfoRow, PriorityBadge, ProgressStepper, Tag, vt } from '../components/VolunteerUI';

type Nav = BottomTabNavigationProp<VolunteerTabParamList, 'Deployment'>;
type IconName = ComponentProps<typeof Ionicons>['name'];

const ISSUES: { label: string; icon: IconName }[] = [
  { label: 'Road blocked', icon: 'warning-outline' },
  { label: 'Need backup', icon: 'people-outline' },
  { label: 'Vehicle problem', icon: 'car-outline' },
  { label: 'Can’t reach location', icon: 'navigate-outline' },
];

/* ---------- Report-issue bottom sheet ---------- */
function IssueSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (label: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(360)).current;

  useEffect(() => {
    if (!open) return;
    slide.setValue(360);
    Animated.timing(slide, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, slide]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,24,40,0.45)' }}>
        <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={{
            transform: [{ translateY: slide }],
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: space.xl,
            paddingBottom: space.xl + insets.bottom,
            gap: space.sm,
          }}
        >
          <Text style={styles.section}>What’s the problem?</Text>
          <Text style={[styles.subtitle, { marginBottom: space.sm }]}>Command will be notified right away.</Text>
          {ISSUES.map((o) => (
            <Pressable
              key={o.label}
              accessibilityRole="button"
              onPress={() => onPick(o.label)}
              style={({ pressed }) => ({
                minHeight: 56,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingHorizontal: space.md,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: pressed ? colors.fill : '#FFFFFF',
              })}
            >
              <Ionicons name={o.icon} size={22} color={colors.danger} />
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.text }}>{o.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          ))}
          <Action label="Cancel" secondary onPress={onClose} />
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---------- Completion card with a pop-in check ---------- */
function CompleteCard({ outcome }: { outcome: string }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start();
  }, [pop]);

  return (
    <FadeIn style={[styles.card, { backgroundColor: vt.tealSoft, borderColor: vt.tealBorder, alignItems: 'center', gap: space.sm }]}>
      <Animated.View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.teal,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pop }],
        }}
      >
        <Ionicons name="checkmark" size={36} color="#FFFFFF" />
      </Animated.View>
      <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.teal }}>Deployment complete</Text>
      <Text style={[styles.subtitle, { textAlign: 'center' }]}>{outcome}</Text>
    </FadeIn>
  );
}

export default function VolunteerDeployment() {
  const navigation = useNavigation<Nav>();
  const { active, advanceDeployment, finishDeployment, reportIssue } = useSession();
  const [sheet, setSheet] = useState(false);

  /* Empty state */
  if (!active) {
    return (
      <Page edges={['top']}>
        <Text style={styles.title}>Active deployment</Text>
        <FadeIn style={[styles.card, { alignItems: 'center', gap: space.md, paddingVertical: space.xl }]}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.fill,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="flag-outline" size={30} color={colors.muted} />
          </View>
          <Text style={styles.section}>No active deployment</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Accept a request from the Home tab and it will show up here.
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            <Action label="View requests" color={colors.teal} onPress={() => navigation.navigate('Hub')} />
          </View>
        </FadeIn>
      </Page>
    );
  }

  const d = active.deployment;
  const stage = active.stage;
  const complete = stage >= LAST_STAGE;

  const nextLabels = ['Mark as arrived', `Start ${d.action.toLowerCase()}`, 'Complete deployment'];
  const hints = [
    'Head to the location, then mark your arrival.',
    'Check the area and the people before you begin.',
    `${d.action} in progress. Complete once everyone is helped.`,
  ];

  const heroBg = d.priority === 'Critical' ? vt.criticalSoft : d.priority === 'High' ? vt.highSoft : colors.surface;
  const heroBorder =
    d.priority === 'Critical' ? vt.criticalBorder : d.priority === 'High' ? vt.highBorder : colors.border;

  function next() {
    if (stage === LAST_STAGE - 1) {
      Alert.alert('Complete deployment?', 'Confirm the task is finished and everyone has been helped.', [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Complete', onPress: advanceDeployment },
      ]);
    } else {
      advanceDeployment();
    }
  }

  function done() {
    finishDeployment();
    navigation.navigate('Hub');
  }

  function pickIssue(label: string) {
    reportIssue(label);
    setSheet(false);
    Alert.alert('Issue reported', 'Command has been notified.');
  }

  return (
    <>
      <Page
        edges={['top']}
        footer={
          complete ? (
            <Action label="Done" color={colors.teal} onPress={done} />
          ) : (
            <>
              <Action label={nextLabels[stage]} color={colors.teal} onPress={next} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setSheet(true)}
                style={({ pressed }) => ({
                  minHeight: 52,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: colors.danger,
                  backgroundColor: pressed ? vt.criticalSoft : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Text style={{ color: colors.danger, fontSize: 16, fontWeight: '700' }}>Report issue</Text>
              </Pressable>
            </>
          )
        }
      >
        <FadeIn>
          <Text style={styles.title}>Active deployment</Text>
        </FadeIn>

        {/* Summary */}
        <FadeIn delay={60} style={[styles.card, { backgroundColor: heroBg, borderColor: heroBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.muted }}>
                DEPLOYMENT #{d.id}
              </Text>
              <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.text }}>{d.title}</Text>
            </View>
            <PriorityBadge priority={d.priority} />
          </View>
          <View style={{ gap: 6 }}>
            <InfoRow icon="location-outline" text={`${d.location} · ${d.distance} away`} />
            <InfoRow icon="people-outline" text={d.people} />
            <InfoRow icon="boat-outline" text={`Access: ${d.access}`} />
          </View>
        </FadeIn>

        {/* Progress */}
        <FadeIn delay={120} style={[styles.card, { gap: space.lg }]}>
          <Text style={styles.section}>Deployment progress</Text>
          <ProgressStepper stage={stage} labels={stepLabels(d)} complete={complete} />
          <Text style={[styles.small, { textAlign: 'center' }]}>
            {complete ? 'All steps finished.' : hints[stage]}
          </Text>
        </FadeIn>

        {/* Briefing */}
        <FadeIn delay={180} style={[styles.card, { gap: space.md }]}>
          <Text style={styles.section}>Situation briefing</Text>
          <Text style={styles.subtitle}>{d.briefing}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {d.tags.map((t) => (
              <Tag key={t} text={t} />
            ))}
          </View>
        </FadeIn>

        {complete && <CompleteCard outcome={d.outcome} />}
      </Page>

      <IssueSheet open={sheet} onClose={() => setSheet(false)} onPick={pickIssue} />
    </>
  );
}