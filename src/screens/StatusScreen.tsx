import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SOS_STEPS, SosStatus, formatTime, useSession } from '../session';
import { colors, Page, styles } from '../components/UI';
import { FadeIn } from '../components/Motion';

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
  const { sos, reports, safeAt } = useSession();

  const notes = [
    ...sos.map((r) => ({ t: r.createdAt, icon: 'alert-circle-outline' as const, text: `${r.id} is now ${r.status.toLowerCase()}.` })),
    ...reports.map((r) => ({ t: r.createdAt, icon: 'document-text-outline' as const, text: `${r.id} ${r.status.toLowerCase()}.` })),
    { t: new Date().toISOString(), icon: 'notifications-outline' as const, text: 'Apalit River water level rising. Avoid river banks.' },
  ];

  return (
    <Page edges={['top']}>
      <FadeIn>
        <Text style={styles.title}>My status</Text>
        <Text style={styles.subtitle}>Your rescue requests, reports and notifications.</Text>
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
            <Timeline status={r.status} />
          </FadeIn>
        ))
      )}

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