import { Check } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../../components/ThemedModal';
import { fetchFriends, FriendEntry } from '../../../services/api/friends.api';
import type { ShareMode } from '../../../services/api/goals.api';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

interface Props {
  visible: boolean;
  goalTitle: string;
  initialMode: ShareMode;
  initialFriendIds: string[];
  busy?: boolean;
  onSave: (mode: ShareMode, friendIds: string[]) => void;
  onClose: () => void;
}

const OPTIONS: { mode: ShareMode; title: string; sub: string }[] = [
  { mode: 'all', title: 'All my friends', sub: 'Anyone who shares the same goal back can compare with you.' },
  { mode: 'selected', title: 'Only some friends', sub: 'Pick who can see this goal. Everyone else sees nothing.' },
  { mode: 'none', title: 'Nobody', sub: 'Keep this goal private.' },
];

/** Who a goal is shared with. A friend only ever sees it if they share the same kind of goal back with you, so it is always a fair race. */
export default function ShareGoalSheet({ visible, goalTitle, initialMode, initialFriendIds, busy, onSave, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ShareMode>(initialMode);
  const [picked, setPicked] = useState<string[]>(initialFriendIds);
  const [friends, setFriends] = useState<FriendEntry[] | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMode(initialMode);
    setPicked(initialFriendIds);
    setFriends(null);
    fetchFriends().then(setFriends).catch(() => setFriends([]));
  }, [visible, initialMode, initialFriendIds]);

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Share {goalTitle}</Text>
          <Text style={styles.subtitle}>Choose who can see your progress on this goal.</Text>

          {OPTIONS.map((option) => (
            <TouchableOpacity key={option.mode} style={[styles.option, mode === option.mode && styles.optionActive]} onPress={() => setMode(option.mode)} activeOpacity={0.8}>
              <View style={[styles.radio, mode === option.mode && styles.radioActive]}>{mode === option.mode ? <View style={styles.radioDot} /> : null}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSub}>{option.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {mode === 'selected' ? (
            <View style={styles.friendsBox}>
              {friends === null ? (
                <ActivityIndicator color="#10B981" style={{ marginVertical: 12 }} />
              ) : friends.length === 0 ? (
                <Text style={styles.note}>You have no friends yet. Add one from the Friends screen.</Text>
              ) : (
                <ScrollView style={{ maxHeight: 220 }}>
                  {friends.map((friend) => {
                    const on = picked.includes(String(friend.id));
                    return (
                      <TouchableOpacity key={String(friend.id)} style={styles.friendRow} onPress={() => toggle(String(friend.id))} activeOpacity={0.7}>
                        <View style={styles.avatar}><Text style={styles.avatarText}>{(friend.profile?.name || '?').trim().charAt(0).toUpperCase()}</Text></View>
                        <Text style={styles.friendName} numberOfLines={1}>{friend.profile?.name || 'Medicoo User'}</Text>
                        <View style={[styles.check, on && styles.checkOn]}>{on ? <Check size={14} color="#fff" /> : null}</View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : null}

          <TouchableOpacity style={styles.save} onPress={() => onSave(mode, picked)} disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 14 },
    title: { fontSize: 16, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 12.5, color: c.textSecondary, marginTop: 4, marginBottom: 12 },
    option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border, marginBottom: 8 },
    optionActive: { borderColor: '#10B981', backgroundColor: c.successBg },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: '#10B981' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
    optionTitle: { fontSize: 13.5, fontWeight: '700', color: c.text },
    optionSub: { fontSize: 11.5, color: c.textSecondary, marginTop: 2, lineHeight: 16 },
    friendsBox: { marginTop: 4, marginBottom: 4 },
    note: { fontSize: 12, color: c.textSecondary, paddingVertical: 10 },
    friendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.successBg, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 13, fontWeight: '800', color: '#10B981' },
    friendName: { flex: 1, fontSize: 13.5, fontWeight: '600', color: c.text },
    check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    checkOn: { backgroundColor: '#10B981', borderColor: '#10B981' },
    save: { marginTop: 14, height: 48, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    saveText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, color: '#fff' },
  });
