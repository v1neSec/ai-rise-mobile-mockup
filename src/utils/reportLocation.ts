import * as Location from 'expo-location';

// Device location only; this does not call the application backend.
export async function captureReportCoordinates(): Promise<{ latitude: number; longitude: number }> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Allow location access or enter the issue address manually.');
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Location took too long. Try again or enter the address manually.')), 8000);
      }),
    ]);
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function captureReportLocation(): Promise<string> {
  const coordinates = await captureReportCoordinates();
  return `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
}
