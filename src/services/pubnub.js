import PubNubReact from 'pubnub-react';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
var PushNotification = require("react-native-push-notification");

const pubnub = PubNubReact;

const intializePubnub = () => {
  const config  = new pubnub({
    publishKey: 'pub-c-2ea01ae8-7cd3-42ed-a8b4-dc85487d86b6',
    subscribeKey: 'sub-c-74d3646e-174a-11eb-bc34-ce6fd967af95',
    secretKey: 'sec-c-YTQ1YWE2MzItNGIwMC00ZWYwLWJkZTQtMjZkMjhjODhjZmIy',
    heartbeatInterval:30,
    presenceTimeout:120,
    ssl: true
  });
  return config;
}

const publishMessage = (data: any) => {
  pubnub.publish({
    message: data.message,
    channel: data.channel,
    sendByPost: true, 
    storeInHistory: true,
    ttl: 0
  }, 
    (status: any, response: any) => {
      if (status.error) {
          console.log(status)
      } else {
        return response;
      }
    }
  );
}

const pubnubHistory = (data: any) => {
  pubnub.history(data.historyConfig, (status: any, response: any) => {
    if (status.error === true) {
      console.error(status)
    } else { }
  });
}