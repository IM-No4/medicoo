import { Activity, ChevronRight, Pill, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HealthSection } from './HealthSection';

const TODAY_FOCUS = [
    { id: '1', title: '2 medications due this evening', icon: Pill, urgent: true, time: 'By 8:00 PM' },
    { id: '2', title: 'Log blood pressure', icon: Activity, urgent: false, time: 'Pending' },
];

export function TodaysFocus() {
    return (
        <HealthSection title="Today's Focus" icon={<Zap size={14} color="#F59E0B" fill="#F59E0B" />}>
            <View style={styles.card}>
                {TODAY_FOCUS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.row,
                                index !== TODAY_FOCUS.length - 1 && styles.divider
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconBox,
                                    item.urgent ? styles.urgentBg : styles.normalBg
                                ]}
                            >
                                <Icon size={20} color={item.urgent ? '#EF4444' : '#2FA561'} />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowText}>{item.title}</Text>
                                <Text style={styles.timeText}>{item.time}</Text>
                            </View>
                            <ChevronRight size={18} color="#D1D5DB" />
                        </TouchableOpacity>
                    );
                })}
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
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowText: { fontSize: 15, fontWeight: '700', color: '#111827' },
    timeText: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    urgentBg: { backgroundColor: '#FEF2F2' },
    normalBg: { backgroundColor: '#F0FDF4' },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        paddingBottom: 16,
        marginBottom: 16
    },
});
