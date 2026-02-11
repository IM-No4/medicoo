import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { TrustSignalFeedItem } from '../feed.types';

type Props = {
    data: TrustSignalFeedItem;
};

function TrustSignalCard({ data }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <AppIcon name={data.icon as any} size={20} color="#059669" />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{data.title}</Text>
                    <Text style={styles.description}>{data.description}</Text>
                </View>
                <AppIcon name="shield-check" size={16} color="#D1FAE5" />
            </View>
        </View>
    );
}

export default React.memo(TrustSignalCard);

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginBottom: 28,
        alignItems: 'center'
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.08)', // Soft green bg
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 99,
        gap: 10
    },
    textContainer: {
        flexDirection: 'column'
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        color: '#064E3B'
    },
    description: {
        fontSize: 10, // Hidden or very small if needed, design usually has just one line.
        // Adjusting to one line layout
        display: 'none'
    }
});
