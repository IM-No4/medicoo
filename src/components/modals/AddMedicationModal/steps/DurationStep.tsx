import React, { useMemo } from 'react';
import { Switch, Text, View } from 'react-native';
import { RenderMedicationIcon } from '../config/shapes';
import { createStyles } from '../styles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface DurationStepProps {
  data: any;
  onChange: (data: any) => void;
}

export default function DurationStep({ data, onChange }: DurationStepProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
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

      <Text style={styles.stepTitle}>{t('privacy_visibility')}</Text>

      <Text style={styles.sectionLabel}>{t('permissions')}</Text>
      <View style={styles.listGroup}>
        <View style={styles.simpleRow}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.simpleRowText}>{t('share_with_family')}</Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
              {t('allow_family_members_to_see_this_medic')}
            </Text>
          </View>
          <Switch
            value={data.familyVisible}
            onValueChange={v => onChange({ familyVisible: v })}
            trackColor={{ false: theme.border, true: '#10B981' }}
            thumbColor={'#FFF'}
            ios_backgroundColor={theme.border}
          />
        </View>
      </View>

      <View style={{ height: 100 }} />
    </View>
  );
}
