import React from 'react';
import { ComponentProps } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from '../session';
import { colors } from '../components/UI';
import ResidentHome from './ResidentHome';
import ReportScreen from './ReportScreen';
import StatusScreen from './StatusScreen';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icons: Record<keyof TabParamList, [IconName, IconName]> = {
  Home: ['home', 'home-outline'],
  Report: ['document-text', 'document-text-outline'],
  Status: ['shield-checkmark', 'shield-checkmark-outline'],
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function ResidentTabs() {
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
      <Tab.Screen name="Home" component={ResidentHome} />
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Status" component={StatusScreen} />
    </Tab.Navigator>
  );
}