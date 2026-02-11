import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ProfileScreen from '../features/profile/ProfileScreen';
import AddAddressScreen from '../features/profile/screens/AddressBook/AddAddressScreen';
import AddressBookScreen from '../features/profile/screens/AddressBook/AddressBookScreen';
import ConsultationDetailScreen from '../features/profile/screens/Consultations/ConsultationDetailScreen';
import ConsultationsScreen from '../features/profile/screens/Consultations/ConsultationsScreen';
import DoctorFeedbackScreen from '../features/profile/screens/Consultations/DoctorFeedbackScreen';
import DoctorOnboardingScreen from '../features/profile/screens/DoctorOnboarding/DoctorOnboardingScreen';
import DoctorEarningsScreen from '../features/profile/screens/DoctorSettings/DoctorEarningsScreen';
import DoctorPendingRequestsScreen from '../features/profile/screens/DoctorSettings/DoctorPendingRequestsScreen';
import DoctorReviewsScreen from '../features/profile/screens/DoctorSettings/DoctorReviewsScreen';
import DoctorSettingsScreen from '../features/profile/screens/DoctorSettings/DoctorSettingsScreen';
import ManageAppointmentsScreen from '../features/profile/screens/DoctorSettings/ManageAppointmentsScreen';
import ManageAvailabilityScreen from '../features/profile/screens/DoctorSettings/ManageAvailabilityScreen';
import PatientConsultationDetailScreen from '../features/profile/screens/DoctorSettings/PatientConsultationDetailScreen';
import AddFamilyMemberScreen from '../features/profile/screens/FamilyMembers/AddFamilyMemberScreen';
import FamilyMembersScreen from '../features/profile/screens/FamilyMembers/FamilyMembersScreen';
import LabTestDetailScreen from '../features/profile/screens/Labs/LabTestDetailScreen';
import LabTestsHistoryScreen from '../features/profile/screens/Labs/LabTestsHistoryScreen';
import MedicineOrderDetailScreen from '../features/profile/screens/Medicines/MedicineOrderDetailScreen';
import MedicineOrdersScreen from '../features/profile/screens/Medicines/MedicineOrdersScreen';
import HelpSupportScreen from '../features/profile/screens/Support/HelpSupportScreen';
import TermsPrivacyScreen from '../features/profile/screens/Support/TermsPrivacyScreen';
import EditProfileScreen from '../features/profile/screens/UserDetails/EditProfileScreen';
import ProfileDetailsScreen from '../features/profile/screens/UserDetails/ProfileDetailsScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileDetails: undefined;
  EditProfile: { profile: any };
  DoctorOnboarding: undefined;
  DoctorSettings: undefined;
  AddressBookModal: undefined;
  AddAddress: undefined;
  FamilyMembersModal: undefined;
  AddFamilyMember: { member?: any, isEditing?: boolean } | undefined;
  ConsultationModal: undefined;
  ConsultationDetail: { consultationId: string };
  DoctorFeedback: { consultationId: string, doctor: any };
  MedicineOrdersModal: undefined;
  MedicineOrderDetail: { orderId: string };
  LabTestsModal: undefined;
  LabTestDetail: { testId: string };
  HelpModal: undefined;
  TermsModal: undefined;
  ManageAvailability: undefined;
  ManageAppointments: { initialTab?: 'requests' | 'upcoming' | 'history' };
  PatientConsultationDetail: { appointment: any };
  DoctorPendingRequests: undefined;
  DoctorReviews: undefined;
  DoctorEarnings: undefined;
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
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="DoctorOnboarding"
        component={DoctorOnboardingScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="DoctorSettings"
        component={DoctorSettingsScreen}
        options={{ presentation: 'card' }}
      />
      {/* Address Book */}
      <Stack.Screen
        name="AddressBookModal"
        component={AddressBookScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
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
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
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
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ConsultationDetail"
        component={ConsultationDetailScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="DoctorFeedback"
        component={DoctorFeedbackScreen}
        options={{ presentation: 'modal' }}
      />
      {/* Medicine Orders */}
      <Stack.Screen
        name="MedicineOrdersModal"
        component={MedicineOrdersScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
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
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
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
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="TermsModal"
        component={TermsPrivacyScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ManageAvailability"
        component={ManageAvailabilityScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="ManageAppointments"
        component={ManageAppointmentsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="PatientConsultationDetail"
        component={PatientConsultationDetailScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="DoctorPendingRequests"
        component={DoctorPendingRequestsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="DoctorReviews"
        component={DoctorReviewsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="DoctorEarnings"
        component={DoctorEarningsScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}
