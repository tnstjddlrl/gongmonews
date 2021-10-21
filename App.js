import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  BackHandler,
  SafeAreaView,
} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import { PERMISSIONS, requestMultiple } from 'react-native-permissions';
import SplashScreen from 'react-native-splash-screen'

import messaging from '@react-native-firebase/messaging';

import WebView from 'react-native-webview';


async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}

var rnw
var cbc = false;

const App = () => {
  const [uri, setUri] = useState({ uri: 'https://jelovc.cafe24.com/' })
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log(JSON.stringify(remoteMessage))
      if (remoteMessage.data.url) {
        Alert.alert(JSON.stringify(remoteMessage.notification.title).replace(/"/g, ''), JSON.stringify(remoteMessage.notification.body).replace(/"/g, ''),
          [
            {
              text: "취소",
              onPress: () => console.log("Cancel Pressed"),
              style: "cancel"
            },
            {
              text: "이동", onPress: () => {
                setUri({ uri: remoteMessage.data.url })
                console.log(`url : ${remoteMessage.data.url}`)
              }
            }
          ]);
      } else {
        Alert.alert(JSON.stringify(remoteMessage.notification.title).replace(/"/g, ''), JSON.stringify(remoteMessage.notification.body).replace(/"/g, ''));
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    requestMultiple([
      PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      PERMISSIONS.ANDROID.READ_PHONE_NUMBERS,
      PERMISSIONS.ANDROID.READ_PHONE_STATE,
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
    ]).then((statuses) => {
      console.log('ACCESS_COARSE_LOCATION', statuses[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]);
      console.log('ACCESS_FINE_LOCATION', statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]);
      console.log('READ_PHONE_NUMBERS', statuses[PERMISSIONS.ANDROID.READ_PHONE_NUMBERS]);
      console.log('READ_PHONE_STATE', statuses[PERMISSIONS.ANDROID.READ_PHONE_STATE]);
    }).then(() => {
      DeviceInfo.getPhoneNumber().then((phoneNumber) => {
        console.log(`폰번호 : ${phoneNumber.replace('+82', '0')}`)
        setPhone(phoneNumber.replace('+82', '0'))
      });
    })
  }, [])

  useEffect(() => {

    messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from background state:',
          remoteMessage.data.url,
        );
        setTimeout(() => {
          setUri({ uri: remoteMessage.data.url });
        }, 50);
      }
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.data.url,
          );
          setTimeout(() => {
            setUri({ uri: remoteMessage.data.url });
          }, 800);
        }
      });
  }, []);

  const [pushToken, setPushToken] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)

  const handlePushToken = useCallback(async () => {
    const enabled = await messaging().hasPermission()
    if (enabled) {
      const fcmToken = await messaging().getToken()
      if (fcmToken) setPushToken(fcmToken)
    } else {
      const authorized = await messaging.requestPermission()
      if (authorized) setIsAuthorized(true)
    }
  }, [])

  const saveDeviceToken = useCallback(async () => {
    if (isAuthorized) {
      const currentFcmToken = await firebase.messaging().getToken()
      if (currentFcmToken !== pushToken) {
        return saveTokenToDatabase(currentFcmToken)
      }
      return messaging().onTokenRefresh((token) => saveTokenToDatabase(token))
    }
  }, [pushToken, isAuthorized])

  useEffect(() => {
    requestUserPermission()
    try {
      handlePushToken()
      saveDeviceToken()

      setTimeout(() => {
        console.log(pushToken)
      }, 1000);

    } catch (error) {
      console.log(error)
      Alert.alert('토큰 받아오기 실패')
    }

  }, [])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      function () {
        if (cbc && rnw) {
          rnw.goBack();
          return true;
        } else {
          Alert.alert('앱 종료', '앱을 종료하시겠습니까?',
            [
              {
                text: "취소",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel"
              },
              { text: "확인", onPress: () => BackHandler.exitApp() }
            ])
        }
        return true;
      }
    );
    return () => backHandler.remove();
  }, []);

  function onMessage(event) {
    console.log(event.nativeEvent.data)
    if (event.nativeEvent.data == 'phonenumber') {
      if (phone[0] === '+' || phone === '') {
        rnw.postMessage('phonenumber/Foreigner')
        console.log('phonenumber/Foreigner')
      } else {
        rnw.postMessage(`phonenumber/${phone}`)
        console.log(`phonenumber/${phone}`)
      }
    }

    if (event.nativeEvent.data == 'phonetoken') {
      if (pushToken === '' || pushToken === null || pushToken === undefined) {
        rnw.postMessage('phonetoken/null')
        console.log('phonetoken/null')
      } else {
        rnw.postMessage(`phonetoken/${pushToken}`)
        console.log(`phonetoken/${pushToken}`)
      }
    }

  }

  return (
    <SafeAreaView style={{ width: '100%', height: '100%' }}>
      <WebView
        ref={wb => { rnw = wb }}
        onMessage={event => {
          onMessage(event)
        }}
        onLoadEnd={() => {
          SplashScreen.hide();
        }}
        pullToRefreshEnabled={true}
        style={{ width: '100%', height: '100%' }}
        onNavigationStateChange={(navState) => { cbc = navState.canGoBack; }}
        geolocationEnabled
        allowUniversalAccessFromFileURLs
        allowFileAccess
        source={uri}></WebView>
    </SafeAreaView>
  )
}

export default App;