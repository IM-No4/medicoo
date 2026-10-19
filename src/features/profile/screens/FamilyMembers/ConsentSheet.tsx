import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../../../components/ThemedModal';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import type { FamilyConsent, FamilyConsentItem, FamilyConsentKey } from '../../../../services/api/family.api';

interface Props {
  visible: boolean;
  title: string;
  subtitle: string;
  items: FamilyConsentItem[];
  values: FamilyConsent;
  confirmText: string;
  busy?: boolean;
  onChange: (key: FamilyConsentKey, value: boolean) => void;
  onSetAll: (value: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * The family member's own choices: exactly what the family head may see and do for them. Nothing is on until they turn it on, and
 * they can come back and change any of it later.
 */
export default function ConsentSheet({ visible, title, subtitle, items, values, confirmText, busy, onChange, onSetAll, onConfirm, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const groups = useMemo(() => {
    const out: { name: string; items: FamilyConsentItem[] }[] = [];
    items.forEach((item) => {
      const last = out.find((g) => g.name === item.group);
      if (last) last.items.push(item);
      else out.push({ name: item.group, items: [item] });
    });
    return out;
  }, [items]);

  const allOn = items.length > 0 && items.every((i) => values[i.key]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <TouchableOpacity style={styles.allRow} onPress={() => onSetAll(!allOn)} activeOpacity={0.7}>
            <Text style={styles.allText}>{allOn ? 'Turn everything off' : 'Allow everything'}</Text>
          </TouchableOpacity>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {groups.map((group) => (
              <View key={group.name} style={styles.group}>
                <Text style={styles.groupName}>{group.name}</Text>
                {group.items.map((item) => (
                  <View key={item.key} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      <Text style={styles.rowDesc}>{item.description}</Text>
                    </View>
                    <Switch
                      value={!!values[item.key]}
                      onValueChange={(value) => onChange(item.key, value)}
                      trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                      thumbColor="#fff"
                    />
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.confirm} onPress={onConfirm} disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>{confirmText}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      maxHeight: '88%',
      backgroundColor: c.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 14 },
    title: { fontSize: 16, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 12.5, color: c.textSecondary, lineHeight: 18, marginTop: 4, marginBottom: 10 },
    allRow: { alignSelf: 'flex-start', paddingVertical: 6 },
    allText: { fontSize: 12.5, fontWeight: '700', color: '#10B981' },
    list: { flexGrow: 0 },
    group: { marginTop: 8 },
    groupName: { fontSize: 11, fontWeight: '800', color: c.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 13.5, fontWeight: '700', color: c.text },
    rowDesc: { fontSize: 11.5, color: c.textSecondary, marginTop: 2, lineHeight: 16 },
    confirm: { marginTop: 14, height: 48, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    confirmText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, color: '#fff' },
  });
