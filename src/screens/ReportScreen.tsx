import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList, useSession } from '../session';
import { colors, space, styles } from '../components/UI';
import { FormAction as Action, FormPage as Page, formCard } from '../components/reporting/ReportFormUI';
import { CommunityIssueForm } from '../components/reporting/CommunityIssueForm';
import { EmergencyAssistanceForm } from '../components/reporting/EmergencyAssistanceForm';
import { ReportFormHeader } from '../components/reporting/ReportFormHeader';
import { SupplyRequestForm } from '../components/reporting/SupplyRequestForm';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Report'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// The menu selects a form directly; there is no intermediate report options page.
export default function ReportScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<TabParamList, 'Report'>>();
  const { session } = useSession();
  // Sign-in can return to this route without parameters for community reporting.
  const mode = route.params?.mode ?? 'community';
  const back = () => navigation.navigate('Home');
  const viewStatus = () => navigation.navigate('Status');

  if (mode === 'emergency') return <EmergencyAssistanceForm key={route.params?.entry} onBack={back} onViewStatus={viewStatus} />;
  if (mode === 'supplies') return <SupplyRequestForm key={route.params?.entry} onBack={back} onViewStatus={viewStatus} />;
  if (session?.role === 'resident') return <CommunityIssueForm key={route.params?.entry} onBack={back} onViewStatus={viewStatus} />;

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
