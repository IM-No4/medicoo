import { HeartPulse } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { HealthRiskAssessmentResult } from '../../../../services/api/healthRiskAssessment.api';
import { ACCENT, styles } from '../styles';

interface Props {
    lastResult: HealthRiskAssessmentResult | null;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function IntroStep({ lastResult }: Props) {
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
                <Text style={[styles.heading, { textAlign: 'center' }]}>A quick wellness check-in</Text>
                <Text style={[styles.subheading, { textAlign: 'center', marginBottom: 0 }]}>
                    10 quick questions about your activity, sleep, nutrition, stress, and habits - just a general
                    wellness snapshot, not a diagnosis.
                </Text>
            </View>

            {lastResult && (
                <View
                    style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        padding: 16,
                        marginTop: 8,
                    }}
                >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 4 }}>
                        LAST CHECK-IN
                    </Text>
                    <Text style={{ fontSize: 14, color: '#475569', fontWeight: '500' }}>
                        {formatDate(lastResult.createdAt)} - overall {lastResult.overallBucket}
                    </Text>
                </View>
            )}
        </View>
    );
}
