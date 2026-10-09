import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChromeIcon } from './AppChrome';
import { styles } from './UI';

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);
type SheetProps = { title: string; open: boolean; onClose: () => void; children: React.ReactNode };

export function BottomSheet({ open, ...props }: SheetProps) {
  // Every opening mounts fresh hidden values; no visible position survives a previous opening.
  return open ? <PresentedSheet {...props} /> : null;
}

function PresentedSheet({ title, onClose, children }: Omit<SheetProps, 'open'>) {
  const { height } = useWindowDimensions();
  const [motion] = useState(() => ({ slide: new Animated.Value(height), backdrop: new Animated.Value(0) }));
  const [reduceMotion, setReduceMotion] = useState(false);
  const closing = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    const show = (reduce: boolean) => {
      if (cancelled || closing.current) return;
      setReduceMotion(reduce);
      if (reduce) { motion.slide.setValue(0); motion.backdrop.setValue(1); return; }
      animation = Animated.parallel([
        Animated.timing(motion.backdrop, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(motion.slide, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(show, () => show(false));
    return () => { cancelled = true; animation?.stop(); motion.slide.stopAnimation(); motion.backdrop.stopAnimation(); };
  }, [motion]);

  function close() {
    if (closing.current) return;
    closing.current = true;
    motion.slide.stopAnimation(); motion.backdrop.stopAnimation();
    if (reduceMotion) { onClose(); return; }
    Animated.parallel([
      Animated.timing(motion.backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(motion.slide, { toValue: height, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) onClose(); });
  }

  return <Modal visible transparent animationType="none" onRequestClose={close}>
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: motion.backdrop }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close panel" onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: '#17243B55' }]} />
      </Animated.View>
      <AnimatedSafeAreaView edges={['bottom']} accessibilityViewIsModal style={{ maxHeight: '85%', backgroundColor: '#F6F9FD', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: '#E2ECF8', transform: [{ translateY: motion.slide }] }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#CAD8E2', alignSelf: 'center', marginTop: 12 }} />
        <View style={{ paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', paddingTop: 8 }}>
          <Text style={[styles.section, { flex: 1, fontSize: 22 }]}>{title}</Text>
          <ChromeIcon icon="close" label="Close panel" onPress={close} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingTop: 10, gap: 10 }}>{children}</ScrollView>
      </AnimatedSafeAreaView>
    </View>
  </Modal>;
}
