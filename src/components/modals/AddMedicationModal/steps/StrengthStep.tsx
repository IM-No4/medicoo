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

            {/* Visual Anchor - Strength/Dose Theme */}
            <View style={styles.iconHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 80, gap: 10 }}>
                    {/* Outline Circle/Pill - Green */}
                    <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: '#DAF7A6', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: 30, borderTopWidth: 2, borderColor: '#DAF7A6', borderStyle: 'dotted' }} />
                    </View>
                    {/* Filled Pill - Blue with midline */}
                    <View style={{ width: 40, height: 60, borderRadius: 20, borderWidth: 3, borderColor: '#00C3FF', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: 30, borderTopWidth: 2, borderColor: '#00C3FF', borderStyle: 'dotted' }} />
                    </View>
                    {/* Filled Pill - Dark Blue */}
                    <View style={{ width: 40, height: 80, borderRadius: 20, borderWidth: 3, borderColor: '#2F80ED', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: 30, borderTopWidth: 2, borderColor: '#2F80ED', borderStyle: 'dotted' }} />
                    </View>
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
                                {isSelected && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2F80ED' }} />}
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
