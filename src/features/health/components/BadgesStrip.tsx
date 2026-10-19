import { Crown, Flame, Footprints, Lock, Target, Trophy } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BadgeInfo, EarnedBadge } from '../../../services/api/goals.api';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

const ICONS: Record<string, any> = { target: Target, flame: Flame, footprints: Footprints, trophy: Trophy, crown: Crown };
const COLORS: Record<string, string> = { target: '#10B981', flame: '#F97316', footprints: '#3B82F6', trophy: '#F59E0B', crown: '#8B5CF6' };

interface Props {
  earned: EarnedBadge[];
  available: BadgeInfo[];
  /** show what is still to earn, greyed out */
  showLocked?: boolean;
}

/** Badges in a row: earned ones in colour (a repeatable one shows how many times), the rest greyed with a lock. */
export function BadgesStrip({ earned, available, showLocked = true }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // A repeatable badge (week champion) is earned many times - show it once, with a count.
  const grouped = useMemo(() => {
    const map = new Map<string, { badge: EarnedBadge; count: number }>();
    earned.forEach((badge) => {
      const existing = map.get(badge.id);
      if (existing) existing.count += 1;
      else map.set(badge.id, { badge, count: 1 });
    });
    return Array.from(map.values());
  }, [earned]);

  if (grouped.length === 0 && (!showLocked || available.length === 0)) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {grouped.map(({ badge, count }) => {
        const Icon = ICONS[badge.icon] || Target;
        const color = COLORS[badge.icon] || '#10B981';
        return (
          <View key={badge.id} style={styles.item}>
            <View style={[styles.circle, { backgroundColor: color + '22', borderColor: color }]}>
              <Icon size={22} color={color} />
              {count > 1 ? (
                <View style={styles.count}><Text style={styles.countText}>{count}</Text></View>
              ) : null}
            </View>
            <Text style={styles.name} numberOfLines={2}>{badge.name}</Text>
          </View>
        );
      })}
      {showLocked
        ? available
            .filter((b) => !grouped.some((g) => g.badge.id === b.id))
            .map((badge) => (
              <View key={`locked-${badge.id}`} style={[styles.item, { opacity: 0.55 }]}>
                <View style={[styles.circle, styles.circleLocked]}>
                  <Lock size={18} color={theme.textMuted} />
                </View>
                <Text style={styles.name} numberOfLines={2}>{badge.name}</Text>
              </View>
            ))
        : null}
    </ScrollView>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { gap: 14, paddingVertical: 4, paddingRight: 8 },
    item: { width: 72, alignItems: 'center' },
    circle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    circleLocked: { backgroundColor: c.cardSecondary, borderColor: c.border },
    count: { position: 'absolute', right: -4, top: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    countText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    name: { fontSize: 10.5, fontWeight: '600', color: c.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 13 },
  });
