import React, { ComponentProps, createContext, useContext, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Role, useSession } from '../session';
import { colors, styles } from './UI';
import { BottomSheet as Sheet } from './BottomSheet';

type IconName = ComponentProps<typeof Ionicons>['name'];
const Panels = createContext<{
  showProfile: () => void; showUpdates: () => void; showMenu: (content: React.ReactNode) => void;
  closePanel: () => void; menuOpen: boolean;
}>({ showProfile: () => {}, showUpdates: () => {}, showMenu: () => {}, closePanel: () => {}, menuOpen: false });
export const useAppPanels = () => useContext(Panels);

function MenuRow({ title, description, icon, onPress }: { title: string; description?: string; icon: IconName; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 72, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: pressed ? '#E7F0F7' : '#FFFFFF' })}>
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAF1F5', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={21} color={colors.text} /></View>
    <View style={{ flex: 1, gap: 3 }}><Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>{description && <Text style={styles.small}>{description}</Text>}</View>
    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
  </Pressable>;
}

export function AppPanelsProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  const [panel, setPanel] = useState<'profile' | 'updates' | 'menu' | null>(null);
  const [visible, setVisible] = useState(false);
  const [menuContent, setMenuContent] = useState<React.ReactNode>(null);
  const { session, signOut, broadcasts } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const close = () => setVisible(false);
  const show = (next: 'profile' | 'updates' | 'menu') => { setPanel(next); setVisible(true); };
  return <Panels.Provider value={{ showProfile: () => show('profile'), showUpdates: () => show('updates'), showMenu: (content) => { setMenuContent(content); show('menu'); }, closePanel: close, menuOpen: visible && panel === 'menu' }}>
    {children}
    <Sheet title={panel === 'profile' ? 'Your profile' : panel === 'menu' ? 'How can we help?' : 'Updates'} open={visible} onClose={close}>
      {panel === 'menu' ? menuContent : panel === 'profile' ? <>
        <View style={{ alignItems: 'center', padding: 16, gap: 8 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCE9F0', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="person-outline" size={28} color={colors.text} /></View>
          <Text style={styles.section}>{session?.name ?? 'Guest'}</Text>
          <Text style={styles.small}>{role === 'resident' ? 'Resident' : 'Volunteer'} · Apalit, Pampanga</Text>
        </View>
        <MenuRow title="Switch role" description="Resident and volunteer support" icon="swap-horizontal-outline" onPress={() => { close(); navigation.navigate('Welcome'); }} />
        <MenuRow title={session ? 'Sign out' : 'Sign in'} icon={session ? 'log-out-outline' : 'log-in-outline'} onPress={() => {
          close();
          if (session) { signOut(); navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }); }
          else navigation.navigate('Auth', { role });
        }} />
      </> : role === 'volunteer' ? broadcasts.map((item) => <View key={item.id} style={styles.card}>
        <Text style={styles.section}>{item.from}</Text><Text style={styles.subtitle}>{item.message}</Text><Text style={styles.small}>{item.time}</Text>
      </View>) : <View style={styles.card}>
        <Text style={styles.section}>Flood advisory · Apalit</Text><Text style={styles.subtitle}>River water levels are rising. Avoid river banks and keep your phone nearby.</Text>
      </View>}
    </Sheet>
  </Panels.Provider>;
}

export function FloatingMenu({ state, navigation, role }: BottomTabBarProps & { role: Role }) {
  const { showProfile, showUpdates, showMenu, closePanel, menuOpen } = useAppPanels();
  const insets = useSafeAreaInsets();
  const home = role === 'resident' ? 'Home' : 'Hub';
  if (state.routes[state.index].name !== home) return null;
  const go = (route: string, params?: object) => { closePanel(); navigation.navigate(route, params); };
  const report = (mode: 'emergency' | 'supplies' | 'community') => go('Report', { mode, entry: Date.now() });
  const menu = <>
      {role === 'resident' ? <>
        <MenuRow title="Request help" description="Rescue and emergency assistance" icon="alert-circle-outline" onPress={() => report('emergency')} />
        <MenuRow title="Request supplies" description="Food, water, and household essentials" icon="cube-outline" onPress={() => report('supplies')} />
        <MenuRow title="Report community issue" icon="flag-outline" onPress={() => report('community')} />
        <MenuRow title="My status" icon="shield-checkmark-outline" onPress={() => go('Status')} />
      </> : <>
        <MenuRow title="Active deployment" icon="navigate-outline" onPress={() => go('Deployment')} />
        <MenuRow title="Team updates" icon="chatbubbles-outline" onPress={showUpdates} />
      </>}
      <MenuRow title="Profile" icon="person-outline" onPress={showProfile} />
  </>;
  return <View pointerEvents="box-none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 126 + insets.bottom, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: insets.bottom + 14 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" accessibilityState={{ expanded: menuOpen }} onPress={() => showMenu(menu)}
      style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: '#E3F0FF', backgroundColor: '#79ACEC', transform: [{ scale: pressed ? 0.95 : 1 }], shadowColor: '#3770AC', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 6 })}>
      <LinearGradient colors={['#A1C7F5', '#73A9EB']} style={{ flex: 1, borderRadius: 34, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <Ionicons name="grid-outline" size={22} color="#173C69" />
        <Text style={{ color: '#173C69', fontSize: 12, fontWeight: '800' }}>Menu</Text>
      </LinearGradient>
    </Pressable>
  </View>;
}
