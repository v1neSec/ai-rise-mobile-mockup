import React, { ComponentProps, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, formatTime, useSession } from '../session';
import { colors, Page, space, styles } from '../components/UI';
import { Press, Rings } from '../components/Motion';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type IconName = ComponentProps<typeof Ionicons>['name'];

const HOLD_MS = 2000;
const SAFE_SOFT = '#E8F6EF';
const SAFE_BORDER = '#B5E3CC';

/* ---------- Pulsing SOS button ---------- */
function SosButton({ onPress }: { onPress: () => void }) {
  const SIZE = 240;
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Rings color={colors.sos} size={SIZE} count={3} />

      {/* soft glow behind the button */}
      <View
        style={{
          position: 'absolute',
          width: 164,
          height: 164,
          borderRadius: 82,
          backgroundColor: 'rgba(217,45,32,0.12)',
        }}
      />

      <Press
        label="Emergency SOS"
        onPress={onPress}
        style={{
          width: 132,
          height: 132,
          borderRadius: 66,
          backgroundColor: colors.sos,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.sos,
          shadowOpacity: 0.45,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <Text
          maxFontSizeMultiplier={1.2}
          style={{ color: '#FFFFFF', fontSize: 36, lineHeight: 42, fontWeight: '900', letterSpacing: 1 }}
        >
          SOS
        </Text>
      </Press>
    </View>
  );
}

/* ---------- Press-and-hold "I'm safe" button ---------- */
function HoldToConfirm({ onConfirm }: { onConfirm: () => void }) {
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
          minHeight: 88,
          paddingVertical: space.lg,
          paddingHorizontal: space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.lg,
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
            width: 52,
            height: 52,
            borderRadius: 26,
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
          <Text style={{ color: '#E6F7EF', fontSize: 14, lineHeight: 20 }}>
            {holding ? 'Keep holding…' : 'Press and hold for 2 seconds'}
          </Text>
        </View>

        <Ionicons name="hand-left-outline" size={22} color="rgba(255,255,255,0.85)" />
      </Animated.View>
    </Pressable>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={styles.small}>{label}</Text>
      <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.text }}>{value}</Text>
      <Text style={[styles.small, { color: colors.danger, fontWeight: '600' }]}>{note}</Text>
    </View>
  );
}

/* Every InfoCard has the same structure, so a row of them stays equal in height. */
function InfoCard({
  icon,
  title,
  body,
  meta,
  bodyColor = colors.text,
}: {
  icon: IconName;
  title: string;
  body: string;
  meta: string;
  bodyColor?: string;
}) {
  return (
    <View style={[styles.card, { flex: 1, justifyContent: 'space-between', gap: space.md }]}>
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name={icon} size={18} color={colors.muted} />
          <Text
            style={{ flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600', color: colors.muted }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <Text style={{ fontSize: 16, lineHeight: 22, fontWeight: '700', color: bodyColor }} numberOfLines={3}>
          {body}
        </Text>
      </View>
      <Text style={styles.small} numberOfLines={1}>{meta}</Text>
    </View>
  );
}

export default function ResidentHome() {
  const navigation = useNavigation<Nav>();
  const { session, signOut, safeAt, markSafe, clearSafe } = useSession();
  const resident = session?.role === 'resident';

  return (
    <Page edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.text }}>AI-Rise</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {resident ? `Hello, ${session.name}` : 'Browsing as a guest'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={resident ? 'Sign out' : 'Sign in'}
          onPress={() => (resident ? signOut() : navigation.navigate('Auth', { role: 'resident' }))}
          style={({ pressed }) => ({
            minHeight: 48,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: pressed ? colors.fill : '#FFFFFF',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          })}
        >
          <Ionicons name={resident ? 'log-out-outline' : 'log-in-outline'} size={18} color={colors.blue} />
          <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 14 }}>
            {resident ? 'Sign out' : 'Sign in'}
          </Text>
        </Pressable>
      </View>

      {/* 1. Situation */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name="rainy-outline" size={20} color={colors.danger} />
          <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: '700', color: colors.danger }}>
            Flood warning · Apalit
          </Text>
        </View>
        <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.text }}>
          Typhoon Signal No. 2
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: space.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: space.md,
          }}
        >
          <Stat label="Water level" value="8.2 m" note="Rising" />
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <Stat label="Wind speed" value="120 km/h" note="Strong" />
        </View>
      </View>

      {/* 2. Emergency */}
      <View style={[styles.card, { alignItems: 'center', gap: space.sm }]}>
        <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 2 }}>
          <Text style={styles.section}>Request rescue</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Answer 5 quick questions. No sign-in needed.
          </Text>
        </View>

        <SosButton onPress={() => navigation.navigate('Sos')} />

        <Text style={[styles.small, { textAlign: 'center' }]}>
          Tap to start your emergency rescue request
        </Text>
      </View>

      {/* 3. Safety check-in */}
      {safeAt ? (
        <View style={[styles.card, { backgroundColor: SAFE_SOFT, borderColor: SAFE_BORDER }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Ionicons name="shield-checkmark" size={30} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, lineHeight: 24, fontWeight: '800', color: colors.green }}>
                Marked safe
              </Text>
              <Text style={styles.small}>{formatTime(safeAt)} · Location included</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            {[
              { label: 'Undo', onPress: clearSafe, color: colors.text },
              {
                label: 'Send details',
                onPress: () => Alert.alert('Details sent', 'Your contacts have your safety status and location.'),
                color: colors.text,
              },
              { label: 'Need help', onPress: () => navigation.navigate('Sos'), color: colors.danger },
            ].map((b) => (
              <Pressable
                key={b.label}
                accessibilityRole="button"
                onPress={b.onPress}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  backgroundColor: pressed ? colors.fill : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                })}
              >
                <Text style={{ fontWeight: '700', fontSize: 14, color: b.color }} numberOfLines={1}>
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <HoldToConfirm onConfirm={markSafe} />
      )}

      {/* 4. Local info: two equal cards */}
      <View>
        <Text style={[styles.section, { marginBottom: space.md }]}>Near you</Text>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <InfoCard
            icon="notifications-outline"
            title="Latest alert"
            body="Apalit River is rising. Stay away from the banks."
            meta="9:45 PM"
          />
          <InfoCard
            icon="location-outline"
            title="Flood risk"
            body="High risk in your area"
            bodyColor={colors.danger}
            meta="Brgy. Apalit · Low-lying"
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Welcome')}
        style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '600' }}>Switch role</Text>
      </Pressable>
    </Page>
  );
}