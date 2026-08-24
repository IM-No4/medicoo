import AppIcon from "@/src/components/icons/AppIcon";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "prescription", label: "Prescription", icon: "file-text" },
  { id: "otc", label: "OTC", icon: "package" },
  { id: "bestseller", label: "Bestseller", icon: "trending-up" },
  { id: "offer", label: "Offers", icon: "tag" },
];

export default function FilterChips() {
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
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipSelected: {
    backgroundColor: "#007C69",
    borderColor: "#007C69",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8A8A8E",
  },
  textSelected: {
    color: "#fff",
  },
});
