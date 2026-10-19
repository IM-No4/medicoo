import { Pill } from 'lucide-react-native'; // For default (no shape chosen yet) state only
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RenderMedicationIcon, SHAPES } from '../config/shapes';
import { createStyles } from '../styles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface ShapeStepProps {
  data: any;
  onChange: (data: any) => void;
}

export default function ShapeStep({ data, onChange }: ShapeStepProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
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
              {/* Separate, shadow-less overlay for the selection ring - see
                  shapeSelectedRing's comment in styles.ts for why this
                  can't just be a borderWidth on shapeCircleBlue itself. */}
              {isSelected && <View style={styles.shapeSelectedRing} pointerEvents="none" />}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.stepContainer}>

      {/* Visual Anchor - Preview Selected Shape, same iconCircle recipe
          used on every other step; falls back to a plain pill icon before
          a shape's been picked instead of a bespoke composition. */}
      <View style={styles.iconHeader}>
        <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
          {data.shape ? (
            <RenderMedicationIcon
              shapeKey={data.shape}
              leftColor="#FFF"
              size={1.5}
            />
          ) : (
            <Pill size={36} color="#FFFFFF" />
          )}
        </View>
      </View>

      <Text style={styles.stepTitle}>{t('choose_the_shape')}</Text>

      {/* Grid 1 */}
      <View style={{ marginTop: 20 }}>
        {renderGrid(commonShapes)}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 10 }]}>{t('more')}</Text>
      {renderGrid(moreShapes)}

      <View style={{ height: 20 }} />
    </View>
  );
}
