import * as Haptics from 'expo-haptics';

export const tapHaptic = () => {
  Haptics.selectionAsync();
};
