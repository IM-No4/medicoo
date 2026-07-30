import { Droplets, Footprints, Moon, Activity, Target, Plus, Settings, Salad, Brain, Heart } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../../redux/store';
import { HealthSection } from './HealthSection';
import { updateGoalProgress } from '../../../redux/slices/goalsSlice';

interface GoalsCardProps {
    onAddGoal?: () => void;
}

export function GoalsCard({ onAddGoal }: GoalsCardProps) {
    const dispatch = useDispatch();
    const navigation = useNavigation<any>();
    const { goals } = useSelector((state: RootState) => state.goals);
    const { connectedDevice } = useSelector((state: RootState) => state.device);

    const stepsVal = connectedDevice?.data?.steps ?? 0;

    // Filter to only display enabled/active goals on the summary cards
    const activeGoalsList = goals.filter(g => g.enabled === true || g.enabled === undefined);

    const processedGoals = activeGoalsList.map(goal => {
        let current = goal.current;
        
        // Auto-sync steps goal from wearable device if connected
        if (goal.type === 'steps') {
            current = stepsVal;
        }

        const progress = Math.min(1, current / (goal.target || 1));

        return {
            ...goal,
            current,
            progress
        };
    });

    const getGoalIcon = (type: string) => {
        switch (type) {
            case 'hydration': return Droplets;
            case 'steps': return Footprints;
            case 'sleep': return Moon;
            case 'activity': return Activity;
            case 'nutrition': return Salad;
            case 'meditation': return Brain;
            case 'heartrate': return Heart;
            default: return Target;
        }
    };

    const handleGoalPress = (goal: any) => {
        // Quick progress helper for manual metrics (tap to increment)
        if (goal.type === 'steps') return; // Managed by wearable device sync

        let increment = 1;
        if (goal.type === 'hydration') increment = 0.25;
        if (goal.type === 'activity') increment = 10;

        const nextVal = parseFloat((goal.current + increment).toFixed(2));
        const finalVal = Math.min(goal.target, nextVal);

        dispatch(updateGoalProgress({ id: goal.id, current: finalVal }));
    };

    const handleManageNavigation = () => {
        navigation.navigate('ManageGoals');
    };

    return (
        <HealthSection 
            title="Active Goals" 
            icon={
                <TouchableOpacity
                    style={styles.manageHeaderBtn}
                    onPress={handleManageNavigation}
                    activeOpacity={0.7}
                >
                    <Settings size={12} color="#3B82F6" style={{ marginRight: 4 }} />
                    <Text style={styles.manageHeaderBtnText}>Manage</Text>
                </TouchableOpacity>
            }
        >
            <View style={styles.card}>
                {processedGoals.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No Active Goals</Text>
                        <Text style={styles.emptySubtitle}>
                            Configure your custom daily steps, hydration, sleep, or activity targets.
                        </Text>
                    </View>
                ) : (
                    processedGoals.map((goal, index) => {
                        const Icon = getGoalIcon(goal.type);
                        const progressPercent = `${Math.round(goal.progress * 100)}%` as any;

                        return (
                            <View
                                key={goal.id}
                                style={[styles.goalItem, index !== processedGoals.length - 1 && styles.divider]}
                            >
                                <TouchableOpacity 
                                    style={styles.goalInfo}
                                    onPress={() => handleGoalPress(goal)}
                                    activeOpacity={goal.type === 'steps' ? 1 : 0.7}
                                >
                                    <View style={[styles.goalIcon, { backgroundColor: goal.color + '15' }]}>
                                        <Icon size={18} color={goal.color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.goalHeader}>
                                            <Text style={styles.goalTitle}>{goal.title}</Text>
                                            <Text style={styles.goalValue}>
                                                {goal.current} / {goal.target} {goal.unit}
                                            </Text>
                                        </View>
                                        <View style={styles.goalBarBg}>
                                            <View
                                                style={[
                                                    styles.goalBarFill,
                                                    { width: progressPercent, backgroundColor: goal.color }
                                                ]}
                                            />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        );
                    })
                )}

                <TouchableOpacity
                    style={styles.addGoal}
                    onPress={onAddGoal}
                    activeOpacity={0.7}
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
    goalItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        paddingBottom: 16,
        marginBottom: 16
    },
    goalInfo: { 
        flex: 1,
        flexDirection: 'row', 
        gap: 12, 
        alignItems: 'center',
    },
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
    /* Empty State styles */
    emptyContainer: {
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20,
    },
    /* Manage Header Button */
    manageHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: '#EFF6FF',
    },
    manageHeaderBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#3B82F6',
    },
});
