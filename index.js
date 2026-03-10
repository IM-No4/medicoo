import { registerRootComponent } from 'expo';
import { FlatList, Platform, ScrollView, SectionList } from 'react-native';
import App from './src/app/App';

// Apply "luxury" controlled scroll physics globally
// Note: Android completely ignores custom float deceleration rates, it ONLY accepts 'fast' or 'normal'.
const LUXURY_DECELERATION = Platform.OS === 'ios' ? 0.992 : 'fast';

if (ScrollView.defaultProps == null) ScrollView.defaultProps = {};
ScrollView.defaultProps.decelerationRate = LUXURY_DECELERATION;

if (FlatList.defaultProps == null) FlatList.defaultProps = {};
FlatList.defaultProps.decelerationRate = LUXURY_DECELERATION;

if (SectionList.defaultProps == null) SectionList.defaultProps = {};
SectionList.defaultProps.decelerationRate = LUXURY_DECELERATION;

registerRootComponent(App);