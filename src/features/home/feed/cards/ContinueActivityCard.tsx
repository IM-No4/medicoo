import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import AppIcon from '../../../../components/icons/AppIcon';
import { dismissActivity } from '../../../../redux/slices/activitySlice';
import { AppDispatch } from '../../../../redux/store';
import { ContinueActivityFeedItem } from '../feed.types';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';

type Props = {
    data: ContinueActivityFeedItem;
};

function ContinueActivityCard({ data }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const dispatch = useDispatch<AppDispatch>();

    const handleResume = () => {
        if (data.action && data.action.type === 'NAVIGATE') {
            const { stack, screen, params } = data.action as any;
            navigation.navigate(stack, { screen, params });
        }
    };

    const handleDismiss = () => {
        dispatch(dismissActivity());
    };

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={handleResume}
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

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleResume}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.actionText}>{data.ctaText}</Text>
                    <AppIcon name="chevron-right" size={14} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.dismissBtn}
                onPress={handleDismiss}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <AppIcon name="x" size={14} color={theme.textMuted} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

export default React.memo(ContinueActivityCard);

const createStyles = (c: ThemeColors) => StyleSheet.create({
    card: {
        marginHorizontal: 24,
        // Matches every other feed card's marginBottom:28 - this was 20,
        // making the gap after this card noticeably tighter than the rest
        // of the feed's otherwise-uniform rhythm.
        marginBottom: 30,
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        // Flat border-only look, same as the other feed cards
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: c.warningBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    content: {
        flex: 1,
        paddingRight: 24,
    },
    subtitle: {
        fontSize: 10,
        color: c.warning,
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: c.text,
        marginBottom: 6,
    },
    progressContainer: {
        height: 4,
        backgroundColor: c.cardSecondary,
        borderRadius: 2,
        width: '100%',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#F59E0B',
        borderRadius: 2,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 3,
        marginTop: 10,
        marginRight: -24,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
        color: c.primary,
    },
    dismissBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: c.cardSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
