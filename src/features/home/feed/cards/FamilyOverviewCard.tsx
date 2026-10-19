import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { FeedAction } from '../feed.actions';
import { FamilyOverviewFeedItem } from '../feed.types';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

type Props = {
    data: FamilyOverviewFeedItem;
    onAction?: (action: FeedAction) => void;
};

function FamilyOverviewCard({ data, onAction }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

    const handleManage = () => {
        onAction?.({
            type: 'NAVIGATE',
            screen: 'FamilyMembersModal'
        } as any);
    };

    const handleAddMember = () => {
        onAction?.({
            type: 'NAVIGATE',
            screen: 'AddFamilyMember'
        } as any);
    };

    const handleMemberPress = (memberId: string) => {
        // Since we don't have full member details here to edit, 
        // we navigate to the list where they can be managed.
        onAction?.({
            type: 'NAVIGATE',
            screen: 'FamilyMembersModal'
        } as any);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{data.title}</Text>
                <TouchableOpacity onPress={handleManage}>
                    <Text style={styles.manageText}>{t('manage')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.membersRow}>
                {data.members.map((member) => (
                    <TouchableOpacity
                        key={member.id}
                        style={styles.memberItem}
                        onPress={() => handleMemberPress(member.id)}
                    >
                        <View style={styles.avatarContainer}>
                            {member.image ? (
                                <Image source={{ uri: member.image }} style={styles.avatar} />
                            ) : (
                                <View style={styles.placeholderAvatar}>
                                    <Text style={styles.initial}>{(member.name || '?').charAt(0)}</Text>
                                </View>
                            )}

                            {member.alerts ? (
                                <View style={styles.alertBadge}>
                                    <Text style={styles.alertText}>{member.alerts}</Text>
                                </View>
                            ) : null}
                        </View>

                        <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>

                        {member.statusText ? (
                            <Text style={styles.statusText}>{member.statusText}</Text>
                        ) : (
                            <Text style={styles.relationText}>{member.relation}</Text>
                        )}
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={styles.addMemberBtn}
                    onPress={handleAddMember}
                >
                    <View style={styles.addIconBox}>
                        <AppIcon name="plus" size={20} color={theme.textSecondary} />
                    </View>
                    <Text style={styles.addText}>{t('add_new')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default React.memo(FamilyOverviewCard);

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: c.text,
    },
    manageText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2563EB',
    },
    membersRow: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap'
    },
    memberItem: {
        alignItems: 'center',
        width: 64
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        position: 'relative',
        marginBottom: 8,
        // Ring for active feel
        borderWidth: 2,
        borderColor: c.border,
        padding: 2
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 28
    },
    placeholderAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        backgroundColor: c.infoBg,
        alignItems: 'center',
        justifyContent: 'center'
    },
    initial: {
        fontSize: 20,
        fontWeight: '700',
        color: '#3B82F6'
    },
    alertBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    alertText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '700'
    },
    memberName: {
        fontSize: 12,
        fontWeight: '600',
        color: c.text,
        marginBottom: 2
    },
    relationText: {
        fontSize: 10,
        color: c.textMuted
    },
    statusText: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: '600'
    },
    addMemberBtn: {
        alignItems: 'center',
        width: 64
    },
    addIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: c.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    addText: {
        fontSize: 11,
        color: c.textSecondary,
        fontWeight: '500'
    }
});
