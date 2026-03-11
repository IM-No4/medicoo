import AppIcon from "@/src/components/icons/AppIcon";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PharmacyCard({ pharmacy, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.icon}>
        <AppIcon name="pill" size={20} color="#059669" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{pharmacy.name}</Text>
        <Text style={styles.meta}>
          {pharmacy.distanceKm} km • {pharmacy.deliveryTime}
        </Text>
      </View>

      <Text style={styles.rating}>⭐ {pharmacy.rating}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
  },

  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
  },

  meta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  rating: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
});
