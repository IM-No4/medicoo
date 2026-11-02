import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getFamilyMembers } from '../../../services/api/family.api';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

export interface BookingTarget {
  /** null = myself */
  memberId: string | null;
  name: string;
  hasAccount: boolean;
}

interface Props {
  value: string | null;
  onChange: (target: BookingTarget) => void;
}

interface Option {
  id: string;
  name: string;
  relation: string;
  hasAccount: boolean;
  allowed: boolean;
}

const capitalise = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);
const initialOf = (name: string) => (name ? name.trim().charAt(0).toUpperCase() : '?');

/**
 * "Who is this consultation for?" - myself, or a family member, chosen from a dropdown (a row of chips does not hold six or seven members).
 * A member with their own Medicoo account has to have allowed bookings for them first (their choice, in Family Members); one without an
 * account is looked after by the person booking. Renders nothing when there are no family members, so a person who never uses the family
 * feature never sees it. The selection itself (Myself by default, or the member the booking was started from) is owned by the parent.
 */
export default function BookingForPicker({ value, onChange }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    getFamilyMembers()
      .then((data: any) => {
        if (!alive) return;
        const members = Array.isArray(data?.members) ? data.members : [];
        setOptions(
          members
            .filter((m: any) => m.status === 'active')
            .map((m: any) => {
              const hasAccount = !!m.linkedUserId;
              return {
                id: m._id,
                name: m.name,
                relation: m.relation,
                hasAccount,
                allowed: !hasAccount || !!m.consentGiven?.bookConsultations,
              };
            }),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (options.length === 0) return null;

  const chosen = options.find((o) => o.id === value) || null;
  const shownName = chosen ? chosen.name : 'Myself';
  const shownSub = chosen ? capitalise(chosen.relation) : 'You';
  const blocked = options.filter((o) => !o.allowed);

  const pick = (target: BookingTarget) => {
    onChange(target);
    setOpen(false);
  };

  const row = (key: string, name: string, sub: string, selected: boolean, disabled: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={key}
      style={[styles.option, selected && styles.optionActive, disabled && styles.optionDisabled]}
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
    >
      <View style={[styles.avatar, selected && styles.avatarActive]}>
        <Text style={[styles.avatarText, selected && styles.avatarTextActive]}>{initialOf(name)}</Text>
      </View>
      <View style={styles.optionBody}>
        <Text style={styles.optionName} numberOfLines={1}>{name}</Text>
        <Text style={styles.optionSub} numberOfLines={1}>{disabled ? `${sub} - has not allowed bookings yet` : sub}</Text>
      </View>
      {selected ? <Check size={18} color="#10B981" /> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Who is this for?</Text>

      <TouchableOpacity style={[styles.selector, open && styles.selectorOpen]} activeOpacity={0.8} onPress={() => setOpen((v) => !v)}>
        <View style={[styles.avatar, styles.avatarActive]}>
          <Text style={[styles.avatarText, styles.avatarTextActive]}>{initialOf(shownName)}</Text>
        </View>
        <View style={styles.optionBody}>
          <Text style={styles.optionName} numberOfLines={1}>{shownName}</Text>
          <Text style={styles.optionSub} numberOfLines={1}>{shownSub}</Text>
        </View>
        {open ? <ChevronUp size={18} color={theme.textSecondary} /> : <ChevronDown size={18} color={theme.textSecondary} />}
      </TouchableOpacity>

      {open ? (
        <View style={styles.list}>
          <ScrollView style={styles.listScroll} nestedScrollEnabled showsVerticalScrollIndicator={options.length > 4}>
            {row('me', 'Myself', 'You', value === null, false, () => pick({ memberId: null, name: 'Myself', hasAccount: false }))}
            {options.map((o) =>
              row(o.id, o.name, capitalise(o.relation), value === o.id, !o.allowed, () =>
                pick({ memberId: o.id, name: o.name, hasAccount: o.hasAccount }),
              ),
            )}
          </ScrollView>
        </View>
      ) : null}

      {blocked.length > 0 ? (
        <Text style={styles.note}>
          {blocked.map((o) => o.name).join(', ')} {blocked.length > 1 ? 'have' : 'has'} not allowed you to book for them yet. They can turn this on in Family Members.
        </Text>
      ) : null}

      {chosen ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {chosen.hasAccount
              ? `${chosen.name} will see this booking in their own app and their phone will ring for the call. You can join the call too. You pay, and the booking shows "booked by you for ${chosen.name}".`
              : `${chosen.name} will take the call on your phone. The booking shows "booked by you for ${chosen.name}".`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: { marginBottom: 18 },
    title: { fontSize: 13, fontWeight: '700', color: c.text, marginBottom: 10 },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    selectorOpen: { borderColor: '#10B981' },
    list: {
      marginTop: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      overflow: 'hidden',
    },
    // about four rows are visible; a longer list scrolls inside the box instead of pushing the rest of the sheet away
    listScroll: { maxHeight: 232 },
    option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
    optionActive: { backgroundColor: c.successBg },
    optionDisabled: { opacity: 0.45 },
    optionBody: { flex: 1 },
    optionName: { fontSize: 14, fontWeight: '700', color: c.text },
    optionSub: { fontSize: 11.5, color: c.textSecondary, marginTop: 1 },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.cardSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarActive: { backgroundColor: '#10B981' },
    avatarText: { fontSize: 14, fontWeight: '700', color: c.textSecondary },
    avatarTextActive: { color: '#FFFFFF' },
    note: { fontSize: 11.5, color: c.textSecondary, marginTop: 8, lineHeight: 16 },
    infoBox: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: c.successBg },
    infoText: { fontSize: 12, color: c.success, lineHeight: 17 },
  });
