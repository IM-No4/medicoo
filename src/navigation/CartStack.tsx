import CartScreen from '@/src/features/cart/CartScreen';
import CouponScreen from '@/src/features/cart/CouponScreen';
import LiveTrackingScreen from '@/src/features/cart/LiveTrackingScreen';
import OrderDeliveredScreen from '@/src/features/cart/OrderDeliveredScreen';
import PaymentProcessingScreen from '@/src/features/cart/PaymentProcessingScreen';
import PaymentScreen from '@/src/features/cart/PaymentScreen';
import VerifyingOrderScreen from '@/src/features/cart/VerifyingOrderScreen';
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
    amount?: number;
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
    couponCode?: string;
  };
  PaymentProcessing: {
    storeId: string;
    amount: number;
    couponCode?: string;
    autoPay?: boolean;
    resumeOnly?: boolean;
  };
  VerifyingOrder: {
    storeId: string;
    amount: number;
    deliveryFee?: number;
    subtotal?: number;
    taxes?: number;
    couponDiscount?: number;
    platformFee?: number;
    otherCharges?: number;
    prescriptionMode?: string;
    prescriptionDocumentId?: string;
    prescriptionId?: string;
    prescriptionRequired?: boolean;
    paymentMethod: 'online' | 'cod';
    couponCode?: string;
  };
  LiveTracking: undefined;
  OrderDelivered: {
    orderId: string;
    orderNumber?: string;
    storeName?: string;
    itemCount?: number;
    deliveryMode?: 'self' | 'partner';
    partnerName?: string;
  };
};

const Stack = createNativeStackNavigator<CartStackParamList>();

export default function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CartScreen" component={CartScreen} />
      <Stack.Screen name="CouponScreen" component={CouponScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="PaymentProcessing" component={PaymentProcessingScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="VerifyingOrder"
        component={VerifyingOrderScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="LiveTracking"
        component={LiveTrackingScreen}
        options={{ presentation: 'card', gestureEnabled: false }}
      />
      <Stack.Screen
        name="OrderDelivered"
        component={OrderDeliveredScreen}
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
