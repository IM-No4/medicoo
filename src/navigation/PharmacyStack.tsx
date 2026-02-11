import PharmacyDetailScreen from '@/src/features/pharmacy/PharmacyDetailScreen';
import PharmacyListScreen from '@/src/features/pharmacy/PharmacyListScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function PharmacyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PharmacyList" component={PharmacyListScreen} />
      <Stack.Screen name="PharmacyDetail" component={PharmacyDetailScreen} />
    </Stack.Navigator>
  );
}
