import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { RootStackParamList, SessionProvider } from './src/session';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import ResidentTabs from './src/screens/ResidentTabs';
import SosScreen from './src/screens/SosScreen';
import VolunteerTabs from './src/screens/VolunteerTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: '#F3F6FB' },
            }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="ResidentTabs" component={ResidentTabs} />
            <Stack.Screen
              name="Sos"
              component={SosScreen}
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            {/* Route name kept so Welcome and Auth keep working. It now opens the volunteer tabs. */}
            <Stack.Screen name="VolunteerHome" component={VolunteerTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </SessionProvider>
    </SafeAreaProvider>
  );
}