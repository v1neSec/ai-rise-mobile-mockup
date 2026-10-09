import React, { ComponentProps, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space } from './UI';
import { Press, Rings } from './Motion';
import { softCard } from './AppChrome';

type IconName = ComponentProps<typeof Ionicons>['name'];

/* Volunteer-only tints. */
export const vt = {
  blueSoft: '#EDF3FF',
  blueBorder: '#D8E4F5',
  criticalSoft: '#FDECEA',
  criticalBorder: '#F4C7C3',
  highSoft: '#FFF3E0',
  highBorder: '#F5D9AE',
  highText: '#B45309',
  mediumSoft: '#E8F0FD',
  mediumBorder: '#C9DAF7',
};

export const volunteerCard = StyleSheet.create({
  card: {
    ...softCard,
    padding: 18,
    gap: 16,
  },
}).card;

export function VolunteerHeader({ title, subtitle, action }: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{subtitle}</Text>
      </View>
      {action}
    </View>
  );
}

export function VolunteerAction({ label, onPress, secondary = false, icon }: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  icon?: IconName;
}) {
  return (
    <Press label={label} onPress={onPress} style={{
      minHeight: 54, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: secondary ? vt.blueSoft : colors.blue,
      borderColor: secondary ? vt.blueBorder : colors.blue, borderWidth: 1,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      {icon && <Ionicons name={icon} size={20} color={secondary ? colors.blue : '#FFFFFF'} />}
      <Text style={{ flexShrink: 1, textAlign: 'center', color: secondary ? colors.blue : '#FFFFFF', fontSize: 15, lineHeight: 22, fontWeight: '700' }}>{label}</Text>
      {!secondary && !icon && <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />}
    </Press>
  );
}

export function VolunteerIconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Press label={label} onPress={onPress} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={22} color={colors.text} />
    </Press>
  );
}

/* Accent color per priority (used for badges and card stripes). */
export function priorityColor(priority: 'Medium' | 'High' | 'Critical') {
  return { Critical: colors.danger, High: vt.highText, Medium: colors.blue }[priority];
}

/* ---------- Priority badge ---------- */
export function PriorityBadge({ priority }: { priority: 'Medium' | 'High' | 'Critical' }) {
  const map = {
    Critical: { bg: vt.criticalSoft, border: vt.criticalBorder, fg: colors.danger },
    High: { bg: vt.highSoft, border: vt.highBorder, fg: vt.highText },
    Medium: { bg: vt.mediumSoft, border: vt.mediumBorder, fg: colors.blue },
  }[priority];
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 14,
        borderWidth: 1,
        backgroundColor: map.bg,
        borderColor: map.border,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: map.fg, fontWeight: '800', fontSize: 12, lineHeight: 16 }}>{priority}</Text>
    </View>
  );
}

/* ---------- Icon + text row ---------- */
export function InfoRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.muted }}>{text}</Text>
    </View>
  );
}

export function Tag({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: vt.blueSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.blue }}>{text}</Text>
    </View>
  );
}

/* ---------- Availability toggle pill ---------- */
export function AvailabilityPill({ online, onToggle }: { online: boolean; onToggle: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!online) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [online, pulse]);

  return (
    <Press
      label={`Availability: ${online ? 'Available' : 'Offline'}. Tap to switch.`}
      onPress={onToggle}
      style={{
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: online ? vt.blueBorder : colors.border,
        backgroundColor: online ? vt.blueSoft : colors.fill,
      }}
    >
      <Animated.View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: online ? colors.blue : colors.muted,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }),
        }}
      />
      <Text style={{ fontSize: 14, fontWeight: '800', color: online ? colors.blue : colors.muted }}>
        {online ? 'Available' : 'Offline'}
      </Text>
      <Ionicons name="swap-horizontal" size={16} color={online ? colors.blue : colors.muted} />
    </Press>
  );
}

