import { Droplets, Footprints, Plus, Target } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HealthSection } from './HealthSection';

const GOALS = [
    { id: '1', title: 'Hydration', progress: 0.6, current: '1.2L', target: '2.0L', icon: Droplets, color: '#3B82F6' },
    { id: '2', title: 'Daily Steps', progress: 0.8, current: '8,432', target: '10,000', icon: Footprints, color: '#2FA561' },
];

interface GoalsCardProps {
    onAddGoal?: () => void;
}

export function GoalsCard({ onAddGoal }: GoalsCardProps) {
    return (
        <HealthSection title="Active Goals" icon={<Target size={14} color="#3B82F6" />}>
            <View style={styles.card}>
                {GOALS.map((goal, index) => {
                    const Icon = goal.icon;
                    return (
                        <View
                            key={goal.id}
                            style={[index !== GOALS.length - 1 && styles.divider]}
                        >
                            <View style={styles.goalInfo}>
                                <View style={[styles.goalIcon, { backgroundColor: goal.color + '10' }]}>
                                    <Icon size={18} color={goal.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.goalHeader}>
                                        <Text style={styles.goalTitle}>{goal.title}</Text>
                                        <Text style={styles.goalValue}>
                                            {goal.current} / {goal.target}
                                        </Text>
                                    </View>
                                    <View style={styles.goalBarBg}>
                                        <View
                                            style={[
                                                styles.goalBarFill,
                                                { width: `${goal.progress * 100}%`, backgroundColor: goal.color }
                                            ]}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    );
                })}

                <TouchableOpacity
                    style={styles.addGoal}
                    onPress={onAddGoal}
                >
                    <Plus size={16} color="#2FA561" />
                    <Text style={styles.addGoalText}>Set New Goal</Text>
                </TouchableOpacity>
            </View>
        </HealthSection>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        paddingBottom: 16,
        marginBottom: 16
    },
    goalInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    goalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8
    },
    goalTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
    goalValue: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    goalBarBg: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden'
    },
    goalBarFill: {
        height: '100%',
        borderRadius: 3
    },
    addGoal: {
        marginTop: 16,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed'
    },
    addGoalText: { fontSize: 13, color: '#2FA561', fontWeight: '700' },
});
