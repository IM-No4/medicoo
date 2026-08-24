import { Circle, Hexagon, Pill } from 'lucide-react-native';
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
      {/* Visual Anchor - Dimensions/Specs Theme */}
      <View style={styles.iconHeader}>
        <View style={{ width: 140, height: 120, position: 'relative', alignItems: 'center' }}>
          {/* Composition */}

          {/* Pill - Blue/Cyan */}
          <View style={{ position: 'absolute', top: 20, left: 30, transform: [{ rotate: '-45deg' }] }}>
            <Pill size={48} color="#00C3FF" fill="none" strokeWidth={2.5} />
            {/* Measurement Line Top */}
            <View style={{
              position: 'absolute', top: -10, left: -5, right: -5, height: 8,
              borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#00C3FF', opacity: 0.6
            }} />
          </View>

          {/* Hexagon - Green */}
          <View style={{ position: 'absolute', top: 15, right: 25 }}>
            <Hexagon size={36} color="#D4F6CC" strokeWidth={2.5} />
          </View>

          {/* Circle - Pink with crosshair feel */}
          <View style={{ position: 'absolute', bottom: 15, alignSelf: 'center' }}>
            <Circle size={40} color="#FF66C4" strokeWidth={2.5} />
            {/* Internal markings */}
            <View style={{
              position: 'absolute', top: 10, left: 20, width: 0, height: 20,
              borderLeftWidth: 1, borderColor: '#FF66C4'
            }} />
            <View style={{
              position: 'absolute', top: 20, left: 10, width: 20, height: 0,
              borderTopWidth: 1, borderColor: '#FF66C4'
            }} />
          </View>

          {/* Measurement Dashed Line Vertical */}
          <View style={{
            position: 'absolute', right: 10, top: 40, bottom: 20, width: 10,
            borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1,
            borderColor: '#FF66C4', borderStyle: 'dashed', opacity: 0.6
          }} />

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
