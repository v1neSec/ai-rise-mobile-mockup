import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, formatTime, useSession } from '../session';
import { Action, colors, Page, styles } from '../components/UI';
import { FadeIn } from '../components/Motion';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/AppChrome';
import { SUPPLY_OPTIONS } from '../types/supply';
import { rescueService } from '../services/rescueService';
import { supplyService, BackendSupply } from '../services/supplyService';
import { communityReportService } from '../services/communityReportService';
import type { Rescue } from '../types/rescue';
import type { CommunityReport } from '../types/report';
import { getApiErrorMessage } from '../api/api';

export default function StatusScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { safeAt, session } = useSession();
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [supplies, setSupplies] = useState<BackendSupply[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useFocusEffect(useCallback(() => {
    void refresh;
    if (!session?.userId) { setLoading(false); return; }
    let alive = true;
    setLoading(true); setError('');
    Promise.all([rescueService.getMyRescues(), supplyService.getMyRequests(), communityReportService.getReports()])
      .then(([r, s, c]) => { if (!alive) return; setRescues(r); setSupplies(s); setReports(c.filter((item) => item.user === session?.userId)); })
      .catch((cause) => { if (alive) setError(getApiErrorMessage(cause)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [session?.userId, refresh]));

  const notes = [
    ...rescues.map((r) => ({ t: r.created_at, icon: 'alert-circle-outline' as const, text: `Rescue ${r.id} · ${r.status.replace(/_/g, ' ')}.` })),
    ...reports.map((r) => ({ t: r.created_at, icon: 'document-text-outline' as const, text: `Report ${r.id} · ${r.status.toLowerCase()}.` })),
    ...supplies.map((r) => ({ t: r.created_at, icon: 'cube-outline' as const, text: `Supply request ${r.id} · ${r.status.replace(/_/g, ' ')}.` })),
  ].sort((a, b) => b.t.localeCompare(a.t));

  if (!session) return <Page edges={['top']}><ScreenHeader title="My status" onBack={() => navigation.navigate('ResidentTabs', { screen: 'Home' })} /><View style={styles.card}><Text style={styles.section}>Sign in to view your status</Text><Text style={styles.subtitle}>Your rescue, supply, and report updates are linked to your account.</Text><Action label="Sign in" onPress={() => navigation.navigate('Auth', { role: 'resident' })} /></View></Page>;

  return (
    <Page edges={['top']}>
      <FadeIn>
        <ScreenHeader title="My status" onBack={() => navigation.navigate('ResidentTabs', { screen: 'Home' })} />
        <Text style={styles.subtitle}>Your rescue requests, supplies, reports and notifications.</Text>
        {loading && <ActivityIndicator color={colors.blue} />}
        {!!error && <View style={styles.card}><Text style={{ color: colors.danger }}>{error}</Text><Pressable onPress={() => setRefresh((n) => n + 1)}><Text style={{ color: colors.blue, fontWeight: '700', marginTop: 8 }}>Try again</Text></Pressable></View>}
      </FadeIn>

      <FadeIn delay={60} style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <Ionicons name={safeAt ? 'shield-checkmark' : 'shield-outline'} size={28} color={safeAt ? '#0B9A63' : colors.muted} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: colors.text }}>{safeAt ? 'Marked safe' : 'Safety not confirmed'}</Text>
          <Text style={styles.small}>{safeAt ? formatTime(safeAt) : 'Hold “I’m safe” on Home to confirm.'}</Text>
        </View>
      </FadeIn>

      <Text style={styles.label}>Rescue requests</Text>
      {rescues.length === 0 ? (
        <View style={styles.card}><Text style={styles.subtitle}>No rescue requests yet.</Text></View>
      ) : (
        rescues.map((r, i) => (
          <FadeIn key={r.id} delay={i * 60} style={[styles.card, { gap: 14 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: colors.text }}>Rescue request · #{r.id}</Text>
                <Text style={styles.small}>{formatTime(r.created_at)} · {r.address}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FDECEF', alignSelf: 'flex-start' }}>
                <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 11 }}>{r.status === 'rescued' ? 'RESCUED' : r.rescuer ? 'ASSIGNED' : 'PENDING'}</Text>
              </View>
            </View>
            {(r.childrens + r.elderly + r.pwd + r.adults) > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={styles.rowTitle}>{r.childrens + r.elderly + r.pwd + r.adults} people need help</Text>
                <Text style={styles.small}>Children: {r.childrens} · Elderly: {r.elderly} · PWD: {r.pwd} · Adults: {r.adults}</Text>
                <Text style={styles.subtitle}>Flood level: {r.flood_level.replace(/_/g, ' ')} · Medical: {r.medical_assistance ? 'Yes' : 'No'}</Text>
              </View>
            )}
            <Text style={styles.small}>Current backend status: {r.status.replace(/_/g, ' ')}{r.rescuer ? ` · assigned to ${r.rescuer.first_name || r.rescuer.username}` : ''}</Text>
          </FadeIn>
        ))
      )}

      <Text style={styles.label}>Supply requests</Text>
      {supplies.length === 0 ? (
        <View style={styles.card}><Text style={styles.subtitle}>No supply requests yet. Choose Request Supplies from the home menu.</Text></View>
      ) : supplies.map((request) => (
        <FadeIn key={request.id} style={[styles.card, { gap: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="cube-outline" size={25} color={colors.blue} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.rowTitle}>Household supply request</Text>
          <Text style={styles.small}>{formatTime(request.created_at)}</Text>
            </View>
            <View style={{ backgroundColor: '#EAF1FA', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 }}>
              <Text style={{ color: colors.teal, fontWeight: '700', fontSize: 11 }}>{request.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{SUPPLY_OPTIONS.filter((option) => request[option.key]).map((option) => option.label).join(' · ') || 'Other supplies'}</Text>
          {!!request.other_supplies && <Text style={styles.subtitle}>{request.other_supplies}</Text>}
          <Text style={styles.small}>Children: {request.childrens} · Elderly: {request.elderly} · PWD: {request.pwd} · Adults: {request.adults}</Text>
          <Text style={styles.small}>Flood: {request.flood_level.replace(/_/g, ' ')} · Medical assistance: {request.medical_assistance ? 'Yes' : 'No'}</Text>
          <Text style={styles.subtitle}>{request.address} · {request.barangay}</Text>
          <Text style={styles.small}>Contact: {request.contact_number}</Text>
          <Text style={styles.small}>Location: {request.location.lat.toFixed(5)}, {request.location.lng.toFixed(5)}</Text>
          <Text style={styles.small}>{request.evidence ? 'Photo evidence attached · ' : ''}{request.deliverer ? `Assigned to ${request.deliverer.username}` : 'Waiting for an available volunteer'}</Text>
          <Text selectable style={styles.small}>{request.id}</Text>
        </FadeIn>
      ))}

      <Text style={styles.label}>Submitted reports</Text>
      {reports.length === 0 ? (
        <View style={styles.card}><Text style={styles.subtitle}>No reports yet. Choose Report Community Issue from the home menu.</Text></View>
      ) : (
        reports.map((r) => (
          <FadeIn key={r.id} style={[styles.card, { gap: 6 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '800', color: colors.text }}>{r.category}</Text>
              <Text style={{ color: r.status === 'PENDING' ? colors.muted : colors.blue, fontWeight: '700', fontSize: 12 }}>{r.status}</Text>
            </View>
            <Text style={styles.subtitle}>{r.description}</Text>
            <Text style={styles.small}>{r.id} · {formatTime(r.created_at)} · {r.address}</Text>
          </FadeIn>
        ))
      )}

      <Text style={styles.label}>Notifications</Text>
      <View style={[styles.card, { gap: 14 }]}>
        {notes.length === 0 && <Text style={styles.subtitle}>No request updates yet.</Text>}
        {notes.map((n, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Ionicons name={n.icon} size={18} color={colors.blue} />
            <Text style={[styles.subtitle, { flex: 1, color: colors.text }]}>{n.text}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}
