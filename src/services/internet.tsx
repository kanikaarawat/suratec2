import NetInfo from '@react-native-community/netinfo';

export const internetStatus = async () => {
  let connectionInfo = await NetInfo.fetch();
  if (connectionInfo.type !== 'wifi' && connectionInfo.type !== 'cellular') {
    return false; 
  } else {
    return true;
  }
}

export const DeviceTimeZone = async () => {
  // Use JavaScript's built-in Intl API to get timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}