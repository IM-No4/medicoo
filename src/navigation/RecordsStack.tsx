import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RecordDetailScreen from '../features/records/RecordDetailScreen';
import RecordsScreen from '../features/records/RecordsScreen';
import UploadRecordScreen from '../features/records/UploadRecordScreen';

export type RecordsStackParamList = {
  RecordsHome: undefined;
  RecordDetail: { id: string };
  UploadRecord: undefined;
};

const Stack = createNativeStackNavigator<RecordsStackParamList>();

export default function RecordsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecordsHome" component={RecordsScreen} />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <Stack.Screen name="UploadRecord" component={UploadRecordScreen} />
    </Stack.Navigator>
  );
}
