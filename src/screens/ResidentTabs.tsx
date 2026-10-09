import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../session';
import { AppPanelsProvider, FloatingMenu } from '../components/FloatingMenu';
import ResidentHome from './ResidentHome';
import ReportScreen from './ReportScreen';
import StatusScreen from './StatusScreen';

const Tab = createBottomTabNavigator<TabParamList>();
export default function ResidentTabs() {
  return <AppPanelsProvider role="resident">
    <Tab.Navigator backBehavior="firstRoute" tabBar={(props) => <FloatingMenu {...props} role="resident" />}
      screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tab.Screen name="Home" component={ResidentHome} />
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Status" component={StatusScreen} />
    </Tab.Navigator>
  </AppPanelsProvider>;
}
