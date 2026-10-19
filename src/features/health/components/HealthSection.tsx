import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

interface SectionProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
}

export function HealthSection({ title, icon, children }: SectionProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {icon}
            </View>
            {children}
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    section: { marginVertical: 16, paddingHorizontal: 20 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: c.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
});
