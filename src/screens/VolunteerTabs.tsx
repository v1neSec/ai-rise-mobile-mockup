import React, { ComponentProps } from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, VolunteerTabParamList, useSession } from '../session';
import { Action, colors, Page, styles } from '../components/UI';
import VolunteerHome from './VolunteerHome';
import VolunteerDeployment from './VolunteerDeployment';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Props = NativeStackScreenProps<RootStackParamList, 'VolunteerHome'>;

const icons: Record<keyof VolunteerTabParamList, [IconName, IconName]> = {
  Hub: ['home', 'home-outline'],
  Deployment: ['flag', 'flag-outline'],
};

const Tab = createBottomTabNavigator<VolunteerTabParamList>();

export default function VolunteerTabs({ navigation }: Props) {
  const { session, active } = useSession();

  if (session?.role !== 'volunteer') {
    return (
      <Page>
        <Text style={styles.title}>Volunteer sign-in required</Text>
        <Action label="Sign in" color={colors.blue} onPress={() => navigation.replace('Auth', { role: 'volunteer' })} />
      </Page>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: '#8A98AD',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={icons[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Hub" component={VolunteerHome} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="Deployment"
        component={VolunteerDeployment}
        options={{
          tabBarBadge: active ? 1 : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.blue, color: '#FFFFFF' },
        }}
      />
    </Tab.Navigator>
  );
}
