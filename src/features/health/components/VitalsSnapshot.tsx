import { Activity, TrendingUp, Weight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HealthSection } from './HealthSection';

export function VitalsSnapshot() {
    return (
        <HealthSection title="Vitals Snapshot" icon={<Activity size={14} color="#EF4444" />}>
            <View style={styles.vitalsRow}>
                <VitalCard
                    label="Blood Pressure"
                    value="120/80"
                    unit="mmHg"
                    icon={<Activity size={16} color="#3B82F6" />}
                    bgColor="#EFF6FF"
                />
                <VitalCard
                    label="Weight"
                    value="72.5"
                    unit="kg"
                    icon={<Weight size={16} color="#8B5CF6" />}
                    bgColor="#F5F3FF"
                />
            </View>
        </HealthSection>
    );
}

function VitalCard({ label, value, unit, icon, bgColor }: any) {
    return (
        <TouchableOpacity style={styles.vitalCard} activeOpacity={0.8}>
            <View style={styles.vitalTop}>
                <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                    {icon}
                </View>
                <TrendingUp size={14} color="#10B981" />
            </View>
            <View style={styles.vitalBottom}>
                <Text style={styles.vitalValue}>{value}</Text>
                <Text style={styles.vitalUnit}>{unit}</Text>
                <Text style={styles.vitalLabel}>{label}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    vitalsRow: { flexDirection: 'row', gap: 12 },
    vitalCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    vitalTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    vitalBottom: { gap: 2 },
    vitalLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 4 },
    vitalValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
    vitalUnit: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' },
});
