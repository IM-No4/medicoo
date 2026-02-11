import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import SearchScreen from '@/src/features/search/SearchScreen';

export type SearchStackParamList = {
  SearchHome: undefined;
  SearchResults: { query: string };
};

const Stack = createNativeStackNavigator<SearchStackParamList>();

export default function SearchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SearchHome" component={SearchScreen} />
    </Stack.Navigator>
  );
}
