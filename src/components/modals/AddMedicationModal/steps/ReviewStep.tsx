import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { RenderMedicationIcon } from '../config/shapes';
import { styles } from '../styles';

interface ReviewStepProps {
  data: any;
  onChange: (data: any) => void;
}

export default function ReviewStep({ data, onChange }: ReviewStepProps) {
  // Format times summary
  const timesSummary = data.times.join(', ');
  const doseLabel = data.shape === 'capsule' ? 'capsule' : 'dose';
  const startText = data.startDate ? `Starts ${new Date(data.startDate).toLocaleDateString([], { day: 'numeric', month: 'short' })}` : 'Starts Today';
  const endText = data.endDate ? `Ends ${new Date(data.endDate).toLocaleDateString([], { day: 'numeric', month: 'short' })}` : 'No End Date';

  return (
    <View style={styles.stepContainer}>

      {/* Visual Anchor */}
      <View style={styles.iconHeader}>
        <View style={[styles.iconCircle, { backgroundColor: data.color || '#00C3FF' }]}>
          <RenderMedicationIcon
            shapeKey={data.shape}
            leftColor={data.leftColor}
            rightColor={data.rightColor}
            size={1.5}
          />
        </View>
      </View>

      {/* Name and Type */}
      <View style={{ marginBottom: 30, paddingHorizontal: 4, alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
          {data.medicineName || 'Medication'}
        </Text>
        <Text style={{ fontSize: 18, color: '#6B7280' }}>
          {data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : 'Type'}
        </Text>
      </View>

      {/* Schedule */}
      <Text style={styles.sectionLabel}>Schedule</Text>
      <View style={[styles.listGroup, { padding: 16 }]}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
          {data.frequency || 'Every Day'}
        </Text>
        <Text style={{ fontSize: 17, color: '#111827', marginBottom: 12 }}>
          {timesSummary || 'No time set'}  <Text style={{ color: '#6B7280' }}>1 {doseLabel}</Text>
        </Text>

        <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 15, color: '#6B7280' }}>
            {startText}
          </Text>
          <Text style={{ fontSize: 15, color: '#6B7280' }}>
            {endText}
          </Text>
        </View>
      </View>

      {/* Privacy */}
      <Text style={styles.sectionLabel}>Privacy</Text>
      <View style={[styles.listGroup, { padding: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 17, color: '#111827' }}>Visibility</Text>
          <Text style={{ fontSize: 17, color: '#6B7280' }}>
            {data.familyVisible ? 'Shared with Family' : 'Private'}
          </Text>
        </View>
      </View>

      {/* Optional Details */}
      <Text style={styles.sectionLabel}>Optional Details</Text>

      <View style={{ marginBottom: 16 }}>
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor="#9CA3AF"
          value={data.displayName}
          onChangeText={text => onChange({ displayName: text })}
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <TextInput
          style={[styles.input, { height: 100, paddingTop: 16 }]}
          placeholder="Notes"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top" // Android
          value={data.notes}
          onChangeText={text => onChange({ notes: text })}
        />
      </View>

      <View style={{ height: 100 }} />
    </View>
  );
}
