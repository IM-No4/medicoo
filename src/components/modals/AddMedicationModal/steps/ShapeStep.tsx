import { Circle, Pill } from 'lucide-react-native'; // For default static ONLY
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RenderMedicationIcon, SHAPES } from '../config/shapes';
import { styles } from '../styles';

interface ShapeStepProps {
  data: any;
  onChange: (data: any) => void;
}

export default function ShapeStep({ data, onChange }: ShapeStepProps) {
  const commonKeys = ['capsule', 'round', 'oval', 'tablet'];
  const commonShapes = SHAPES.filter(s => commonKeys.includes(s.key));
  const moreShapes = SHAPES.filter(s => !commonKeys.includes(s.key));

  const renderGrid = (items: typeof SHAPES) => (
    <View style={styles.shapeGrid}>
      {items.map((item) => {
        const isSelected = data.shape === item.key;
        return (
          <View key={item.key} style={styles.shapeItem}>
            <TouchableOpacity
              style={[
                styles.shapeCircleBlue,
                isSelected && styles.shapeCircleSelected,
              ]}
              onPress={() => onChange({ shape: item.key })}
            >
              <RenderMedicationIcon shapeKey={item.key} leftColor="#FFF" size={1} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.stepContainer}>

      {/* Visual Anchor - Preview Selected Shape */}
      <View style={styles.iconHeader}>
        <View style={{
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: '#018136ff',
          justifyContent: 'center', alignItems: 'center',
          position: 'relative'
        }}>
          {data.shape ? (
            <RenderMedicationIcon
              shapeKey={data.shape}
              leftColor="#FFF"
              size={1.5}
            />
          ) : (
            <>
              {/* Default Static Composition */}
              <View style={{ transform: [{ rotate: '-45deg' }], position: 'absolute', top: 25, left: 25 }}>
                <Pill size={40} color="#EBEBF5" fill="none" strokeWidth={3} />
              </View>
              <View style={{ position: 'absolute', bottom: 25, right: 25, opacity: 0.5 }}>
                <Circle size={30} color="#EBEBF5" fill="none" strokeWidth={3} />
              </View>
            </>
          )}
        </View>
      </View>

      <Text style={styles.stepTitle}>Choose the Shape</Text>

      {/* Grid 1 */}
      <View style={{ marginTop: 20 }}>
        {renderGrid(commonShapes)}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 10 }]}>More</Text>
      {renderGrid(moreShapes)}

      <View style={{ height: 20 }} />
    </View>
  );
}
