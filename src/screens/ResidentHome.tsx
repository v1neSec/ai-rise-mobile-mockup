import React, { ComponentProps, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, formatTime, useSession } from '../session';
import { colors, space, styles } from '../components/UI';
import { AppBackground, HomeHeader } from '../components/AppChrome';
import { useAppPanels } from '../components/FloatingMenu';
import { Press, Rings } from '../components/Motion';
import { dashboardService } from '../services/dashboardService';
import type { FloodPrediction } from '../types/dashboard';
import * as Location from 'expo-location';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type IconName = ComponentProps<typeof Ionicons>['name'];

const HOLD_MS = 2000;
const SAFE_SOFT = '#E4F0ED';
const SAFE_BORDER = '#BBDDD4';
const SAFE_ACCENT = '#309B76';

/* ---------- Pulsing SOS button ---------- */
function SosButton({ onPress, size }: { onPress: () => void; size: number }) {
  const buttonSize = Math.min(132, Math.max(56, size * 0.62));
  const glowSize = buttonSize * 1.24;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Rings color={colors.sos} size={size} count={3} />

      {/* soft glow behind the button */}
      <View
        style={{
          position: 'absolute',
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: 'rgba(217,45,32,0.12)',
        }}
      />

      <Press
        label="Emergency SOS"
        onPress={onPress}
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: colors.sos,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.sos,
          shadowOpacity: 0.16,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }}
      >
        <Text
          maxFontSizeMultiplier={1.2}
          style={{ color: '#FFFFFF', fontSize: Math.min(36, buttonSize * 0.3), fontWeight: '900', letterSpacing: 1 }}
        >
          SOS
        </Text>
      </Press>
    </View>
  );
}

function RescueCard({ onPress }: { onPress: () => void }) {
  const [bounds, setBounds] = useState({ width: 320, height: 240 });
  const horizontal = bounds.height < 170;
  // Short screens keep the action beside its label instead of clipping the button.
  const size = Math.max(64, Math.min(240, bounds.width - 24, bounds.height - (horizontal ? 18 : 70)));

  return (
    <View
      onLayout={({ nativeEvent }) => setBounds({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })}
      style={[styles.card, {
        flex: 1,
        minHeight: 82,
        padding: 8,
        gap: 4,
        flexDirection: horizontal ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }]}
    >
      <View style={{ flex: horizontal ? 1 : undefined, alignItems: horizontal ? 'flex-start' : 'center', gap: 4 }}>
        <Text style={styles.section}>Request rescue</Text>
        {horizontal && <Text style={styles.small}>Tap SOS to request help</Text>}
      </View>
      <View style={{ flex: horizontal ? undefined : 1, alignItems: 'center', justifyContent: 'center' }}>
        <SosButton onPress={onPress} size={size} />
      </View>
      {!horizontal && (
        <Text style={[styles.small, { textAlign: 'center', fontSize: 12, lineHeight: 16 }]} numberOfLines={1}>
          Tap to start your emergency rescue request
        </Text>
      )}
    </View>
  );
}

