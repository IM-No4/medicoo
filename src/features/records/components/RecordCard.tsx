import { ChevronRight, File, FileText, FlaskConical, Image as ImageIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
    text: '#111827',
    textSecondary: '#6B7280',
    card: '#FFFFFF',
};

interface Props {
    title: string;
    subtitle: string;
    type: string;
    date: string;
    iconName: any;
    iconColor: string;
    iconBg: string; // Background color for icon box
    variant?: 'elevated' | 'soft';
    onPress?: () => void;
}

export default function RecordCard({
    title,
    subtitle,
    type,
    date,
    iconName,
    iconColor,
    iconBg,
    variant = 'elevated',
    onPress,
}: Props) {

    // Lucide Icon Mapping based on the 'iconName' string provided by parent
    const renderIcon = () => {
        const size = 22;
        switch (iconName) {
            case 'flask': return <FlaskConical size={size} color={iconColor} />;
            case 'image': return <ImageIcon size={size} color={iconColor} />;
            case 'file-text': return <FileText size={size} color={iconColor} />;
            default: return <File size={size} color={iconColor} />;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                variant === 'soft' && styles.softCard
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                {renderIcon()}
            </View>

            <View style={styles.cardContent}>
                <View style={styles.topRow}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {/* Optional: Add status dot or indicator here if needed */}
                </View>
                <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>

                <View style={styles.metaRow}>
                    <Text style={styles.dateText}>{date}</Text>
                </View>
            </View>

            <View style={styles.arrowContainer}>
                <ChevronRight size={18} color="#D1D5DB" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    softCard: {
        backgroundColor: '#fff',
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    arrowContainer: {
        paddingLeft: 8,
    }
});
