import React from 'react';
import { Switch, Text, View } from 'react-native';
import { RenderMedicationIcon } from '../config/shapes';
import { styles } from '../styles';

interface DurationStepProps {
  data: any;
  onChange: (data: any) => void;
}

export default function DurationStep({ data, onChange }: DurationStepProps) {
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

      <Text style={styles.stepTitle}>Privacy & Visibility</Text>

      <Text style={styles.sectionLabel}>Permissions</Text>
      <View style={styles.listGroup}>
        <View style={styles.simpleRow}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.simpleRowText}>Share with Family</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
              Allow family members to see this medication.
            </Text>
          </View>
          <Switch
            value={data.familyVisible}
            onValueChange={v => onChange({ familyVisible: v })}
            trackColor={{ false: '#E5E7EB', true: '#0FBBA1' }}
            thumbColor={'#FFF'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </View>

      <View style={{ height: 100 }} />
    </View>
  );
}
