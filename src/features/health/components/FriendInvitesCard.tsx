import { useNavigation } from '@react-navigation/native';
import { Check, ChevronRight, UserPlus, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { acceptFriendRequest, rejectFriendRequest } from '../../../redux/slices/friendsSlice';
import type { AppDispatch, RootState } from '../../../redux/store';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

const SHOWN = 2;

/**
 * People who want to be your friend and are waiting for an answer. Renders nothing when there are none, so the Health screen looks
 * exactly as before until someone invites you.
 */
export function FriendInvitesCard() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const requests = useSelector((state: RootState) => state.friends.incomingRequests);

  if (requests.length === 0) return null;

  const initial = (name?: string) => (name || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headIcon}>
          <UserPlus size={16} color="#10B981" />
        </View>
        <Text style={styles.title}>
          {requests.length === 1 ? '1 friend request' : `${requests.length} friend requests`}
        </Text>
      </View>

      {requests.slice(0, SHOWN).map((request) => (
        <View key={request.id} style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial(request.profile?.name)}</Text>
          </View>
          <View style={styles.who}>
            <Text style={styles.name} numberOfLines={1}>{request.profile?.name || 'Medicoo User'}</Text>
            <Text style={styles.sub} numberOfLines={1}>wants to compare goals with you</Text>
          </View>
          <TouchableOpacity style={[styles.round, styles.accept]} onPress={() => dispatch(acceptFriendRequest(request.id))} activeOpacity={0.7}>
            <Check size={16} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.round, styles.decline]} onPress={() => dispatch(rejectFriendRequest(request.id))} activeOpacity={0.7}>
            <X size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}

      {requests.length > SHOWN ? (
        <TouchableOpacity style={styles.more} onPress={() => navigation.navigate('Friends')} activeOpacity={0.7}>
          <Text style={styles.moreText}>See all {requests.length}</Text>
          <ChevronRight size={14} color="#10B981" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 20,
      marginTop: 12,
      marginBottom: 4,
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.borderLight,
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    headIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: c.successBg, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 13.5, fontWeight: '700', color: c.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.successBg, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 14, fontWeight: '800', color: '#10B981' },
    who: { flex: 1 },
    name: { fontSize: 13, fontWeight: '700', color: c.text },
    sub: { fontSize: 11.5, color: c.textSecondary, marginTop: 1 },
    round: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    accept: { backgroundColor: c.successBg },
    decline: { backgroundColor: c.errorBg },
    more: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2, marginTop: 4, paddingVertical: 4 },
    moreText: { fontSize: 12.5, fontWeight: '700', color: '#10B981' },
  });
