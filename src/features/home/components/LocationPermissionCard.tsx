import * as Location from 'expo-location';
import { MapPin, MapPinOff } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { retryLocation, setLocationStatus } from '../../../redux/slices/locationSlice';
import type { RootState } from '../../../redux/store';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

// Shown in place of the feed when the customer's location could not be found: either they did not allow location access ('denied'), or
// access is on but no position could be worked out ('unavailable'). The feed is location-based, so without this the home screen
// would be empty with no hint why or what to do.
export default function LocationPermissionCard() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useDispatch();
  const status = useSelector((state: RootState) => state.location.status);
  const canAskAgain = useSelector((state: RootState) => state.location.canAskAgain);
  const [busy, setBusy] = useState(false);

  const denied = status !== 'unavailable';

  // They may switch access on from the phone's settings and come back: look again when the app returns to the foreground
  useEffect(() => {
    if (!denied) return undefined;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      Location.getForegroundPermissionsAsync()
        .then((permission) => { if (permission.granted) dispatch(retryLocation()); })
        .catch(() => undefined);
    });
    return () => sub.remove();
  }, [denied, dispatch]);

  const onPress = async () => {
    if (busy) return;
    if (!denied) {
      dispatch(retryLocation());
      return;
    }
    // refused with "don't ask again": the system will not show the question any more, only the settings can change it
    if (!canAskAgain) {
      Linking.openSettings().catch(() => undefined);
      return;
    }
    setBusy(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.granted) dispatch(retryLocation());
      else dispatch(setLocationStatus({ status: 'denied', canAskAgain: permission.canAskAgain }));
    } finally {
      setBusy(false);
    }
  };

  const Icon = denied ? MapPinOff : MapPin;
  const title = denied ? 'Find medicines and pharmacies near you' : "We couldn't find your location";
  const body = denied
    ? 'Allow location access and we will show the pharmacies that can deliver to you, with what they have in stock. We only use your location to look for pharmacies nearby.'
    : 'Make sure location is switched on and try again. You can also choose an address from the top of the screen.';
  const button = !denied ? 'Try again' : canAskAgain ? 'Allow location access' : 'Open settings';

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Icon size={28} color={theme.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85} disabled={busy}>
          {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.buttonText}>{button}</Text>}
        </TouchableOpacity>
        {denied && (
          <Text style={styles.hint}>
            {canAskAgain ? 'Prefer not to share it? ' : 'Turn on Location for Medicoo there, then come back. '}
            You can also choose an address from the top of the screen.
          </Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  card: {
    backgroundColor: c.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: c.text, textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 21, color: c.textSecondary, textAlign: 'center', marginBottom: 20 },
  button: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  hint: { marginTop: 14, fontSize: 12.5, lineHeight: 18, color: c.textMuted, textAlign: 'center' },
});
