import { Circle, Hexagon, Pill } from 'lucide-react-native';
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

      {/* Visual Anchor - Custom 3D-like Composition */}
      <View style={styles.iconHeader}>
        <View style={{ width: 120, height: 120, position: 'relative' }}>
          {/* Gradient/Glow effects could be added here if needed */}

          {/* Blue Pill */}
          <View style={{
            position: 'absolute', top: 10, left: 20,
            transform: [{ rotate: '-30deg' }],
            zIndex: 2
          }}>
            <Pill size={48} color="#00C3FF" fill="#00C3FF" />
          </View>

          {/* Green Hexagon */}
          <View style={{
            position: 'absolute', top: 10, right: 20,
            transform: [{ rotate: '15deg' }],
            zIndex: 1
          }}>
            <Hexagon size={40} color="#D4F6CC" fill="#D4F6CC" />
          </View>

          {/* Pink Circle */}
          <View style={{
            position: 'absolute', bottom: 10, alignSelf: 'center',
            zIndex: 3
          }}>
            <Circle size={42} color="#FF66C4" fill="#FF66C4" />
          </View>

          {/* Small decorative dot */}
          <View style={{
            position: 'absolute', bottom: 40, left: 30,
            zIndex: 0
          }}>
            <Circle size={16} color="#00E0FF" fill="#00E0FF" />
          </View>
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
