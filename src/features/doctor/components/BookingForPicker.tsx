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

/**
 * "Who is this consultation for?" - myself, or a family member. A member with their own Medicoo account has to have allowed
 * bookings for them first (their choice, in Family Members); one without an account is looked after by the person booking.
 * Renders nothing when there are no family members, so a person who never uses the family feature never sees it.
 */
export default function BookingForPicker({ value, onChange }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [options, setOptions] = useState<Option[]>([]);

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

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Who is this for?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <TouchableOpacity
          style={[styles.chip, value === null && styles.chipActive]}
          activeOpacity={0.8}
          onPress={() => onChange({ memberId: null, name: 'Myself', hasAccount: false })}
        >
          <Text style={[styles.chipText, value === null && styles.chipTextActive]}>Myself</Text>
        </TouchableOpacity>
        {options.map((o) => {
          const active = value === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              style={[styles.chip, active && styles.chipActive, !o.allowed && styles.chipDisabled]}
              activeOpacity={0.8}
              disabled={!o.allowed}
              onPress={() => onChange({ memberId: o.id, name: o.name, hasAccount: o.hasAccount })}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {o.name}
              </Text>
              <Text style={[styles.chipSub, active && styles.chipTextActive]} numberOfLines={1}>
                {capitalise(o.relation)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {options.some((o) => !o.allowed) ? (
        <Text style={styles.note}>
          {options.filter((o) => !o.allowed).map((o) => o.name).join(', ')} {options.filter((o) => !o.allowed).length > 1 ? 'have' : 'has'} not allowed you to book for them yet. They can turn this on in Family Members.
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
    row: { gap: 8, paddingRight: 8 },
    chip: {
      minWidth: 84,
      maxWidth: 150,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      justifyContent: 'center',
    },
    chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    chipDisabled: { opacity: 0.45 },
    chipText: { fontSize: 13, fontWeight: '700', color: c.text },
    chipTextActive: { color: '#FFFFFF' },
    chipSub: { fontSize: 10.5, color: c.textSecondary, marginTop: 1 },
    note: { fontSize: 11.5, color: c.textSecondary, marginTop: 8, lineHeight: 16 },
    infoBox: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: c.successBg },
    infoText: { fontSize: 12, color: c.success, lineHeight: 17 },
  });