/* ---------- Swipe to accept ----------
 * Fixes vs. the old version:
 *  - The WHOLE track is the drag target (before, only the 52px thumb was, so a
 *    swipe that started anywhere else fell through to the screen/back gesture).
 *  - Captures the gesture early and refuses to hand it back, so the parent
 *    ScrollView / navigator can't steal it mid-swipe.
 *  - Only starts on a mostly-horizontal move, so vertical scrolling still works
 *    when you touch the card.
 *  - Also accepts a quick flick (velocity), not only a long drag.
 *  - Shows a clear "Accepted" state before firing onAccept.
 */
const THUMB = 52;
const PAD = 4;
const TRACK_H = THUMB + PAD * 2;

export function SwipeToAccept({
  label = 'Swipe to accept',
  doneLabel = 'Accepted',
  onAccept,
  color = colors.blue,
}: {
  label?: string;
  doneLabel?: string;
  onAccept: () => void;
  color?: string;
}) {
  const [width, setWidth] = useState(0);
  const [accepted, setAccepted] = useState(false);

  const x = useRef(new Animated.Value(0)).current;
  const grab = useRef(new Animated.Value(0)).current; // 0 = idle, 1 = being dragged
  const hint = useRef(new Animated.Value(0)).current; // chevron shimmer
  const nudge = useRef(new Animated.Value(0)).current; // little "try me" wiggle

  const busy = useRef(false);
  const acceptRef = useRef(onAccept);
  const maxRef = useRef(1);

  acceptRef.current = onAccept;
  const max = Math.max(width - THUMB - PAD * 2, 1);
  maxRef.current = max;

  /* Idle animations (skipped if the user prefers reduced motion). */
  useEffect(() => {
    let cancelled = false;
    let shimmer: Animated.CompositeAnimation | null = null;
    let wiggle: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      shimmer = Animated.loop(
        Animated.timing(hint, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
      );
      shimmer.start();

      // Thumb nudges right every few seconds to show it can be dragged.
      wiggle = Animated.loop(
        Animated.sequence([
          Animated.delay(2600),
          Animated.timing(nudge, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(nudge, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      wiggle.start();
    });

    return () => {
      cancelled = true;
      shimmer?.stop();
      wiggle?.stop();
    };
  }, [hint, nudge]);

  function release(triggered: boolean) {
    Animated.timing(grab, { toValue: 0, duration: 140, useNativeDriver: true }).start();
    if (triggered) {
      busy.current = true;
      setAccepted(true);
      Animated.timing(x, {
        toValue: maxRef.current,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        acceptRef.current();
        setTimeout(() => {
          x.setValue(0);
          setAccepted(false);
          busy.current = false;
        }, 700);
      });
    } else {
      Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 10, speed: 14 }).start();
    }
  }

  const pan = useRef(
    PanResponder.create({
      // Claim touches that begin on the track (so taps don't leak through)...
      onStartShouldSetPanResponder: () => !busy.current,
      // ...and win horizontal moves before any parent (ScrollView, navigator) can.
      onMoveShouldSetPanResponder: (_, g) => !busy.current && Math.abs(g.dx) > Math.abs(g.dy),
      onMoveShouldSetPanResponderCapture: (_, g) => !busy.current && Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy),
      // Never give the gesture back once we have it.
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: () => {
        Animated.timing(grab, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => {
        if (busy.current) return;
        x.setValue(Math.min(Math.max(g.dx, 0), maxRef.current));
      },
      onPanResponderRelease: (_, g) => {
        if (busy.current) return;
        const farEnough = g.dx >= maxRef.current * 0.7;
        const flicked = g.vx > 0.8 && g.dx > maxRef.current * 0.3;
        release(farEnough || flicked);
      },
      onPanResponderTerminate: () => {
        if (!busy.current) release(false);
      },
    }),
  ).current;

  const labelOpacity = x.interpolate({ inputRange: [0, max * 0.5], outputRange: [1, 0], extrapolate: 'clamp' });
  const thumbScale = grab.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const nudgeX = nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  return (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Double tap to accept"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => acceptRef.current()}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        backgroundColor: vt.blueSoft,
        borderWidth: 1,
        borderColor: vt.blueBorder,
        overflow: 'hidden',
        justifyContent: 'center',
      }}
    >
      {/* fill trailing the thumb */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width,
          backgroundColor: `${color}30`,
          transform: [
            { translateX: x.interpolate({ inputRange: [0, max], outputRange: [TRACK_H - width, 0] }) },
          ],
        }}
      />

      {/* label + animated chevrons */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: THUMB + PAD,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          opacity: labelOpacity,
        }}
      >
        <Text style={{ color, fontWeight: '800', fontSize: 15 }}>{label}</Text>
        <View style={{ flexDirection: 'row' }}>
          {[0, 1, 2].map((i) => {
            const s = 0.05 + i * 0.2;
            return (
              <Animated.View
                key={i}
                style={{
                  marginLeft: i ? -6 : 0,
                  opacity: hint.interpolate({
                    inputRange: [0, s, s + 0.25, s + 0.5, 1],
                    outputRange: [0.25, 0.25, 1, 0.25, 0.25],
                  }),
                }}
              >
                <Ionicons name="chevron-forward" size={16} color={color} />
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* accepted state */}
      {accepted && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: THUMB + PAD,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Text style={{ color, fontWeight: '800', fontSize: 15 }}>{doneLabel}</Text>
        </View>
      )}

      {/* thumb */}
      <Animated.View
        pointerEvents="none"
        style={{
          marginLeft: PAD,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateX: Animated.add(x, nudgeX) }, { scale: thumbScale }],
          shadowColor: color,
          shadowOpacity: 0.4,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 5,
        }}
      >
        <Ionicons name={accepted ? 'checkmark' : 'arrow-forward'} size={24} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

/* ---------- Progress stepper ---------- */
type DotState = 'done' | 'current' | 'todo';

function StepDot({ state, index }: { state: DotState; index: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 12 }).start();
  }, [state, scale]);

  return (
    <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
      {state === 'current' && <Rings color={colors.blue} size={46} count={2} />}
      <Animated.View
        style={{
          transform: [{ scale }],
          width: 30,
          height: 30,
          borderRadius: 15,
          borderWidth: 2,
          borderColor: state === 'todo' ? colors.border : colors.blue,
          backgroundColor: state === 'todo' ? '#FFFFFF' : colors.blue,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {state === 'done' ? (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        ) : (
          <Text style={{ fontSize: 13, fontWeight: '800', color: state === 'todo' ? colors.muted : '#FFFFFF' }}>
            {index + 1}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

export function ProgressStepper({
  stage,
  labels,
  complete,
}: {
  stage: number;
  labels: string[];
  complete: boolean;
}) {
  const n = labels.length;
  const target = complete || n < 2 ? 1 : Math.min(Math.max(stage / (n - 1), 0), 1);
  const progress = useRef(new Animated.Value(target)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: target,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [target, progress]);

  const inset = `${100 / (2 * n)}%` as `${number}%`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={complete ? 'All steps complete' : `Step ${stage + 1} of ${n}: ${labels[stage] ?? ''}`}
    >
      {/* track + animated fill, behind the dots */}
      <View
        style={{
          position: 'absolute',
          top: 13.5,
          left: inset,
          right: inset,
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: 3,
            backgroundColor: colors.blue,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>

      <View style={{ flexDirection: 'row' }}>
        {labels.map((label, i) => {
          const state: DotState = complete || i < stage ? 'done' : i === stage ? 'current' : 'todo';
          return (
            <View key={label} style={{ flex: 1, alignItems: 'center', gap: space.sm }}>
              <StepDot state={state} index={i} />
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  textAlign: 'center',
                  fontWeight: state === 'current' ? '800' : '600',
                  color: state === 'todo' ? colors.muted : colors.blue,
                }}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
