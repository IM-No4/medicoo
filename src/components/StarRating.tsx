import { Star } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

const STAR = '#F59E0B';

export const RATING_WORDS = ['', 'Poor', 'Could be better', 'Okay', 'Good', 'Excellent'];

/** Five tappable stars. `disabled` shows a rating that has already been given. */
export default function StarRating({ value, onChange, disabled, size = 36 }: { value: number; onChange?: (n: number) => void; disabled?: boolean; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange?.(n)} disabled={disabled || !onChange} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}>
          <Star size={size} color={n <= value ? STAR : '#CBD5E1'} fill={n <= value ? STAR : 'transparent'} strokeWidth={1.6} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
