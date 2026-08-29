import CartScreen from '@/src/features/cart/CartScreen';
import CouponScreen from '@/src/features/cart/CouponScreen';
import LiveTrackingScreen from '@/src/features/cart/LiveTrackingScreen';
import PaymentScreen from '@/src/features/cart/PaymentScreen';
import AddressBookScreen from '@/src/features/profile/screens/AddressBook/AddressBookScreen';
import AddAddressScreen from '@/src/features/profile/screens/AddressBook/AddAddressScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type CartStackParamList = {
  CartScreen: {
    storeID?: string;
    appliedCoupon?: any;
  };
  CouponScreen: {
    storeId: string;
  };
  AddressBookModal: undefined;
  AddAddress: {
    fullAddress?: string;
    houseNo?: string;
    landmark?: string;
    tag?: string;
    receiverName?: string;
    receiverPhone?: string;
    latitude?: string | number;
    longitude?: string | number;
  } | undefined;
  PaymentScreen: {
    storeId: string;
    amount: number;
  };
  LiveTracking: undefined;
};

const Stack = createNativeStackNavigator<CartStackParamList>();

export default function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CartScreen" component={CartScreen} />
      <Stack.Screen name="CouponScreen" component={CouponScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen
        name="LiveTracking"
        component={LiveTrackingScreen}
        options={{ presentation: 'card', gestureEnabled: false }}
      />
      <Stack.Screen
        name="AddressBookModal"
        component={AddressBookScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen 
        name="AddAddress" 
        component={AddAddressScreen} 
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}
