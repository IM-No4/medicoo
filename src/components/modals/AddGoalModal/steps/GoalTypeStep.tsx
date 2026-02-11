import { Activity, Droplets, Footprints, Moon, Target } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

const GOAL_TYPES = [
    { id: 'hydration', title: 'Hydration', icon: Droplets, color: '#3B82F6', unit: 'L' },
    { id: 'steps', title: 'Steps', icon: Footprints, color: '#2FA561', unit: 'steps' },
    { id: 'sleep', title: 'Sleep', icon: Moon, color: '#8B5CF6', unit: 'hrs' },
    { id: 'activity', title: 'Activity', icon: Activity, color: '#EF4444', unit: 'mins' },
    { id: 'custom', title: 'Custom Goal', icon: Target, color: '#6B7280', unit: '' },
];

export default function GoalTypeStep({ data, onChange }: any) {
    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What is your goal?</Text>

            {GOAL_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = data.type === type.id;

                return (
                    <TouchableOpacity
                        key={type.id}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                        onPress={() => onChange({ type: type.id, title: type.title, unit: type.unit, color: type.color })}
                    >
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: type.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={20} color={type.color} />
                        </View>
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {type.title}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
