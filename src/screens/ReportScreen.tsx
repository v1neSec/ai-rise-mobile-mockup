import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList, useSession } from '../session';
import { Action, Choice, ChoiceGrid, colors, Field, Page, PickerRow, space, styles, Upload } from '../components/UI';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: Choice[] = [
  { key: 'Flooded road', icon: 'water-outline' },
  { key: 'Blocked drainage', icon: 'funnel-outline' },
  { key: 'Fallen tree / debris', icon: 'leaf-outline' },
  { key: 'Damaged structure', icon: 'business-outline' },
  { key: 'Power outage', icon: 'flash-off-outline' },
  { key: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

export default function ReportScreen() {
  const navigation = useNavigation<Nav>();
  const { session, addReport } = useSession();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  if (session?.role !== 'resident') {
    return (
      <Page edges={['top']}>
        <View style={[styles.card, { alignItems: 'center', gap: space.md, marginTop: 40 }]}>
          <Ionicons name="lock-closed-outline" size={32} color={colors.blue} />
          <Text style={styles.section}>Sign in to report</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Reports need an account so your barangay can follow up. SOS stays open to everyone.
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            <Action label="Sign in or register" onPress={() => navigation.navigate('Auth', { role: 'resident', destination: 'Report' })} />
          </View>
        </View>
      </Page>
    );
  }

  async function pinLocation() {
    setLocating(true);
    setError('');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setError('Allow location access to pin the issue.');
        return;
      }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`);
    } catch {
      setError('Couldn’t get your location. Check that GPS is on and try again.');
    } finally {
      setLocating(false);
    }
  }

  function submit() {
    if (!category) return setError('Choose what kind of issue this is.');
    if (description.trim().length < 10) return setError('Add a short description (at least 10 characters).');
    if (!location) return setError('Pin the location of the issue.');
    addReport({ category, description: description.trim(), photo, location });
    setCategory(''); setDescription(''); setPhoto(''); setLocation(''); setError('');
    Alert.alert('Report saved', 'Your report has been successfully submitted.',[
      { text: 'View status', onPress: () => navigation.navigate('ResidentTabs', { screen: 'Status' }) },
    ]);
  }

  return (
    <Page
      edges={['top']}
      footer={
        <>
          {!!error && (
            <Text accessibilityLiveRegion="polite" style={{ color: colors.danger, fontSize: 14, lineHeight: 20 }}>
              {error}
            </Text>
          )}
          <Action label="Submit report" onPress={submit} />
        </>
      }
    >
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>Report an issue</Text>
        <Text style={styles.subtitle}>Tell your barangay what’s happening.</Text>
      </View>

      <View style={{ gap: space.md }}>
        <Text style={styles.section}>What kind of issue?</Text>
        <ChoiceGrid
          options={CATEGORIES}
          selected={category ? [category] : []}
          onSelect={(k) => { setCategory(k); setError(''); }}
        />
      </View>

      <View style={{ gap: space.md }}>
        <Text style={styles.section}>Details</Text>
        <Field
          label="What’s happening?"
          value={description}
          onChangeText={(t) => { setDescription(t); setError(''); }}
          placeholder="Example: Water is knee-deep near the school."
          multiline
          autoCapitalize="sentences"
          autoCorrect
          style={{ minHeight: 104, textAlignVertical: 'top' }}
        />
        <PickerRow
          icon="location-outline"
          title="Location"
          subtitle={location || 'Use your current location'}
          done={!!location}
          loading={locating}
          onPress={pinLocation}
          color={colors.blue}
        />
        <Upload label="Photo (optional)" uri={photo} onChange={setPhoto} color={colors.blue} />
      </View>
    </Page>
  );
}