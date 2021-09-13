import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  SafeAreaView,
  PermissionsAndroid
} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import { PERMISSIONS, requestMultiple } from 'react-native-permissions';
import SplashScreen from 'react-native-splash-screen'

import WebView from 'react-native-webview';



var rnw
var cbc = false;


const App = () => {

  const [phone, setPhone] = useState('')

  useEffect(() => {
    requestMultiple([PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION, PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.READ_PHONE_NUMBERS, PERMISSIONS.ANDROID.READ_PHONE_STATE]).then((statuses) => {
      console.log('ACCESS_COARSE_LOCATION', statuses[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]);
      console.log('ACCESS_FINE_LOCATION', statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]);
      console.log('READ_PHONE_NUMBERS', statuses[PERMISSIONS.ANDROID.READ_PHONE_NUMBERS]);
      console.log('READ_PHONE_STATE', statuses[PERMISSIONS.ANDROID.READ_PHONE_STATE]);
    }).then(() => {
      DeviceInfo.getPhoneNumber().then((phoneNumber) => {
        console.log(`폰번호 : ${phoneNumber.replace('+82', '0')}`)
        setPhone(phoneNumber.replace('+82', '0'))
        // Android: null return: no permission, empty string: unprogrammed or empty SIM1, e.g. "+15555215558": normal return value
      });
    })
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
    if (event.nativeEvent.data == 'phonenumber') {
      rnw.postMessage(phone)
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
        style={{ width: '100%', height: '100%' }}
        onNavigationStateChange={(navState) => { cbc = navState.canGoBack; }}
        source={{ uri: 'https://jelovc.cafe24.com/' }}></WebView>
    </SafeAreaView>
  )
}


export default App;