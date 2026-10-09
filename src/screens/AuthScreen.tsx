import React, { useCallback, useState } from "react";
import { Alert, BackHandler, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { RootStackParamList, useSession } from "../session";
import { Action, colors, Field, Page, styles, Upload } from "../components/UI";
import { authService } from "../services/authService";
import { passengerService } from "../services/passengerService";
import { driverService } from "../services/driverService";
import { getApiErrorMessage } from "../api/api";
import { appendLocalImage } from "../services/upload";
import type { Driver, Passenger } from "../types/user";
import { tokenStorage } from "../api/tokenStorage";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

function tokenClaims(token: string): { user_id: number; username: string; role: string } {
  const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
  if (!payload) throw new Error('The server returned an invalid login token.');
  const claims = JSON.parse(globalThis.atob(payload)) as { user_id?: number; username?: string; role?: string };
  if (!claims.user_id || !claims.username || !claims.role) throw new Error('The login token is missing account details.');
  return { user_id: claims.user_id, username: claims.username, role: claims.role };
}

export default function AuthScreen({ route, navigation }: Props) {
  const { role, destination, reportMode, returnTo } = route.params;
  const { signIn } = useSession();

  const volunteer = role === "volunteer";
  const accent = volunteer ? colors.teal : colors.blue;

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(true);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [form, setForm] = useState({
    identifier: "",
    name: "",
    phone: "",
    barangay: "",
    username: "",
    emergencyName: "",
    emergencyPhone: "",
    password: "",
    confirm: "",
    profile: "",
    address: "",
    vehicleType: "",
    plate: "",
    capacity: "",
    front: "",
    back: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError("");
  }

  const goBack = useCallback(() => {
    if (mode === "register" && step > 0) {
      setStep((previous) => previous - 1);
      setError("");
    } else {
      navigation.goBack();
    }
  }, [mode, step, navigation]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (mode === "register" && step > 0) {
            goBack();
            return true;
          }

          return false;
        },
      );

      return () => subscription.remove();
    }, [mode, step, goBack]),
  );

  function switchMode(next: "signin" | "register") {
    setMode(next);
    setStep(0);
    setError("");
  }

  function complete(name: string, userId: number, username: string) {
    signIn({ role, name, userId, username });

    if (volunteer) {
      navigation.reset({
        index: 1,
        routes: [{ name: "Welcome" }, { name: "VolunteerHome" }],
      });
    } else if (returnTo === 'Sos') {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 1,
        routes: [
          { name: "Welcome" },
          {
            name: "ResidentTabs",
            params: { screen: destination === "Report" ? "Report" : "Home", params: destination === "Report" ? { mode: reportMode, entry: Date.now() } : undefined },
          },
        ],
      });
    }
  }

  async function submitSignIn() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const tokens = await authService.login({ username: form.identifier.trim(), password: form.password });
      const claims = tokenClaims(tokens.access);
      const expectedRole = volunteer ? 'driver' : 'passenger';
      if (claims.role !== expectedRole) {
        await tokenStorage.clearTokens();
        throw new Error(`This account is registered as ${claims.role}, not ${expectedRole}.`);
      }
      const profile = volunteer ? await driverService.getDriver(claims.user_id) : await passengerService.getPassenger(claims.user_id);
      const name = `${profile.first_name} ${profile.last_name}`.trim() || profile.username;
      complete(name, claims.user_id, claims.username);
    } catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  }

  function validateAccount() {
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.username.trim() ||
      (!volunteer && (!form.barangay.trim() || !form.emergencyName.trim() || !form.emergencyPhone.trim()))
    ) {
      setError("Please complete all required account fields.");
      return false;
    }

    const phone = form.phone.replace(/[\s()-]/g, "");

    if (!/^(09\d{9}|\+639\d{9})$/.test(phone)) {
      setError("Use a Philippine number: 09XXXXXXXXX or +639XXXXXXXXX.");
      return false;
    }

    if (form.password.length < 8) {
      setError("Your password must have at least 8 characters.");
      return false;
    }

    if (form.password !== form.confirm) {
      setError("Your passwords do not match.");
      return false;
    }

    return true;
  }

  async function getLocation() {
    setLocating(true);
    setError("");

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setError("Allow location access to pin your volunteer location.");
        return;
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });
    } catch {
      setError("Unable to get your location. Check GPS and try again.");
    } finally {
      setLocating(false);
    }
  }

  async function finishRegistration() {
    Alert.alert(
      "Confirm registration",
      "Check your details before continuing to your account.",
      [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Continue",
          onPress: () => { void registerAccount(); },
        },
      ],
    );
  }

  async function registerAccount() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const names = form.name.trim().split(/\s+/); const first_name = names.shift() || ''; const last_name = names.join(' ') || first_name;
      let profile: Passenger | Driver;
      if (volunteer) {
        const data = new FormData();
        data.append('username', form.username.trim()); data.append('first_name', first_name); data.append('last_name', last_name); data.append('password', form.password);
        data.append('driver_profile.address', form.address.trim()); data.append('driver_profile.contact_number', form.phone.replace(/[\s()-]/g, ''));
        data.append('driver_profile.vehicle_plate', form.plate.trim().toUpperCase());
        if (location) data.append('driver_profile.location', JSON.stringify({ lat: location.latitude, lng: location.longitude }));
        appendLocalImage(data, 'driver_profile.profile_picture', form.profile); appendLocalImage(data, 'driver_profile.vehicle_front_picture', form.front); appendLocalImage(data, 'driver_profile.vehicle_back_picture', form.back);
        profile = await driverService.register(data);
      } else {
        const data = new FormData();
        const username = form.username.trim() || form.identifier.trim();
        data.append('username', username); data.append('first_name', first_name); data.append('last_name', last_name); data.append('password', form.password);
        data.append('passenger_profile.address', form.barangay.trim()); data.append('passenger_profile.contact_number', form.phone.replace(/[\s()-]/g, ''));
        data.append('passenger_profile.emergency_contact_name', form.emergencyName.trim()); data.append('passenger_profile.emergency_contact_number', form.emergencyPhone.replace(/[\s()-]/g, ''));
        appendLocalImage(data, 'passenger_profile.profile_picture', form.profile);
        profile = await passengerService.register(data);
      }
      await authService.login({ username: profile.username, password: form.password });
      const userId = profile.id;
      complete(`${profile.first_name} ${profile.last_name}`.trim(), userId, profile.username);
    } catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  }

  function submitRegistration() {
    if (!volunteer) {
      if (validateAccount()) finishRegistration();
      return;
    }

    if (step === 0) {
      if (validateAccount()) {
        setError("");
        setStep(1);
      }
      return;
    }

    if (step === 1) {
      if (!form.address.trim() || !location) {
        setError("Enter your address and pin your current location.");
        return;
      }

      setError("");
      setStep(2);
      return;
    }

    if (
      hasVehicle &&
      (!form.vehicleType.trim() ||
        !form.plate.trim() ||
        !/^[1-9]\d*$/.test(form.capacity) ||
        !form.front ||
        !form.back)
    ) {
      setError(
        "Add vehicle type, plate, a positive passenger capacity, and both photos.",
      );
      return;
    }

    if (!hasVehicle) {
      setError('The backend registration contract requires a unique vehicle plate. Volunteer registration without a vehicle is not supported yet.');
      return;
    }

    finishRegistration();
  }

  const registering = mode === "register";
  const accountStep = registering && (!volunteer || step === 0);

  return (
    <Page>
      <Pressable
        accessibilityRole="button"
        onPress={goBack}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          minHeight: 44,
        }}
      >
        <Ionicons name="arrow-back" size={20} color={colors.muted} />
        <Text style={styles.subtitle}>
          {registering && step > 0 ? "Previous step" : "Back"}
        </Text>
      </Pressable>

      <View style={{ alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 22,
            backgroundColor: volunteer ? "#E0F3EF" : "#E4EDFF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image source={require('../../assets/images/agap-ai-logo.png')} accessibilityLabel="Agap-AI logo" resizeMode="contain" style={{ width: 54, height: 62 }} />
        </View>

        <Text style={[styles.title, { fontSize: 27 }]}>
          {volunteer ? "Volunteer access" : "Welcome to Agap-AI"}
        </Text>

        <Text style={[styles.subtitle, { textAlign: "center" }]}>
          {volunteer
            ? "Join the people helping our community stay safe."
            : destination === "Report"
              ? "Sign in to submit your community report."
              : "Sign in to manage your resident activity."}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          padding: 5,
          borderRadius: 15,
          backgroundColor: "#E7EDF5",
        }}
      >
        {(["signin", "register"] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === value }}
            onPress={() => switchMode(value)}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: mode === value ? "#FFFFFF" : "transparent",
            }}
          >
            <Text
              style={{
                color: mode === value ? colors.text : colors.muted,
                fontWeight: mode === value ? "700" : "500",
              }}
            >
              {value === "signin" ? "Sign in" : "Register"}
            </Text>
          </Pressable>
        ))}
      </View>

      {registering && volunteer && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {["Account", "Location", "Vehicle"].map((label, index) => (
            <View key={label} style={{ flex: 1, gap: 7 }}>
              <View
                style={{
                  height: 4,
                  borderRadius: 4,
                  backgroundColor: index <= step ? accent : colors.border,
                }}
              />
              <Text
                style={{
                  color: index === step ? accent : colors.muted,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {index < step ? "✓" : index + 1} {label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        {!registering && (
          <>
            <Field
              label="USERNAME"
              value={form.identifier}
              onChangeText={(value) => update("identifier", value)}
              placeholder="Your account username"
              autoCapitalize="none"
              autoComplete="username"
            />
            <Field
              label="PASSWORD"
              password
              value={form.password}
              onChangeText={(value) => update("password", value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </>
        )}

        {accountStep && (
          <>
            {volunteer && (
              <Upload
                label="Profile photo · Optional"
                uri={form.profile}
                onChange={(value) => update("profile", value)}
              />
            )}
            {!volunteer && <Upload label="Profile photo · Optional" uri={form.profile} onChange={(value) => update("profile", value)} />}

            <Field
              label="FULL NAME *"
              value={form.name}
              onChangeText={(value) => update("name", value)}
              placeholder="Juan dela Cruz"
              autoCapitalize="words"
              autoComplete="name"
            />

            <Field label="USERNAME *" value={form.username} onChangeText={(value) => update("username", value)} placeholder="Choose your username" autoCapitalize="none" />

            <Field
              label="PHONE NUMBER *"
              value={form.phone}
              onChangeText={(value) => update("phone", value)}
              placeholder="09XXXXXXXXX"
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            {!volunteer && (
              <Field
                label="BARANGAY *"
                value={form.barangay}
                onChangeText={(value) => update("barangay", value)}
                placeholder="Enter your barangay"
                autoCapitalize="words"
              />
            )}
            {!volunteer && <>
              <Field label="EMERGENCY CONTACT NAME *" value={form.emergencyName} onChangeText={(value) => update("emergencyName", value)} placeholder="Contact person" autoCapitalize="words" />
              <Field label="EMERGENCY CONTACT NUMBER *" value={form.emergencyPhone} onChangeText={(value) => update("emergencyPhone", value)} placeholder="09XXXXXXXXX" keyboardType="phone-pad" />
            </>}

            <Field
              label="PASSWORD *"
              password
              value={form.password}
              onChangeText={(value) => update("password", value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />

            <Field
              label="CONFIRM PASSWORD *"
              password
              value={form.confirm}
              onChangeText={(value) => update("confirm", value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
          </>
        )}

        {registering && volunteer && step === 1 && (
          <>
            <Text
              style={{ fontSize: 19, color: colors.text, fontWeight: "700" }}
            >
              Where are you based?
            </Text>

            <Field
              label="STREET ADDRESS *"
              value={form.address}
              onChangeText={(value) => update("address", value)}
              placeholder="Street, barangay, municipality"
              autoCapitalize="words"
              autoComplete="street-address"
            />

            <View
              style={{
                backgroundColor: "#E4F5F0",
                borderRadius: 18,
                padding: 24,
                alignItems: "center",
                gap: 12,
              }}
            >
              <Ionicons name="location-outline" size={38} color={accent} />

              <Text style={{ color: accent, fontWeight: "700" }}>
                {location ? "Location captured" : "Pin your current location"}
              </Text>

              <Text style={[styles.small, { textAlign: "center" }]}>
                {location
                  ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                  : "Your location helps coordinate nearby missions."}
              </Text>
            </View>

            <Action
              label={locating ? "Getting location…" : "Use current location"}
              onPress={getLocation}
              color={accent}
              secondary
              disabled={locating}
            />
          </>
        )}

        {registering && volunteer && step === 2 && (
          <>
            <Text
              style={{ fontSize: 19, color: colors.text, fontWeight: "700" }}
            >
              How can you help?
            </Text>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !hasVehicle }}
              onPress={() => {
                setHasVehicle(!hasVehicle);
                setError("");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                minHeight: 48,
              }}
            >
              <Ionicons
                name={!hasVehicle ? "checkbox" : "square-outline"}
                size={24}
                color={accent}
              />
              <Text style={styles.subtitle}>I don’t have a vehicle</Text>
            </Pressable>

            {hasVehicle ? (
              <>
                <Field
                  label="VEHICLE TYPE *"
                  value={form.vehicleType}
                  onChangeText={(value) => update("vehicleType", value)}
                  placeholder="Boat, van, pickup…"
                  autoCapitalize="words"
                />

                <Field
                  label="PLATE / REGISTRATION NUMBER *"
                  value={form.plate}
                  onChangeText={(value) => update("plate", value)}
                  placeholder="Vehicle identifier"
                  autoCapitalize="characters"
                />

                <Field
                  label="PASSENGER CAPACITY *"
                  value={form.capacity}
                  onChangeText={(value) => update("capacity", value)}
                  placeholder="People you can carry, excluding the driver"
                  keyboardType="number-pad"
                />

                <Upload
                  label="Vehicle front photo *"
                  uri={form.front}
                  onChange={(value) => update("front", value)}
                />

                <Upload
                  label="Vehicle back photo *"
                  uri={form.back}
                  onChange={(value) => update("back", value)}
                />
              </>
            ) : (
              <Text style={styles.subtitle}>
                You can help with evacuation support and other field tasks.
              </Text>
            )}

          </>
        )}

        {!!error && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.danger, fontSize: 13, lineHeight: 20 }}
          >
            {error}
          </Text>
        )}

        <Action
          label={busy ? "Please wait…" :
            !registering
              ? "Sign in"
              : volunteer && step < 2
                ? "Continue →"
                : "Create account"
          }
          color={accent}
          disabled={busy}
          onPress={registering ? submitRegistration : submitSignIn}
        />

        {registering && volunteer && step > 0 && (
          <Action label="Back" onPress={goBack} secondary />
        )}
      </View>


      <Pressable
        accessibilityRole="button"
        onPress={() => switchMode(registering ? "signin" : "register")}
        style={{ paddingVertical: 12 }}
      >
        <Text style={{ color: accent, textAlign: "center", fontWeight: "600" }}>
          {registering
            ? "Already have an account? Sign in"
            : "New to Agap-AI? Create an account"}
        </Text>
      </Pressable>

      {!volunteer && (
        <Text style={[styles.small, { textAlign: "center" }]}>
          You can view alerts and open SOS without signing in. Community
          reporting requires an account.
        </Text>
      )}
    </Page>
  );
}