/* ---------- Press-and-hold "I'm safe" button ---------- */
function HoldToConfirm({ onConfirm, compact }: { onConfirm: () => void; compact: boolean }) {
  const fill = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const done = useRef(false);
  const [holding, setHolding] = useState(false);

  function springTo(n: number) {
    Animated.spring(scale, { toValue: n, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }

  function start() {
    done.current = false;
    setHolding(true);
    springTo(0.97);
    anim.current = Animated.timing(fill, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.current.start(({ finished }) => {
      if (!finished) return;
      done.current = true;
      setHolding(false);
      springTo(1);
      fill.setValue(0);
      onConfirm();
    });
  }

  function cancel() {
    if (done.current) return;
    anim.current?.stop();
    setHolding(false);
    springTo(1);
    Animated.timing(fill, { toValue: 0, duration: 220, useNativeDriver: false }).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="I'm safe"
      accessibilityHint="Press and hold for two seconds to confirm"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={onConfirm}
      onPressIn={start}
      onPressOut={cancel}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          backgroundColor: colors.green,
          borderRadius: 20,
          overflow: 'hidden',
          minHeight: compact ? 76 : 88,
          paddingVertical: compact ? space.md : space.lg,
          paddingHorizontal: space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? space.md : space.lg,
        }}
      >
        {/* progress fill */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: 'rgba(255,255,255,0.28)',
          }}
        />

        {/* icon ring */}
        <View
          style={{
            width: compact ? 44 : 52,
            height: compact ? 44 : 52,
            borderRadius: compact ? 22 : 26,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.7)',
            backgroundColor: 'rgba(255,255,255,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={holding ? 'shield-checkmark' : 'finger-print'} size={28} color="#FFFFFF" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 19, lineHeight: 25, fontWeight: '800' }}>
            I’m safe
          </Text>
          <Text style={{ color: '#E6F7EF', fontSize: compact ? 12 : 14, lineHeight: compact ? 18 : 20 }}>
            {holding ? 'Keep holding…' : 'Press and hold for 2 seconds'}
          </Text>
        </View>

        <Ionicons name="hand-left-outline" size={22} color="rgba(255,255,255,0.85)" />
      </Animated.View>
    </Pressable>
  );
}

function Stat({ label, value, note, compact }: { label: string; value: string; note: string; compact: boolean }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[styles.small, { fontSize: 12, lineHeight: 16 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text accessibilityLabel={`${value}, ${note}`} style={{ fontSize: compact ? 18 : 20, lineHeight: 24, fontWeight: '800', color: colors.text }}>{value}</Text>
        <Text style={{ flexShrink: 1, fontSize: 11, lineHeight: 16, color: colors.danger, fontWeight: '600' }} numberOfLines={1}>
          {note === 'Rising' ? '↑' : note}
        </Text>
      </View>
    </View>
  );
}

/* Every InfoCard has the same structure, so a row of them stays equal in height. */
function InfoCard({
  icon,
  title,
  body,
  meta,
  compact,
  tight,
  bodyColor = colors.text,
}: {
  icon: IconName;
  title: string;
  body: string;
  meta: string;
  compact: boolean;
  tight: boolean;
  bodyColor?: string;
}) {
  return (
    <View style={[styles.card, { flex: 1, padding: tight ? 6 : compact ? 8 : 12, justifyContent: 'space-between', gap: 4 }]}>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={icon} size={18} color={colors.muted} />
          <Text
            style={{ flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.muted }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <Text style={{ fontSize: compact ? 12 : 14, lineHeight: compact ? 16 : 18, fontWeight: '700', color: bodyColor }} numberOfLines={2}>
          {body}
        </Text>
      </View>
      {!tight && <Text style={[styles.small, { fontSize: 11, lineHeight: 14 }]} numberOfLines={1}>{meta}</Text>}
    </View>
  );
}

export default function ResidentHome() {
  const navigation = useNavigation<Nav>();
  const { safeAt, markSafe } = useSession();
  const [contentHeight, setContentHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const compact = contentHeight > 0 && contentHeight < 650;
  const tight = contentHeight > 0 && contentHeight < 600;
  const { showProfile, showUpdates } = useAppPanels();
  const [flood, setFlood] = useState<FloodPrediction | null>(null);
  const [floodUnavailable, setFloodUnavailable] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState('');
  useEffect(() => {
    let alive = true;
    dashboardService.getWeeklyFloodInsights().then((insights) => {
      const summary = typeof insights.summary === 'string' ? insights.summary : Array.isArray(insights.insights) && typeof insights.insights[0] === 'string' ? insights.insights[0] : '';
      if (alive) setWeeklySummary(summary);
    }).catch(() => {});
    dashboardService.getAllFloodPredictions().then(async (response) => {
      if (!alive) return;
      const predictions = [...response.predictions].sort((a, b) => b.flood_probability_pct - a.flood_probability_pct);
      let selected = predictions[0] ?? null;
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.status === 'granted') {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          selected = await dashboardService.getFloodPredictionByLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
      } catch { /* Use the public all-barangay forecast if local prediction is unavailable. */ }
      if (alive) setFlood(selected);
    }).catch(() => { if (alive) setFloodUnavailable(true); });
    return () => { alive = false; };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBackground />
      <View
        onLayout={({ nativeEvent }) => setContentHeight(nativeEvent.layout.height - 90 - insets.bottom)}
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
          paddingHorizontal: compact ? 16 : 20,
          paddingVertical: tight ? 4 : compact ? 6 : 8,
          paddingBottom: 90 + insets.bottom,
          gap: tight ? 4 : compact ? 6 : 10,
        }}
      >
        <HomeHeader role="Resident" onProfile={showProfile} onUpdates={showUpdates} />

        {/* 1. Situation */}
        <View style={[styles.card, { padding: tight ? 6 : compact ? 8 : 12, gap: 4 }]}>
          {!tight && <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Ionicons name="rainy-outline" size={16} color={colors.danger} />
            <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.danger }}>
              {flood ? `Flood outlook · ${flood.barangay}` : 'Flood outlook'}
            </Text>
          </View>}
          <Text accessibilityLabel="Flood warning in Apalit, Typhoon Signal Number 2" style={{ fontSize: compact ? 18 : 20, lineHeight: 24, fontWeight: '800', color: colors.text }}>
            {flood?.predicted_flood_label ?? (floodUnavailable ? 'Forecast unavailable' : 'Loading forecast…')}
          </Text>
          {tight ? (
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: colors.danger, fontWeight: '700' }}>Flood chance · {flood ? `${flood.flood_probability_pct}%` : '—'}</Text>
              <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: colors.text, fontWeight: '700' }}>Rain · {flood?.predicted_tomorrow_rainfall_mm ?? '—'} mm</Text>
            </View>
          ) : <View
            style={{
              flexDirection: 'row',
              gap: space.lg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 4,
            }}
          >
            <Stat label="Flood probability" value={flood ? `${flood.flood_probability_pct}%` : '—'} note={flood?.used_live_weather ? 'Live weather' : 'Forecast'} compact={compact} />
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <Stat label="Tomorrow rainfall" value={flood?.predicted_tomorrow_rainfall_mm != null ? `${flood.predicted_tomorrow_rainfall_mm} mm` : '—'} note="Prediction" compact={compact} />
          </View>}
        </View>

        {/* 2. Local info: two equal cards */}
        <View style={{ flexDirection: 'row', gap: compact ? 8 : space.md }}>
          <InfoCard
            icon="notifications-outline"
            title="Latest alert"
            body={weeklySummary || (floodUnavailable ? 'Flood outlook is temporarily unavailable.' : flood ? `${flood.predicted_flood_label} · ${flood.flood_probability_pct}% forecast chance` : 'Loading flood outlook…')}
            meta={weeklySummary ? 'Weekly AI outlook' : flood ? `Forecast · ${flood.barangay}` : 'Dashboard forecast'}
            compact={compact}
            tight={tight}
          />
          <InfoCard
            icon="location-outline"
            title="Flood risk"
            body={flood ? `${flood.predicted_flood_label} · ${flood.flood_probability_pct}%` : 'Forecast unavailable'}
            bodyColor={colors.danger}
            meta={flood?.barangay ?? 'Barangay data'}
            compact={compact}
            tight={tight}
          />
        </View>

        {/* 3. Safety check-in */}
        {safeAt ? (
          <View style={[styles.card, { backgroundColor: SAFE_SOFT, borderColor: SAFE_BORDER, borderRadius: 22, padding: compact ? 8 : 12, gap: compact ? 6 : 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 8 : space.md }}>
              <View style={{ width: compact ? 40 : 48, height: compact ? 40 : 48, borderRadius: 15, backgroundColor: '#C9E3DB', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="shield-checkmark-outline" size={28} color={SAFE_ACCENT} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text accessibilityLiveRegion="polite" style={{ fontSize: compact ? 19 : 21, lineHeight: compact ? 24 : 27, fontWeight: '800', color: SAFE_ACCENT }}>
                  Marked Safe
                </Text>
                <Text style={[styles.small, { color: '#7A889D', fontSize: compact ? 11 : 12, lineHeight: 16 }]} numberOfLines={compact ? 1 : 2}>
                  {new Date(safeAt).toDateString() === new Date().toDateString()
                    ? `Today, ${new Date(safeAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : formatTime(safeAt)} · Location included
                </Text>
              </View>
              <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#77BBA3' }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                {
                  label: 'Send detail message',
                  onPress: () => Alert.alert('Safety update', 'Your status is marked safe. You can review it in Status.'),
                  color: SAFE_ACCENT,
                  background: '#CCE4DD',
                  border: '#AED6CA',
                },
                { label: 'Need Assistance', onPress: () => navigation.navigate('Sos'), color: '#6C788B', background: '#FFFFFF', border: '#FFFFFF' },
              ].map((b) => (
                <Pressable
                  key={b.label}
                  accessibilityRole="button"
                  onPress={b.onPress}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 48,
                    borderRadius: 13,
                    borderWidth: 1,
                    borderColor: b.border,
                    backgroundColor: b.background,
                    opacity: pressed ? 0.75 : 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 8,
                    paddingVertical: compact ? 6 : 10,
                  })}
                >
                  <Text style={{ fontWeight: '700', fontSize: compact ? 12 : 13, lineHeight: compact ? 16 : 18, color: b.color, textAlign: 'center' }}>
                    {b.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <HoldToConfirm onConfirm={markSafe} compact={compact} />
        )}

        {/* 4. Emergency: uses the space remaining above the floating menu. */}
        <RescueCard onPress={() => navigation.navigate('Sos')} />
      </View>
    </SafeAreaView>
  );
}
