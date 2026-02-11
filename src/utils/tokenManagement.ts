import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setToken(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

export async function getToken(key: string) {
  return AsyncStorage.getItem(key);
}

export async function clearToken(key: string) {
  await AsyncStorage.removeItem(key);
}
