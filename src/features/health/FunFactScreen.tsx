import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Lightbulb, RefreshCw } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// A light, passive "flip card" activity - tap through a bundled deck of
// fun facts. Deliberately not fetched from the backend's HealthTip
// collection (see homeController.js's HEALTH_TIP section) - these
// wellness activities are meant to work identically online and offline,
// and a truly random pick here doesn't need a network round trip. Orange
// for a cheerful, playful feel, distinct from the other activities.
const FACTS = [
  'Laughing 100 times gives your body a workout equivalent to 15 minutes on an exercise bike.',
  'Your heart beats about 100,000 times a day - roughly 35 million times a year.',
  'Human bones are about as strong as steel, but four times lighter.',
  'Your nose can remember 50,000 different scents.',
  'It takes about 12 muscles to smile, and around twice as many to frown.',
  'Your brain generates enough electricity to power a small light bulb.',
  "Yawning cools down your brain - it's basically a built-in AC system.",
  'The average person walks the equivalent of five times around the world in a lifetime.',
  "Your skin is your body's largest organ, weighing about 4 kg on average.",
  'Drinking water can measurably improve concentration within just a few minutes.',
  'Stretching regularly can improve your posture and reduce everyday back pain.',
  'Blinking helps clean and lubricate your eyes - you do it about 15-20 times a minute.',
  'A single deep breath can lower your heart rate almost immediately.',
  'Your body produces a new layer of skin roughly every 27 days.',
  'Regular short walks can boost creative thinking, according to several studies.',
  'The human body has enough iron in it to make a 3-inch nail.',
  'Hearing a favorite song can genuinely lower stress hormones in your body.',
  'Good sleep helps your brain clear out waste products built up during the day.',
];

function randomIndex(exclude: number, length: number) {
  if (length <= 1) return 0;
  let index = Math.floor(Math.random() * length);
  while (index === exclude) {
    index = Math.floor(Math.random() * length);
  }
  return index;
}

export default function FunFactScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * FACTS.length));

  const handleNext = () => {
    setIndex((prev) => randomIndex(prev, FACTS.length));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fun Fact</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Lightbulb size={26} color="#EA580C" />
          </View>
          <Text style={styles.factText}>{FACTS[index]}</Text>
        </View>

        <TouchableOpacity style={styles.nextButton} activeOpacity={0.85} onPress={handleNext}>
          <RefreshCw size={18} color="#FFFFFF" />
          <Text style={styles.nextButtonText}>Another One</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: '#FFF7ED',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    minHeight: 220,
    justifyContent: 'center',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  factText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#7C2D12',
    textAlign: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EA580C',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
