import AppIcon from '@/src/components/icons/AppIcon';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles';

interface Props {
    doctorName: string;
    specialty: string;
    time: string;
    onPress?: () => void;
}

export default function AppointmentCard({ doctorName, specialty, time, onPress }: Props) {
    return (
        <TouchableOpacity style={styles.card} activeOpacity={onPress ? 0.7 : 1} onPress={onPress} disabled={!onPress}>
            {/* Top Row: Avatar + Info + Arrow */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {/* Avatar Placeholder */}
                    <Text style={{ fontSize: 24 }}>👨‍⚕️</Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.name}>{doctorName}</Text>
                    <Text style={styles.specialty}>{specialty}</Text>
                </View>
                <View style={styles.arrowContainer}>
                    <AppIcon name='chevron-right' color='#ffffffff' />
                </View>
            </View>

            {/* Time Slot Block */}
            <View style={styles.timeBlock}>
                <Text style={styles.timeText}>{time}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 24,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#E0F7F4',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    specialty: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeBlock: {
        backgroundColor: '#D1F5F1', // Light Teal background
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    timeText: {
        color: '#005c51', // Darker Teal text
        fontWeight: '600',
        fontSize: 14,
    }
});