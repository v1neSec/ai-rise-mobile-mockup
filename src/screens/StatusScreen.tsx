import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SOS_STEPS, SosStatus, formatTime, useSession } from '../session';
import { colors, Page, styles } from '../components/UI';
import { FadeIn } from '../components/Motion';
import { SUPPLY_OPTIONS } from '../types/supply';

function Timeline({ status }: { status: SosStatus }) {
  const idx = SOS_STEPS.indexOf(status);
  return (
    <View>
      {SOS_STEPS.map((s, i) => {
        const done = i < idx || status === 'Completed';
        const current = i === idx && status !== 'Completed';
        const tint = done ? '#0B9A63' : current ? colors.danger : '#CBD5E1';
        return (
          <View key={s} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: done || current ? tint : '#FFFFFF', borderWidth: 2, borderColor: tint, alignItems: 'center', justifyContent: 'center' }}>
                {done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              {i < SOS_STEPS.length - 1 && <View style={{ width: 2, height: 20, backgroundColor: done ? '#0B9A63' : '#E1E7EF' }} />}
            </View>
            <Text style={{ color: done || current ? colors.text : colors.muted, fontWeight: current ? '800' : '600', fontSize: 14 }}>{s}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function StatusScreen() {
  const { sos, reports, supplies, safeAt } = useSession();

  const notes = [
    ...sos.map((r) => ({ t: r.createdAt, icon: 'alert-circle-outline' as const, text: `${r.id} is now ${r.status.toLowerCase()}.` })),
    ...reports.map((r) => ({ t: r.createdAt, icon: 'document-text-outline' as const, text: `${r.id} ${r.status.toLowerCase()}.` })),
    ...supplies.map((r) => ({ t: r.created_at, icon: 'cube-outline' as const, text: `${r.id} supply request submitted.` })),
    { t: new Date().toISOString(), icon: 'notifications-outline' as const, text: 'Apalit River water level rising. Avoid river banks.' },
  ];

  return (
    <Page edges={['top']}>
      <FadeIn>
        <Text style={styles.title}>My status</Text>
        <Text style={styles.subtitle}>Your rescue requests, supplies, reports and notifications.</Text>
      </FadeIn>

      <FadeIn delay={60} style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <Ionicons name={safeAt ? 'shield-checkmark' : 'shield-outline'} size={28} color={safeAt ? '#0B9A63' : colors.muted} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: colors.text }}>{safeAt ? 'Marked safe' : 'Safety not confirmed'}</Text>
          <Text style={styles.small}>{safeAt ? formatTime(safeAt) : 'Hold “I’m safe” on Home to confirm.'}</Text>
        </View>
      </FadeIn>

      <Text style={styles.label}>Rescue requests</Text>
      {sos.length === 0 ? (
        <View style={styles.card}><Text style={styles.subtitle}>No rescue requests yet.</Text></View>
      ) : (
        sos.map((r, i) => (
          <FadeIn key={r.id} delay={i * 60} style={[styles.card, { gap: 14 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: colors.text }}>{r.id} · {r.nature}</Text>
                <Text style={styles.small}>{formatTime(r.createdAt)} · {r.location}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FDECEF', alignSelf: 'flex-start' }}>
                <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 11 }}>{r.priority}</Text>
              </View>
            </View>
            {r.peopleCount !== undefined && (
              <View style={{ gap: 6 }}>
                <Text style={styles.rowTitle}>{r.peopleCount} {r.peopleCount === 1 ? 'person needs' : 'people need'} help</Text>
                {r.vulnerable.length > 0 && <Text style={styles.small}>Extra care: {r.vulnerable.join(', ')}</Text>}
                <Text style={styles.subtitle}>{r.details.join(' · ')}</Text>
              </View>
            )}
            <Timeline status={r.status} />
          </FadeIn>
        ))
      )}

      <Text style={styles.label}>Supply requests</Text>
      {supplies.length === 0 ? (
        <View style={styles.card}><Text style={styles.subtitle}>No supply requests yet. Use Request Supplies in the Report tab.</Text></View>
      ) : supplies.map((request) => (
        <FadeIn key={request.id} style={[styles.card, { gap: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="cube-outline" size={25} color={colors.teal} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.rowTitle}>Household supply request</Text>
              <Text style={styles.small}>{formatTime(request.created_at)}</Text>
            </View>
            <View style={{ backgroundColor: '#E7F4F1', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 }}>
              <Text style={{ color: colors.teal, fontWeight: '700', fontSize: 11 }}>Awaiting supplies</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{SUPPLY_OPTIONS.filter((option) => request[option.key]).map((option) => option.label).join(' · ') || 'Other supplies'}</Text>
          {!!request.other_supplies && <Text style={styles.subtitle}>{request.other_supplies}</Text>}
          <Text style={styles.small}>Children: {request.childrens} · Elderly: {request.elderly} · PWD: {request.pwd} · Adults: {request.adults}</Text>
          <Text style={styles.small}>Flood: {request.flood_level.replace(/_/g, ' ')} · Medical assistance: {request.medical_assistance ? 'Yes' : 'No'}</Text>
          <Text style={styles.subtitle}>{request.address} · {request.barangay}</Text>
          <Text style={styles.small}>Contact: {request.contact_number}</Text>
          <Text style={styles.small}>Location: {request.location.latitude.toFixed(5)}, {request.location.longitude.toFixed(5)}</Text>
          <Text style={styles.small}>{request.evidence ? 'Photo evidence attached · ' : ''}Awaiting delivery assignment</Text>
          <Text selectable style={styles.small}>{request.id}</Text>
        </FadeIn>
      ))}

      <Text style={styles.label}>Submitted reports</Text>
      {reports.length === 0 ? (
        <View style={styles.card}><Text style={styles.subtitle}>No reports yet. Use the Report tab.</Text></View>
      ) : (
        reports.map((r) => (
          <FadeIn key={r.id} style={[styles.card, { gap: 6 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '800', color: colors.text }}>{r.category}</Text>
              <Text style={{ color: r.status === 'Submitted' ? colors.muted : colors.blue, fontWeight: '700', fontSize: 12 }}>{r.status}</Text>
            </View>
            <Text style={styles.subtitle}>{r.description}</Text>
            <Text style={styles.small}>{r.id} · {formatTime(r.createdAt)}</Text>
          </FadeIn>
        ))
      )}

      <Text style={styles.label}>Notifications</Text>
      <View style={[styles.card, { gap: 14 }]}>
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
