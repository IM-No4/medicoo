import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Activity, Brain, Droplets, Footprints, Heart, Moon, Salad, Settings, Target } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loadOnDeviceSteps, selectTodaySteps } from '../../../redux/slices/deviceSlice';
import { updateGoalProgress } from '../../../redux/slices/goalsSlice';
import { AppDispatch, RootState } from '../../../redux/store';
import { HealthSection } from './HealthSection';

export function GoalsCard() {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<any>();
    const { goals } = useSelector((state: RootState) => state.goals);
    const stepsVal = useSelector(selectTodaySteps);
    const { connectedDevice, onDeviceSteps } = useSelector((state: RootState) => state.device);
    // selectTodaySteps falls back to 0 when there's no real source at all -
    // that 0 must never get written to the backend as if it were an honest
    // "no steps yet today" reading, or it'd stomp a previously-synced value.
    const hasStepsSource = !!connectedDevice || onDeviceSteps !== null;

    // Refresh on-device step count whenever this card comes into view -
    // steps accumulate through the day, so a boot-time read alone would go
    // stale while the app stays open.
    useFocusEffect(
        React.useCallback(() => {
            dispatch(loadOnDeviceSteps());
        }, [dispatch])
    );

    // Filter to only display enabled/active goals on the summary cards
    const activeGoalsList = goals.filter(g => g.enabled === true || g.enabled === undefined);

    // Persist the device-read step count onto the goal itself - without
    // this, the auto-synced number only ever existed in this card's local
    // render (ManageGoalsScreen would show a stale value, and a shared
    // steps goal would never reflect real progress on the friends
    // leaderboard, which reads `current` straight from the database).
    const stepsGoal = activeGoalsList.find(g => g.type === 'steps');
    const stepsGoalId = stepsGoal?.id;
    const storedStepsCurrent = stepsGoal?.current;
    React.useEffect(() => {
        if (stepsGoalId && hasStepsSource && storedStepsCurrent !== stepsVal) {
            dispatch(updateGoalProgress({ id: stepsGoalId, current: stepsVal }));
        }
    }, [stepsGoalId, hasStepsSource, storedStepsCurrent, stepsVal, dispatch]);

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
            <View>
                {processedGoals.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No Active Goals</Text>
                        <Text style={styles.emptySubtitle}>
                            Configure your custom daily steps, hydration, sleep, or activity targets.
                        </Text>
                    </View>
                ) : (
                    processedGoals.map((goal) => {
                        const Icon = getGoalIcon(goal.type);
                        const progressPercent = `${Math.round(goal.progress * 100)}%` as any;

                        return (
                            <TouchableOpacity
                                key={goal.id}
                                style={styles.goalCard}
                                onPress={() => handleGoalPress(goal)}
                                activeOpacity={goal.type === 'steps' ? 1 : 0.7}
                            >
                                <View style={[styles.goalIcon, { backgroundColor: goal.color + '15' }]}>
                                    <Icon size={22} color={goal.color} />
                                </View>
                                <View style={styles.goalInfo}>
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
                        );
                    })
                )}
            </View>
        </HealthSection>
    );
}

const styles = StyleSheet.create({
    // Same card language as AppointmentCard/MedicineCard (border instead of
    // shadow, 48x48/radius-14 icon box) so a goal reads as the same kind of
    // row as a consultation or medicine reminder, instead of the old single
    // shared container with divided rows.
    goalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb76',
    },
    goalInfo: {
        flex: 1,
        marginRight: 8,
    },
    goalIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
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
    /* Empty State styles */
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
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
