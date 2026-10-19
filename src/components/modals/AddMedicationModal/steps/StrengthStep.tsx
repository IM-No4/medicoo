import { Gauge } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createStyles } from '../styles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useLanguage } from '../../../../i18n/LanguageContext';

const UNITS = ['mg', 'mcg', 'g', 'ml', '%'];

interface StrengthStepProps {
    data: any;
    onChange: (data: any) => void;
}

export default function StrengthStep({ data, onChange }: StrengthStepProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    return (
        <View style={styles.stepContainer}>

            {/* Visual Anchor - plain icon-in-circle, same recipe used
                everywhere else in the app rather than a bespoke bar-chart
                composition. */}
            <View style={styles.iconHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#8B5CF6' }]}>
                    <Gauge size={36} color="#FFFFFF" />
                </View>
            </View>

            <Text style={styles.stepTitle}>{t('add_the_medication_strength')}</Text>

            <Text style={styles.sectionLabel}>{t('strength')}</Text>
            <TextInput
                style={styles.input}
                placeholder={t('add_strength')}
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={data.strength}
                onChangeText={value => onChange({ strength: value })}
                returnKeyType="done"
            />

            <Text style={styles.sectionLabel}>{t('choose_unit')}</Text>
            <View style={styles.listGroup}>
                {UNITS.map((unit, index) => {
                    const isLast = index === UNITS.length - 1;
                    const isSelected = data.unit === unit;

                    return (
                        <View key={unit}>
                            <TouchableOpacity
                                style={styles.listItem}
                                onPress={() => onChange({ unit })}
                            >
                                <Text style={[
                                    styles.listItemText,
                                    isSelected && styles.listItemTextSelected
                                ]}>
                                    {unit}
                                </Text>
                                {isSelected && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />}
                            </TouchableOpacity>
                            {!isLast && <View style={styles.separator} />}
                        </View>
                    );
                })}
            </View>

            <View style={{ height: 20 }} />

        </View>
    );
}
