import { Pill } from 'lucide-react-native';
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from '../styles';

export default function MedicationDetailsStep({
  data,
  onChange,
  onNext,
}) {
  return (
    <View style={styles.stepContainer}>

      {/* Visual Anchor - plain icon-in-circle, same recipe used everywhere
          else in the app (Medo's avatar, LogVitals field icons) rather
          than a bespoke composition. */}
      <View style={styles.iconHeader}>
        <View style={[styles.iconCircle, { backgroundColor: '#0FBBA1' }]}>
          <Pill size={36} color="#FFFFFF" />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.stepTitle}>Medication Name</Text>
      <Text style={styles.stepSubtitle}>
        Enter the name of your medication
      </Text>

      {/* Input */}
      <TextInput
        style={styles.input}
        placeholder="Add Medication Name"
        placeholderTextColor="#555"
        value={data.medicineName}
        onChangeText={value => onChange({ medicineName: value })}
        autoFocus
        returnKeyType="done"
      />


    </View>
  );
}
