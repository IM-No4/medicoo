import { HeartPulse } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { HealthRiskAssessmentResult } from '../../../../services/api/healthRiskAssessment.api';
import { ACCENT, createStyles } from '../styles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface Props {
    lastResult: HealthRiskAssessmentResult | null;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function IntroStep({ lastResult }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    return (
        <View style={styles.container}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View
                    style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: ACCENT + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                    }}
                >
                    <HeartPulse size={32} color={ACCENT} />
                </View>
                <Text style={[styles.heading, { textAlign: 'center' }]}>{t('a_quick_wellness_check_in')}</Text>
                <Text style={[styles.subheading, { textAlign: 'center', marginBottom: 0 }]}>
                    10 quick questions about your activity, sleep, nutrition, stress, and habits - just a general
                    wellness snapshot, not a diagnosis.
                </Text>
            </View>

            {lastResult && (
                <View
                    style={{
                        backgroundColor: theme.cardSecondary,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.border,
                        padding: 16,
                        marginTop: 8,
                    }}
                >
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: theme.textMuted, marginBottom: 4 }}>
                        {t('last_check_in')}
                    </Text>
                    <Text style={{ fontSize: 12.5, color: theme.textSecondary, fontWeight: '500' }}>
                        {formatDate(lastResult.createdAt)} - overall {lastResult.overallBucket}
                    </Text>
                </View>
            )}
        </View>
    );
}
