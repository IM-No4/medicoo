import CartScreen from '@/src/features/cart/CartScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type CartStackParamList = {
  CartScreen: {
    storeID?: string;
  };
};

const Stack = createNativeStackNavigator<CartStackParamList>();

export default function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CartScreen" component={CartScreen} />
    </Stack.Navigator>
  );
}
