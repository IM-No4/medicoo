import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RenderMedicationIcon } from '../config/shapes';
import { styles } from '../styles';

const PALETTE = [
  '#FFFFFF', // White
  '#D1D1D6', // Light Grey
  '#FFE5B4', // Cream/Peach
  '#FFC09F', // Peach
  '#DAF7A6', // Lime
  '#A0E8AF', // Green
  // Row 2
  '#7CD6FD', // Sky Blue
  '#8B80F9', // Periwinkle
  '#CFBAF0', // Lavender
  '#FFC6FF', // Pink
  '#FF5D5D', // Red
  '#FF9F1C', // Orange
];

const BACKGROUNDS = [
  '#FFFFFF', // White
  '#D1D1D6', // Light Grey
  '#FFE5B4', // Cream/Peach
  '#FFC09F', // Peach
  '#DAF7A6', // Lime
  '#A0E8AF', // Green
  // Row 2
  '#00C3FF', // Default Blue
  '#8B80F9', // Periwinkle
  '#CFBAF0', // Lavender
  '#FFC6FF', // Pink
  '#FF5D5D', // Red
  '#FF9F1C', // Orange
];

interface ColorStepProps {
  data: any;
  onChange: (data: any) => void;
}

export default function ColorStep({ data, onChange }: ColorStepProps) {
  const renderSection = (label: string, field: string, options: string[]) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.colorLabel}>{label}</Text>
      <View style={styles.colorRow}>
        {options.map(color => {
          const isBackground = field === 'color';
          const isLeftOrRight = field === 'leftColor' || field === 'rightColor';

          const isSelected = data[field] === color ||
            (!data[field] && isBackground && color === '#00C3FF') ||
            (!data[field] && isLeftOrRight && color === '#FFFFFF');

          return (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                isSelected && styles.colorDotSelected,
              ]}
              onPress={() => onChange({ [field]: color })}
            >
              {isSelected && (
                <View style={{
                  width: '100%', height: '100%', borderRadius: 999,
                  borderWidth: 2, borderColor: '#121212'
                }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const isCapsule = data.shape === 'capsule';

  return (
    <View style={styles.stepContainer}>

      {/* Visual Anchor - Preview */}
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

      <Text style={styles.stepTitle}>Choose Colours</Text>

      {isCapsule ? (
        <>
          {renderSection('Left Side', 'leftColor', PALETTE)}
          {renderSection('Right Side', 'rightColor', PALETTE)}
        </>
      ) : (
        renderSection('Color', 'leftColor', PALETTE)
      )}

      {/* Background Color Selection */}
      {renderSection('Background', 'color', BACKGROUNDS)}

      <View style={{ height: 20 }} />
    </View>
  );
}
