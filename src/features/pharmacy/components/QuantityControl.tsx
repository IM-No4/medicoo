import AppIcon from '@/src/components/icons/AppIcon';
import { updateCartItemQuantity } from '@/src/services/api/cart.api';
import { updateItemQuantityLocal } from '@/src/redux/slices/cartSlice';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

interface Props {
  storeId: string;
  sku: string | number;
  quantity: number;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  onQuantityChange?: (newQuantity: number) => void;
}

export default function QuantityControl({
  storeId,
  sku,
  quantity,
  disabled = false,
  size = 'medium',
  onQuantityChange,
}: Props) {
  const dispatch = useDispatch();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleIncrement = async () => {
    if (disabled || isUpdating) return;
    
    const newQuantity = quantity + 1;
    setIsUpdating(true);
    
    try {
      // Update backend
      await updateCartItemQuantity(storeId, Number(sku), newQuantity);
      
      // Update Redux
      dispatch(
        updateItemQuantityLocal({
          storeId,
          sku,
          quantity: newQuantity,
        })
      );
      
      onQuantityChange?.(newQuantity);
    } catch (e) {
      console.error('Failed to update quantity', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async () => {
    if (disabled || isUpdating || quantity <= 1) return;
    
    const newQuantity = quantity - 1;
    setIsUpdating(true);
    
    try {
      // Update backend
      await updateCartItemQuantity(storeId, Number(sku), newQuantity);
      
      // Update Redux
      dispatch(
        updateItemQuantityLocal({
          storeId,
          sku,
          quantity: newQuantity,
        })
      );
      
      onQuantityChange?.(newQuantity);
    } catch (e) {
      console.error('Failed to update quantity', e);
    } finally {
      setIsUpdating(false);
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
    <View style={[styles.container, currentSize.container, disabled && styles.disabled]}>
      <TouchableOpacity
        style={[styles.button, currentSize.button, (disabled || isUpdating || quantity <= 1) && styles.buttonDisabled]}
        onPress={handleDecrement}
        disabled={disabled || isUpdating || quantity <= 1}
        activeOpacity={0.7}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color="#16A34A" />
        ) : (
          <AppIcon name="minus" size={currentSize.icon} color={disabled || quantity <= 1 ? "#9CA3AF" : "#16A34A"} />
        )}
      </TouchableOpacity>
      
      <Text style={[currentSize.text, styles.quantityText]}>
        {quantity}
      </Text>
      
      <TouchableOpacity
        style={[styles.button, currentSize.button, (disabled || isUpdating) && styles.buttonDisabled]}
        onPress={handleIncrement}
        disabled={disabled || isUpdating}
        activeOpacity={0.7}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color="#16A34A" />
        ) : (
          <AppIcon name="plus" size={currentSize.icon} color={disabled ? "#9CA3AF" : "#16A34A"} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 8,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.6,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  buttonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  quantityText: {
    minWidth: 32,
    textAlign: 'center',
    fontWeight: '700',
    color: '#1C1C1E',
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
