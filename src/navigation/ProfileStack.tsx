import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ProfileScreen from '../features/profile/ProfileScreen';
import AddAddressScreen from '../features/profile/screens/AddressBook/AddAddressScreen';
import AddressBookScreen from '../features/profile/screens/AddressBook/AddressBookScreen';
import ConsultationsScreen from '../features/profile/screens/Consultations/ConsultationsScreen';
import DoctorFeedbackScreen from '../features/profile/screens/Consultations/DoctorFeedbackScreen';
import AddFamilyMemberScreen from '../features/profile/screens/FamilyMembers/AddFamilyMemberScreen';
import FamilyMembersScreen from '../features/profile/screens/FamilyMembers/FamilyMembersScreen';
import LabTestDetailScreen from '../features/profile/screens/Labs/LabTestDetailScreen';
import LabTestsHistoryScreen from '../features/profile/screens/Labs/LabTestsHistoryScreen';
import HealthAssessmentHistoryScreen from '../features/profile/screens/HealthAssessments/HealthAssessmentHistoryScreen';
import NotificationSettingsScreen from '../features/profile/screens/NotificationSettingsScreen';
import MedicineOrderDetailScreen from '../features/profile/screens/Medicines/MedicineOrderDetailScreen';
import MedicineOrdersScreen from '../features/profile/screens/Medicines/MedicineOrdersScreen';
import HelpSupportScreen from '../features/profile/screens/Support/HelpSupportScreen';
import OrderSupportScreen from '../features/profile/screens/Support/OrderSupportScreen';
import LiveChatScreen from '../features/profile/screens/Support/LiveChatScreen';
import CommunityGuidelinesScreen from '../features/legals/CommunityGuidelinesScreen';
import SecurityStandardsScreen from '../features/legals/SecurityStandardsScreen';
import EditProfileScreen from '../features/profile/screens/UserDetails/EditProfileScreen';
import ProfileDetailsScreen from '../features/profile/screens/UserDetails/ProfileDetailsScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileDetails: undefined;
  EditProfile: { profile: any };
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
  FamilyMembersModal: undefined;
  AddFamilyMember: { member?: any, isEditing?: boolean } | undefined;
  ConsultationModal: undefined;
  DoctorFeedback: { consultationId: string, doctor: any };
  MedicineOrdersModal: undefined;
  MedicineOrderDetail: { orderId: string };
  LabTestsModal: undefined;
  LabTestDetail: { testId: string };
  HelpModal: undefined;
  CommunityGuidelines: undefined;
  SecurityStandards: undefined;
  LiveChat: undefined;
  OrderSupport: { orderId: string };
  HealthAssessmentHistory: undefined;
  NotificationSettings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="ProfileDetails"
        component={ProfileDetailsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: 'card' }}
      />
      {/* Address Book */}
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
      {/* Family Members */}
      <Stack.Screen
        name="FamilyMembersModal"
        component={FamilyMembersScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="AddFamilyMember"
        component={AddFamilyMemberScreen}
        options={{ presentation: 'card' }}
      />
      {/* Consultations */}
      <Stack.Screen
        name="ConsultationModal"
        component={ConsultationsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="DoctorFeedback"
        component={DoctorFeedbackScreen}
        options={{ presentation: 'card' }}
      />
      {/* Medicine Orders */}
      <Stack.Screen
        name="MedicineOrdersModal"
        component={MedicineOrdersScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="MedicineOrderDetail"
        component={MedicineOrderDetailScreen}
        options={{ presentation: 'card' }}
      />
      {/* Lab Tests */}
      <Stack.Screen
        name="LabTestsModal"
        component={LabTestsHistoryScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="LabTestDetail"
        component={LabTestDetailScreen}
        options={{ presentation: 'card' }}
      />
      {/* Support */}
      <Stack.Screen
        name="HelpModal"
        component={HelpSupportScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="CommunityGuidelines"
        component={CommunityGuidelinesScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="SecurityStandards"
        component={SecurityStandardsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="OrderSupport"
        component={OrderSupportScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="LiveChat"
        component={LiveChatScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="HealthAssessmentHistory"
        component={HealthAssessmentHistoryScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}
