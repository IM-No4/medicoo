import { useMemo } from 'react';
import AppIcon from "@/src/components/icons/AppIcon";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

const FILTERS = [
  { id: "all", label: "All" },
  { id: "prescription", label: "Prescription", icon: "file-text" },
  { id: "otc", label: "OTC", icon: "package" },
  { id: "bestseller", label: "Bestseller", icon: "trending-up" },
  { id: "offer", label: "Offers", icon: "tag" },
];

export default function FilterChips() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selected, setSelected] = useState<string>("all");

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((filter) => {
          const isSelected = selected === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelected(filter.id)}
            >
              {filter.icon && (
                <AppIcon
                  name={filter.icon as any}
                  size={14}
                  color={isSelected ? "#fff" : "#8A8A8E"}
                />
              )}
              <Text style={[styles.text, isSelected && styles.textSelected]}>
                {t(filter.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: c.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipSelected: {
    backgroundColor: "#007C69",
    borderColor: "#007C69",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textMuted,
  },
  textSelected: {
    color: "#fff",
  },
});
