import React, { ComponentProps, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LAST_STAGE, VolunteerTabParamList, stepLabels, useSession } from '../session';
import { colors, Page, space, styles } from '../components/UI';
import { FadeIn } from '../components/Motion';
import { SuccessConfirmation } from '../components/SuccessConfirmation';
import { ScreenHeader } from '../components/AppChrome';
import { BottomSheet } from '../components/BottomSheet';
import { InfoRow, PriorityBadge, ProgressStepper, Tag, vt, volunteerCard, VolunteerAction, VolunteerHeader, VolunteerIconButton } from '../components/VolunteerUI';

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
  return (
    <BottomSheet title="What’s the problem?" open={open} onClose={onClose}>
      <Text style={[styles.subtitle, { marginBottom: space.sm }]}>Choose the issue affecting your deployment.</Text>
    {ISSUES.map((o) => (
      <Pressable
        key={o.label}
        accessibilityRole="button"
        onPress={() => onPick(o.label)}
        style={({ pressed }) => ({
          minHeight: 64,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          paddingHorizontal: space.md,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: vt.blueBorder,
          backgroundColor: pressed ? vt.blueSoft : '#FFFFFF',
        })}
      >
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: vt.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={o.icon} size={21} color={colors.blue} />
        </View>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.text }}>{o.label}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    ))}
    <VolunteerAction label="Cancel" secondary onPress={onClose} />
    </BottomSheet>
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
        <ScreenHeader title="Active deployment" onBack={() => navigation.navigate('Hub')} />
        <FadeIn style={[volunteerCard, { alignItems: 'center', paddingVertical: 28 }]}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: vt.blueSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="flag-outline" size={30} color={colors.blue} />
          </View>
          <Text style={styles.section}>No active deployment</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Accept a request from the Home tab and it will show up here.
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            <VolunteerAction label="View requests" onPress={() => navigation.navigate('Hub')} />
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
    Alert.alert('Issue reported', 'Added to your team broadcast.');
  }

  if (complete) {
    return (
      <Page edges={['top']} footer={<VolunteerAction label="Done" icon="checkmark-circle-outline" onPress={done} />}>
        <SuccessConfirmation title="Deployment complete" message="Thank you for helping your community." />
        <View style={volunteerCard}>
          <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '700' }}>DEPLOYMENT #{d.id}</Text>
          <Text style={styles.section}>{d.title}</Text>
          <Text style={styles.subtitle}>{d.outcome}</Text>
          <InfoRow icon="location-outline" text={d.location} />
          <ProgressStepper stage={stage} labels={stepLabels(d)} complete />
        </View>
      </Page>
    );
  }

  return (
    <>
      <Page
        edges={['top']}
        footer={<>
          <VolunteerAction label={nextLabels[stage]} onPress={next} />
          <VolunteerAction label="Report issue" icon="flag-outline" secondary onPress={() => setSheet(true)} />
        </>}
      >
        <FadeIn>
          <VolunteerHeader title="Active deployment" subtitle="Follow your assignment, one step at a time."
            action={<VolunteerIconButton icon="home-outline" label="Back to volunteer home" onPress={() => navigation.navigate('Hub')} />} />
        </FadeIn>

        {/* Summary */}
        <FadeIn delay={60} style={volunteerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.blue }}>
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
        <FadeIn delay={120} style={[volunteerCard, { gap: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[styles.section, { flex: 1 }]}>Deployment progress</Text>
            <View style={{ borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: vt.blueSoft }}>
              <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '700' }}>{`${stage + 1} / ${stepLabels(d).length}`}</Text>
            </View>
          </View>
          <ProgressStepper stage={stage} labels={stepLabels(d)} complete={false} />
          <Text style={[styles.small, { textAlign: 'center', backgroundColor: vt.blueSoft, padding: 12, borderRadius: 12 }]}>
            {hints[stage]}
          </Text>
        </FadeIn>

        {/* Briefing */}
        <FadeIn delay={180} style={volunteerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="document-text-outline" size={20} color={colors.blue} />
            <Text style={styles.section}>Situation briefing</Text>
          </View>
          <Text style={styles.subtitle}>{d.briefing}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {d.tags.map((t) => (
              <Tag key={t} text={t} />
            ))}
          </View>
        </FadeIn>

      </Page>

      <IssueSheet open={sheet} onClose={() => setSheet(false)} onPick={pickIssue} />
    </>
  );
}
