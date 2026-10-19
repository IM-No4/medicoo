import React, { useMemo } from 'react';
import { Text, TextInput, View } from 'react-native';
import MedicalDisclaimerNote from '../../../MedicalDisclaimerNote';
import { RenderMedicationIcon } from '../config/shapes';
import { createStyles } from '../styles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface ReviewStepProps {
  data: any;
  onChange: (data: any) => void;
}

export default function ReviewStep({ data, onChange }: ReviewStepProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
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
        <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
          {data.medicineName || 'Medication'}
        </Text>
        <Text style={{ fontSize: 16, color: theme.textSecondary }}>
          {data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : 'Type'}
        </Text>
      </View>

      {/* Schedule */}
      <Text style={styles.sectionLabel}>{t('schedule')}</Text>
      <View style={[styles.listGroup, { padding: 16 }]}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
          {data.frequency || 'Every Day'}
        </Text>
        <Text style={{ fontSize: 15, color: theme.text, marginBottom: 12 }}>
          {timesSummary || 'No time set'}  <Text style={{ color: theme.textSecondary }}>1 {doseLabel}</Text>
        </Text>

        <View style={{ height: 1, backgroundColor: theme.cardSecondary, marginVertical: 12 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 15, color: theme.textSecondary }}>
            {startText}
          </Text>
          <Text style={{ fontSize: 15, color: theme.textSecondary }}>
            {endText}
          </Text>
        </View>
      </View>

      {/* Privacy */}
      <Text style={styles.sectionLabel}>{t('privacy')}</Text>
      <View style={[styles.listGroup, { padding: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 15, color: theme.text }}>{t('visibility')}</Text>
          <Text style={{ fontSize: 15, color: theme.textSecondary }}>
            {data.familyVisible ? 'Shared with Family' : 'Private'}
          </Text>
        </View>
      </View>

      {/* Optional Details */}
      <Text style={styles.sectionLabel}>{t('optional_details')}</Text>

      <View style={{ marginBottom: 16 }}>
        <TextInput
          style={styles.input}
          placeholder={t('display_name')}
          placeholderTextColor={theme.textMuted}
          value={data.displayName}
          onChangeText={text => onChange({ displayName: text })}
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <TextInput
          style={[styles.input, { height: 100, paddingTop: 16 }]}
          placeholder={t('notes')}
          placeholderTextColor={theme.textMuted}
          multiline
          textAlignVertical="top" // Android
          value={data.notes}
          onChangeText={text => onChange({ notes: text })}
        />
      </View>

      <MedicalDisclaimerNote variant="medication" style={{ paddingHorizontal: 0 }} />

      <View style={{ height: 100 }} />
    </View>
  );
}
