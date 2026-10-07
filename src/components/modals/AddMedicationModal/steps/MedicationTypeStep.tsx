import { Layers } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

const COMMON_FORMS = [
  'Capsule',
  'Tablet',
  'Liquid',
  'Topical',
];

const MORE_FORMS = [
  'Cream',
  'Device',
  'Foam',
  'Drops',
  'Spray',
  'Inhaler',
  'Injection',
  'Patch',
  'Powder',
  'Suppository'
];

export default function MedicationTypeStep({ data, onChange, onNext }) {
  const renderList = (items: string[]) => (
    <View style={styles.listGroup}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isSelected = data.type === item.toLowerCase();

        return (
          <View key={item}>
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => onChange({ type: item.toLowerCase() })}
            >
              <Text style={[
                styles.listItemText,
                isSelected && styles.listItemTextSelected
              ]}>
                {item}
              </Text>
              {isSelected && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0FBBA1' }} />}
            </TouchableOpacity>
            {!isLast && <View style={styles.separator} />}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.stepContainer}>
      {/* Visual Anchor - plain icon-in-circle, same recipe used everywhere
          else in the app rather than a bespoke measurement-diagram
          composition. */}
      <View style={styles.iconHeader}>
        <View style={[styles.iconCircle, { backgroundColor: '#3B82F6' }]}>
          <Layers size={36} color="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.stepTitle}>Choose the Medication Type</Text>

      <Text style={styles.sectionLabel}>Common Forms</Text>
      {renderList(COMMON_FORMS)}

      <Text style={styles.sectionLabel}>More Forms</Text>
      {renderList(MORE_FORMS)}

      {/* Extra padding for scroll */}
      <View style={{ height: 20 }} />

    </View>
  );
}
