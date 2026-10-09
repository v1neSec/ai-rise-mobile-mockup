import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, VolunteerTabParamList, useSession } from '../session';
import { Action, colors, Page, styles } from '../components/UI';
import { AppPanelsProvider, FloatingMenu } from '../components/FloatingMenu';
import VolunteerHome from './VolunteerHome';
import VolunteerDeployment from './VolunteerDeployment';

type Props = NativeStackScreenProps<RootStackParamList, 'VolunteerHome'>;


const Tab = createBottomTabNavigator<VolunteerTabParamList>();

export default function VolunteerTabs({ navigation }: Props) {
  const { session } = useSession();

  if (session?.role !== 'volunteer') {
    return (
      <Page>
        <Text style={styles.title}>Volunteer sign-in required</Text>
        <Action label="Sign in" color={colors.blue} onPress={() => navigation.replace('Auth', { role: 'volunteer' })} />
      </Page>
    );
  }

  return (
    <AppPanelsProvider role="volunteer">
    <Tab.Navigator backBehavior="firstRoute" tabBar={(props) => <FloatingMenu {...props} role="volunteer" />}
      screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tab.Screen name="Hub" component={VolunteerHome} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="Deployment"
        component={VolunteerDeployment}
      />
    </Tab.Navigator>
    </AppPanelsProvider>
  );
}
