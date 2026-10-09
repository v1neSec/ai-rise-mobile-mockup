import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, styles } from './UI';

/** A short, finite celebration shared by local report and deployment confirmations. */
export function SuccessConfirmation({ title, message }: { title: string; message: string }) {
  const [motion] = useState(() => ({
    check: new Animated.Value(0),
    halo: new Animated.Value(0),
    content: new Animated.Value(0),
  }));

  useEffect(() => {
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    const show = (reduce: boolean) => {
      if (cancelled) return;
      if (reduce) {
        motion.check.setValue(1); motion.halo.setValue(1); motion.content.setValue(1);
        return;
      }
      animation = Animated.parallel([
        Animated.spring(motion.check, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }),
        Animated.timing(motion.halo, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(motion.content, { toValue: 1, delay: 180, duration: 420, useNativeDriver: true }),
      ]);
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(show, () => show(false));
    return () => { cancelled = true; animation?.stop(); };
  }, [motion]);

  return (
    <View style={{ alignItems: 'center', gap: 24, paddingTop: 36, paddingBottom: 20 }}>
      <View style={{ width: 144, height: 144, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 122, height: 122, borderRadius: 61, borderWidth: 2, borderColor: '#AFCBFF', opacity: motion.halo.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.3, 0] }), transform: [{ scale: motion.halo.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.3] }) }] }} />
        <Animated.View style={{ width: 104, height: 104, borderRadius: 36, backgroundColor: '#EDF3FF', alignItems: 'center', justifyContent: 'center', opacity: motion.check, transform: [{ scale: motion.check }] }}>
          <View style={{ width: 72, height: 72, borderRadius: 26, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={42} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>
      <Animated.View style={{ alignItems: 'center', gap: 10, opacity: motion.content, transform: [{ translateY: motion.content.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[styles.title, { textAlign: 'center', fontSize: 26, lineHeight: 32 }]}>{title}</Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>{message}</Text>
      </Animated.View>
    </View>
  );
}
