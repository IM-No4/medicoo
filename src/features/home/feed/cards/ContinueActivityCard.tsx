import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { ContinueActivityFeedItem } from '../feed.types';

type Props = {
    data: ContinueActivityFeedItem;
};

function ContinueActivityCard({ data }: Props) {
    const navigation = useNavigation<any>();

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            // Placeholder for navigation logic based on actionIdentifier
            onPress={() => console.log('Resume Action:', data.actionIdentifier)}
        >
            <View style={styles.iconBox}>
                <AppIcon name={data.icon as any} size={24} color="#F59E0B" />
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>{data.subtitle}</Text>
                <Text style={styles.title}>{data.title}</Text>

                {data.progress !== undefined && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${data.progress * 100}%` }]} />
                    </View>
                )}
            </View>

            <View style={styles.actionBtn}>
                <Text style={styles.actionText}>{data.ctaText}</Text>
                <AppIcon name="chevron-right" size={16} color="#4F46E5" />
            </View>
        </TouchableOpacity>
    );
}

export default React.memo(ContinueActivityCard);

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        marginBottom: 28,
        backgroundColor: '#FFFBEB', // Light amber background for attention
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7',
        // Subtle shadow
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#FED7AA'
    },
    content: {
        flex: 1,
    },
    subtitle: {
        fontSize: 11,
        color: '#92400E',
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#FDE68A',
        borderRadius: 2,
        width: '80%',
        overflow: 'hidden'
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#F59E0B',
        borderRadius: 2
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5'
    }
});
