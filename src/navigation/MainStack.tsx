import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import DoctorCallScreen from '../features/doctor/DoctorCallScreen';
import DoctorChatScreen from '../features/doctor/DoctorChatScreen';
import AIAssistantChatScreen from '../features/health/AIAssistantChatScreen';
import HealthAssistantHistoryScreen from '../features/health/HealthAssistantHistoryScreen';
import HealthRiskAssessmentScreen from '../features/health/HealthRiskAssessment/HealthRiskAssessmentScreen';
import AddFamilyMemberScreen from '../features/profile/screens/FamilyMembers/AddFamilyMemberScreen';
import FamilyMembersScreen from '../features/profile/screens/FamilyMembers/FamilyMembersScreen';
import AmbulanceStack from './AmbulanceStack';
import BloodDonationStack from './BloodDonationStack';
import CartStack from './CartStack';
import DoctorStack from './DoctorStack';
import HomeCareStack from './HomeCareStack';
import HospitalStack from './HospitalStack';
import LabStack from './LabStack';
import MainTabs from './MainTabs';
import PharmacyStack from './PharmacyStack';
import SearchStack from './SearchStack';
import ComingSoonScreen from '../features/home/ComingSoonScreen';
import ManageGoalsScreen from '../features/health/ManageGoalsScreen';
import FriendsScreen from '../features/health/FriendsScreen';
import ActivityHistoryScreen from '../features/health/ActivityHistoryScreen';
import NotificationsScreen from '../features/notifications/NotificationsScreen';
import VitalsHistoryScreen from '../features/health/VitalsHistoryScreen';
import ManageMedicationsScreen from '../features/calendar/ManageMedicationsScreen';
import ConsultationDetailScreen from '../features/profile/screens/Consultations/ConsultationDetailScreen';
import BloodRequestDetailScreen from '../features/bloodDonation/screens/BloodRequestDetailScreen';
import TermsOfServiceScreen from '../features/legals/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../features/legals/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator();

type Props = {
  onOpenCommandPalette: () => void;
};

export default function MainStack({
  onOpenCommandPalette,
}: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs (Home lives here) */}
      <Stack.Screen name="Tabs">
        {(props) => (
          <MainTabs
            {...props}
            onOpenCommandPalette={onOpenCommandPalette}
          />
        )}
      </Stack.Screen>

      {/* Feature stacks */}
      <Stack.Screen
        name="SearchStack"
        component={SearchStack}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="DoctorStack"
        component={DoctorStack}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="PharmacyStack"
        component={PharmacyStack}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="LabStack"
        component={LabStack}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="HospitalStack"
        component={HospitalStack}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="AmbulanceStack"
        component={AmbulanceStack}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="HomeCareStack"
        component={HomeCareStack}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="CartStack"
        component={CartStack}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="BloodDonationStack"
        component={BloodDonationStack}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="FamilyMembersModal"
        component={FamilyMembersScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="AddFamilyMember"
        component={AddFamilyMemberScreen}
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="DoctorCall"
        component={DoctorCallScreen}
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
      <Stack.Screen
        name="DoctorChat"
        component={DoctorChatScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="AIAssistantChat"
        component={AIAssistantChatScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="HealthAssistantHistory"
        component={HealthAssistantHistoryScreen}
        options={{ presentation: 'card', headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="HealthRiskAssessment"
        component={HealthRiskAssessmentScreen}
        options={{ presentation: 'card', headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ComingSoon"
        component={ComingSoonScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="ManageGoals"
        component={ManageGoalsScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="ManageMedications"
        component={ManageMedicationsScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="ActivityHistory"
        component={ActivityHistoryScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="VitalsHistory"
        component={VitalsHistoryScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      {/* Top-level (not nested under any tab's own stack) so opening it from
          Calendar/Home/Doctor screens pops back to wherever the user actually
          was, instead of hijacking the Profile tab's separate back stack. */}
      <Stack.Screen
        name="ConsultationDetail"
        component={ConsultationDetailScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      {/* Top-level for the same reason as ConsultationDetail above - needs
          to be deep-linkable from a push notification tap (donor notified
          of a nearby request, or requester notified their request was
          accepted) regardless of whatever tab/stack is currently focused. */}
      <Stack.Screen
        name="BloodRequestDetail"
        component={BloodRequestDetailScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      {/* Top-level for the same reason - the Terms & Privacy re-acceptance
          modal renders outside any stack (alongside GlobalTrackingBanner),
          so its "read full document" links need to reach these regardless
          of which tab/stack the user happens to be on. */}
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ presentation: 'card', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
