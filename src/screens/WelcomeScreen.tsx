import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, useSession } from '../session';
import { colors, Page, styles } from '../components/UI';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { session } = useSession();

  const roles = [
    {
      role: 'resident' as const,
      title: 'Resident',
      description: 'View alerts, access SOS, and report community issues.',
      icon: 'home-outline' as const,
      color: colors.blue,
    },
    {
      role: 'volunteer' as const,
      title: 'Volunteer',
      description: 'Manage your availability and assigned rescue missions.',
      icon: 'shield-checkmark-outline' as const,
      color: colors.teal,
    },
  ];

  return (
    <Page>
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 24,
            backgroundColor: '#E3ECFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="pulse" size={38} color={colors.blue} />
        </View>

        <Text style={styles.title}>Agap-AI</Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>
          Together, prepared for what comes next.
        </Text>
        <Text style={styles.small}>Apalit, Pampanga</Text>
      </View>

      {/* <View
        style={[
          styles.card,
          { backgroundColor: '#FFF1F3', borderColor: '#F5C5CD', gap: 6 },
        ]}
      >
        <Text style={{ color: colors.danger, fontWeight: '700' }}>
          Flood alert
        </Text>
        <Text style={styles.subtitle}>
          Stay informed and prepared in your community.
        </Text>
      </View> */}

      <Text style={styles.label}>HOW WILL YOU USE Agap-AI?</Text>

      {roles.map((item) => (
        <Pressable
          key={item.role}
          accessibilityRole="button"
          onPress={() => {
            if (item.role === 'resident') {
              navigation.navigate('ResidentTabs');
            } else if (session?.role === 'volunteer') {
              navigation.navigate('VolunteerHome');
            } else {
              navigation.navigate('Auth', { role: 'volunteer' });
            }
          }}
          style={({ pressed }) => [
            styles.card,
            {
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              backgroundColor:
                item.role === 'resident' ? '#EAF0FF' : '#E3F5F2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={item.icon} size={28} color={item.color} />
          </View>

          <View style={{ flex: 1, gap: 5 }}>
            <Text
              style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}
            >
              {item.title}
            </Text>
            <Text style={styles.subtitle}>{item.description}</Text>
          </View>

          <Ionicons name="arrow-forward" size={20} color={item.color} />
        </Pressable>
      ))}

      {/* <Text style={[styles.small, { textAlign: 'center' }]}>
        Residents can browse as guests. Volunteer tools require sign-in.
      </Text> */}
    </Page>
  );
}