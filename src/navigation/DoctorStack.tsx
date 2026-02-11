import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BookAppointmentScreen from '@/src/features/doctor/BookAppointmentScreen';
import BookingSuccessScreen from '@/src/features/doctor/BookingSuccessScreen';
import DoctorDetailScreen from '@/src/features/doctor/DoctorDetailScreen';
import DoctorListScreen from '@/src/features/doctor/DoctorListScreen';

/**
 * ✅ STEP 1: Define param list (THIS FIXES YOUR ERROR)
 */
export type DoctorStackParamList = {
  DoctorList: undefined;

  DoctorDetail: {
    doctor?: any;
    doctorId?: string;
    intent?: 'BOOK';
  };

  BookAppointment: {
    doctor: any;
  };

  BookingSuccess: {
    date: string;
    slot: string | null;
    isRequest: boolean;
  };
};

/**
 * ✅ STEP 2: Pass param list to navigator
 */
const Stack =
  createNativeStackNavigator<DoctorStackParamList>();

export default function DoctorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="DoctorList"
        component={DoctorListScreen}
      />
      <Stack.Screen
        name="DoctorDetail"
        component={DoctorDetailScreen}
      />
      <Stack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
      />
      <Stack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
      />
    </Stack.Navigator>
  );
}
