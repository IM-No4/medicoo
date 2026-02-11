import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from '../styles';

export default function GoalTargetStep({ data, onChange }: any) {
    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Set your target</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    {data.type === 'custom' ? 'Goal Name' : `Target for ${data.title}`}
                </Text>
                {data.type === 'custom' && (
                    <TextInput
                        style={[styles.input, { marginBottom: 16 }]}
                        placeholder="e.g. Read 20 pages"
                        value={data.title}
                        onChangeText={(v) => onChange({ title: v })}
                    />
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={data.target}
                        onChangeText={(v) => onChange({ target: v })}
                    />
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#6B7280' }}>
                        {data.unit || 'units'}
                    </Text>
                </View>
            </View>

            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 12 }}>
                This will be your daily goal. You can change this anytime.
            </Text>
        </View>
    );
}
