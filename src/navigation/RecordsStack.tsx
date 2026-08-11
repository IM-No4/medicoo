import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RecordDetailScreen from '../features/records/RecordDetailScreen';
import RecordsCategoryScreen from '../features/records/RecordsCategoryScreen';
import RecordsHomeScreen from '../features/records/RecordsHomeScreen';
import { DocumentTypeValue } from '../features/records/documentTypes';
import { RecordItem } from '../features/records/types';

export type RecordsStackParamList = {
  RecordsHome: undefined;
  RecordsCategory: { documentType: DocumentTypeValue; label: string };
  RecordDetail: { record: RecordItem };
};

const Stack = createNativeStackNavigator<RecordsStackParamList>();

export default function RecordsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecordsHome" component={RecordsHomeScreen} />
      <Stack.Screen name="RecordsCategory" component={RecordsCategoryScreen} />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
    </Stack.Navigator>
  );
}
