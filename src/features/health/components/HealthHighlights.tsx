import { AlertCircle, CheckCircle2, Sparkles, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { HealthSection } from './HealthSection';

interface Highlight {
    text: string;
    color: string;
    bgColor: string;
    icon: ReactNode;
}

// Below this, a change between two logged readings is treated as normal
// fluctuation rather than a real trend worth surfacing.
const BP_THRESHOLD_MMHG = 3;
const WEIGHT_THRESHOLD_KG = 0.3;

export function HealthHighlights() {
    const { records } = useSelector((state: RootState) => state.vitals);
    const { data: calendarData } = useSelector((state: RootState) => state.calendar);

    const highlights: Highlight[] = [];

    const takenDoses = calendarData?.progress?.taken ?? 0;
    const totalDoses = calendarData?.progress?.total ?? 0;
    if (totalDoses > 0) {
        if (takenDoses >= totalDoses) {
            highlights.push({
                text: 'All doses taken today',
                color: '#2FA561',
                bgColor: '#F0FDF4',
                icon: <CheckCircle2 size={18} color="#2FA561" />,
            });
        } else {
            const missed = totalDoses - takenDoses;
            highlights.push({
                text: `${missed} dose${missed > 1 ? 's' : ''} missed today`,
                color: '#EF4444',
                bgColor: '#FEF2F2',
                icon: <AlertCircle size={18} color="#EF4444" />,
            });
        }
    }

    // records is newest-first (see vitalsSlice) - comparing the two most
    // recently logged readings is a real trend from the user's own data,
    // unlike a fixed "this week" window we have no way to actually compute
    // without a dedicated historical-adherence query.
    const latest = records[0];
    const previous = records[1];

    if (latest?.systolic !== undefined && previous?.systolic !== undefined) {
        const delta = latest.systolic - previous.systolic;
        if (Math.abs(delta) >= BP_THRESHOLD_MMHG) {
            const improved = delta < 0;
            highlights.push({
                text: improved ? 'Blood pressure improved since your last reading' : 'Blood pressure up since your last reading',
                color: improved ? '#10B981' : '#F59E0B',
                bgColor: improved ? '#F0FDF4' : '#FFFBEB',
                icon: improved ? <TrendingDown size={18} color="#10B981" /> : <TrendingUp size={18} color="#F59E0B" />,
            });
        }
    }

    if (latest?.weight !== undefined && previous?.weight !== undefined) {
        const delta = latest.weight - previous.weight;
        if (Math.abs(delta) >= WEIGHT_THRESHOLD_KG) {
            const down = delta < 0;
            highlights.push({
                text: `Weight ${down ? 'down' : 'up'} ${Math.abs(delta).toFixed(1)}kg since your last log`,
                color: '#8B5CF6',
                bgColor: '#F5F3FF',
                icon: down ? <TrendingDown size={18} color="#8B5CF6" /> : <TrendingUp size={18} color="#8B5CF6" />,
            });
        }
    }

    return (
        <HealthSection title="Recent Highlights" icon={<Sparkles size={14} color="#8B5CF6" fill="#8B5CF6" />}>
            <View style={styles.container}>
                {highlights.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            Log your vitals and medications to see personalized highlights here.
                        </Text>
                    </View>
                ) : (
                    highlights.map((item, i) => (
                        <View key={i} style={[styles.highlight, { backgroundColor: item.bgColor }]}>
                            {item.icon}
                            <Text style={[styles.highlightText, { color: item.color }]}>{item.text}</Text>
                        </View>
                    ))
                )}
            </View>
        </HealthSection>
    );
}

const styles = StyleSheet.create({
    container: { gap: 12 },
    highlight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)'
    },
    highlightText: { fontSize: 14, fontWeight: '600', flex: 1 },
    emptyState: {
        borderRadius: 16,
        padding: 20,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    emptyText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
    },
});
