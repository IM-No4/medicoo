import { Pill } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TextInput, View } from 'react-native';
import { createStyles } from '../styles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useLanguage } from '../../../../i18n/LanguageContext';

export default function MedicationDetailsStep({
  data,
  onChange,
  onNext,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
  return (
    <View style={styles.stepContainer}>

      {/* Visual Anchor - plain icon-in-circle, same recipe used everywhere
          else in the app (Medo's avatar, LogVitals field icons) rather
          than a bespoke composition. */}
      <View style={styles.iconHeader}>
        <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
          <Pill size={36} color="#FFFFFF" />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.stepTitle}>{t('medication_name')}</Text>
      <Text style={styles.stepSubtitle}>
        {t('enter_the_name_of_your_medication')}
      </Text>

      {/* Input */}
      <TextInput
        style={styles.input}
        placeholder={t('add_medication_name')}
        placeholderTextColor={theme.textSecondary}
        value={data.medicineName}
        onChangeText={value => onChange({ medicineName: value })}
        autoFocus
        returnKeyType="done"
      />


    </View>
  );
}
