import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Push notifications are NOT supported in Expo Go since SDK 53.
// They only work in a development build or production APK/IPA.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Only set the handler when running in a real build (not Expo Go)
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  // Silently skip in Expo Go — push tokens won't work there
  if (isExpoGo) {
    console.log('ℹ️  Push notifications are not available in Expo Go. Build a dev/prod APK to test them.');
    return null;
  }

  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted.');
      return null;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
    } catch (e) {
      console.warn('Failed to get push token:', e.message);
      return null;
    }
  } else {
    console.log('Push notifications require a physical device.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#084734',
    });
  }

  return token;
}

export async function scheduleLocalNotification(title, body, trigger = null) {
  // Silently skip in Expo Go
  if (isExpoGo) {
    console.log(`ℹ️  [Expo Go] Skipping notification: "${title}" - "${body}"`);
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger || null, // null = send immediately
    });
    return notificationId;
  } catch (e) {
    console.warn('Failed to schedule notification:', e.message);
    return null;
  }
}
