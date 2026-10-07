import { Gauge } from 'lucide-react-native';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

const UNITS = ['mg', 'mcg', 'g', 'ml', '%'];

interface StrengthStepProps {
    data: any;
    onChange: (data: any) => void;
}

export default function StrengthStep({ data, onChange }: StrengthStepProps) {
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

            <Text style={styles.stepTitle}>Add the Medication Strength</Text>

            <Text style={styles.sectionLabel}>Strength</Text>
            <TextInput
                style={styles.input}
                placeholder="Add Strength"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={data.strength}
                onChangeText={value => onChange({ strength: value })}
                returnKeyType="done"
            />

            <Text style={styles.sectionLabel}>Choose Unit</Text>
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
                                {isSelected && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0FBBA1' }} />}
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
