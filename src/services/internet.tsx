import { NetInfo } from 'react-native';
import DeviceInfo from 'react-native-device-info';
export const internetStatus = async () => {
  let connectionInfo = await NetInfo.getConnectionInfo();
  if (connectionInfo.type !== 'wifi' && connectionInfo.type !== 'cellular') {
    return false; 
  } else {
    return true;
  }
}
export const DeviceTimeZone = async () => {
 return DeviceInfo.getTimezone();
}