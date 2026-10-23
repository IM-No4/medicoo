import { useMemo } from 'react';
import AppIcon from "@/src/components/icons/AppIcon";
import React from "react";
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

export type MedicineFilterId = "all" | "prescription" | "otc" | "offer";

const FILTERS: { id: MedicineFilterId; label: string; icon?: string }[] = [
  { id: "all", label: "All" },
  { id: "prescription", label: "Prescription", icon: "file-text" },
  { id: "otc", label: "OTC", icon: "package" },
  { id: "offer", label: "Offers", icon: "tag" },
];

// Whether a medicine of the store's list belongs under a chip. Prescription = needs one; OTC = does not; Offers = carries a discount.
export const matchesMedicineFilter = (m: any, filter: MedicineFilterId): boolean => {
  if (filter === "all") return true;
  const needsPrescription = !!(m?.isPrescriptionRequired || m?.prescriptionRequired);
  if (filter === "prescription") return needsPrescription;
  if (filter === "otc") return !needsPrescription;
  return Number(m?.discountPrice) > 0 && Number(m?.price) > 0;
};

export default function FilterChips({
  selected,
  onChange,
}: {
  selected: MedicineFilterId;
  onChange: (filter: MedicineFilterId) => void;
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
              onPress={() => onChange(filter.id)}
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
