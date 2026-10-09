import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, useSession } from '../session';
import { colors, space, styles } from '../components/UI';
import { FormAction as Action, FormPage as Page, formCard, formTheme } from '../components/reporting/ReportFormUI';
import { CommunityIssueForm } from '../components/reporting/CommunityIssueForm';
import { EmergencyAssistanceForm } from '../components/reporting/EmergencyAssistanceForm';
import { ReportFormHeader } from '../components/reporting/ReportFormHeader';
import { SupplyRequestForm } from '../components/reporting/SupplyRequestForm';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ReportMode = 'choose' | 'community' | 'emergency' | 'supplies';

export default function ReportScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useSession();
  const [mode, setMode] = useState<ReportMode>('choose');
  const back = () => setMode('choose');
  const viewStatus = () => {
    setMode('choose');
    navigation.navigate('ResidentTabs', { screen: 'Status' });
  };

  if (mode === 'emergency') return <EmergencyAssistanceForm onBack={back} onViewStatus={viewStatus} />;
  if (mode === 'supplies') return <SupplyRequestForm onBack={back} onViewStatus={viewStatus} />;
  if (mode === 'community') {
    if (session?.role === 'resident') return <CommunityIssueForm onBack={back} onViewStatus={viewStatus} />;
    return (
      <Page edges={['top']}>
        <ReportFormHeader title="Report Community Issue" onBack={back} />
        <View style={[formCard, { alignItems: 'center', gap: space.md }]}>
          <Ionicons name="lock-closed-outline" size={32} color={colors.blue} />
          <Text style={styles.section}>Sign in to report</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Reports need an account so your barangay can follow up. Emergency assistance is open to everyone.
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            <Action label="Sign in or register" onPress={() => navigation.navigate('Auth', { role: 'resident', destination: 'Report' })} />
          </View>
        </View>
      </Page>
    );
  }

  const options = [
    { mode: 'emergency' as const, title: 'Request Help', description: 'Rescue, medical assistance, or emergency evacuation', icon: 'warning-outline' as const },
    { mode: 'supplies' as const, title: 'Request Supplies', description: 'Food, drinking water, medicine, and household essentials', icon: 'cube-outline' as const },
    { mode: 'community' as const, title: 'Report Community Issue', description: 'Blocked drainage, flooding, infrastructure problems', icon: 'flag-outline' as const },
  ];
  return (
    <Page edges={['top']}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: formTheme.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>RESIDENT SUPPORT</Text>
        <Text style={[styles.title, { fontSize: 24, lineHeight: 30 }]}>How can we help?</Text>
        <Text style={styles.subtitle}>Choose what you need to submit.</Text>
      </View>
      {options.map((option) => (
        <Pressable key={option.mode} accessibilityRole="button"
          accessibilityLabel={`${option.title}. ${option.description}`}
          onPress={() => setMode(option.mode)}
          style={({ pressed }) => [formCard, { minHeight: 120, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: pressed ? formTheme.soft : colors.surface }]}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: formTheme.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={option.icon} size={25} color={formTheme.accent} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.section, { fontSize: 16, lineHeight: 22 }]}>{option.title}</Text>
            <Text style={styles.small}>{option.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={formTheme.accent} />
        </Pressable>
      ))}
    </Page>
  );
}
