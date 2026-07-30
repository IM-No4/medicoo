import AppIcon from "@/src/components/icons/AppIcon";
import { updateItemQuantityLocal } from "@/src/redux/slices/cartSlice";
import {
  removeItemFromCart,
  updateCartItemQuantity,
} from "@/src/services/api/cart.api";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";

interface Props {
  storeId: string;
  sku: string | number;
  quantity: number;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  productId: string;
  onQuantityChange?: (newQuantity: number) => void;
}

export default function QuantityControl({
  storeId,
  sku,
  quantity,
  disabled = false,
  size = "medium",
  productId,
  onQuantityChange,
}: Props) {
  const dispatch = useDispatch();

  const handleIncrement = async () => {
    if (disabled) return;

    const newQuantity = quantity + 1;

    try {
      // Update backend
      await updateCartItemQuantity(storeId, sku, productId, newQuantity);

      // Update Redux
      dispatch(
        updateItemQuantityLocal({
          storeId,
          sku,
          quantity: newQuantity,
        }),
      );

      onQuantityChange?.(newQuantity);
    } catch (e) {
      console.error("Failed to update quantity", e);
    } finally {
      // setIsUpdating(false);
    }
  };

  const handleDecrement = async () => {
    if (disabled) return;

    const newQuantity = quantity - 1;

    try {
      if (newQuantity <= 0) {
        // Remove item from backend - REQUIRED productId
        await removeItemFromCart(storeId, sku, productId);
      } else {
        // Update backend
        await updateCartItemQuantity(storeId, sku, productId, newQuantity);
      }

      // Update Redux (reducer handles quantity <= 0 by deleting)
      dispatch(
        updateItemQuantityLocal({
          storeId,
          sku,
          quantity: newQuantity,
        }),
      );

      onQuantityChange?.(newQuantity);
    } catch (e) {
      console.error("Failed to update quantity", e);
    } finally {
      // setIsUpdating(false);
    }
  };

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      button: styles.smallButton,
      icon: 14,
      text: styles.smallText,
    },
    medium: {
      container: styles.mediumContainer,
      button: styles.mediumButton,
      icon: 16,
      text: styles.mediumText,
    },
    large: {
      container: styles.largeContainer,
      button: styles.largeButton,
      icon: 18,
      text: styles.largeText,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        currentSize.container,
        disabled && styles.disabled,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          currentSize.button,
          disabled && styles.buttonDisabled,
        ]}
        onPress={handleDecrement}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <AppIcon
          name="minus"
          size={currentSize.icon}
          color={disabled ? "#9CA3AF" : "#16A34A"}
        />
      </TouchableOpacity>

      <Text style={[currentSize.text, styles.quantityText]}>{quantity}</Text>

      <TouchableOpacity
        style={[
          styles.button,
          currentSize.button,
          disabled && styles.buttonDisabled,
        ]}
        onPress={handleIncrement}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <AppIcon
          name="plus"
          size={currentSize.icon}
          color={disabled ? "#9CA3AF" : "#16A34A"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#16A34A",
    borderRadius: 8,
    overflow: "hidden",
  },
  disabled: {
    opacity: 0.6,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  quantityText: {
    minWidth: 32,
    textAlign: "center",
    fontWeight: "700",
    color: "#1C1C1E",
  },
  // Small size
  smallContainer: {
    height: 28,
    borderRadius: 6,
  },
  smallButton: {
    width: 28,
    height: 28,
  },
  smallText: {
    fontSize: 12,
  },
  // Medium size
  mediumContainer: {
    height: 36,
    borderRadius: 8,
  },
  mediumButton: {
    width: 36,
    height: 36,
  },
  mediumText: {
    fontSize: 14,
  },
  // Large size
  largeContainer: {
    height: 40,
    borderRadius: 8,
  },
  largeButton: {
    width: 40,
    height: 40,
  },
  largeText: {
    fontSize: 16,
  },
});
