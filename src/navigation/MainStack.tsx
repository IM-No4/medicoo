import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import DoctorCallScreen from '../features/doctor/DoctorCallScreen';
import DoctorChatScreen from '../features/doctor/DoctorChatScreen';
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
import ManageMedicationsScreen from '../features/calendar/ManageMedicationsScreen';

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
    </Stack.Navigator>
  );
}
