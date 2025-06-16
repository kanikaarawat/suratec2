import React, {Component} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {AccessToken, LoginManager} from 'react-native-fbsdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationActions, StackActions } from 'react-navigation';

import LinearGradient from 'react-native-linear-gradient';

import UI from '../../../config/styles/CommonStyles';
import AlertFix from '../../common/AlertsFix';
import API from '../../../config/Api';

import messaging from '@react-native-firebase/messaging';

import Iconsfooter from './iconsfooter';
import CardSingln from './card_singln';
import CardSingup from './card_singup';

import Lang from '../../../assets/language/auth/lang_singln';

import {connect} from 'react-redux';

class SingIn extends Component {
  state = {
    lang: 0,
    username: '',
    password: '',
    customer_info: [],
    loadfacebook: false,
  };
  
  async componentDidMount() {
    const authorizationStatus = await messaging().requestPermission();
    // await messaging().registerDeviceForRemoteMessages();
           console.log("hello"); console.log(await messaging().getToken(),"authorizationStatus");
    // const device_token = await firebase.messaging().getToken();  fpc001
  }


  addDeviceToken = async (userId, device_token, deviceType, roleInfo) => {
    fetch(`${API}/addDevice`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: device_token,
        device_type: deviceType,
        user_id: userId,
        user_role: roleInfo,
        status: 1,
      }),
    })
      .then(res => res.json())
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.log('Device ID Registration', err);
      });
  };

  actionSignln = async (username, password) => {
    if (!username || !password) {
      AlertFix.alertBasic(
          this.props.lang ? Lang.alertErrorTitle.thai : Lang.alertErrorTitle.eng,
          this.props.lang ? Lang.alertErrorBody2.thai : Lang.alertErrorBody2.eng,
      );
      return;
    }

    try {
      const response = await fetch(`${API}/check/login`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      console.log('Sign-in API payload ➜', data);

      if (data.status === 'ผิดพลาด') {
        AlertFix.alertBasic(
            this.props.lang ? Lang.alertErrorTitle.thai : Lang.alertErrorTitle.eng,
            this.props.lang ? Lang.alertErrorBody1.thai : Lang.alertErrorBody1.eng,
        );
        return;
      }

      /** -------- success branch -------- */
      const deviceType  = Platform.OS === 'ios' ? 2 : 1;
      const deviceToken = await messaging().getToken();

      /* Register the device for push */
      await this.addDeviceToken(
          data.member_info.id_data_role,
          deviceToken,
          deviceType,
          data.member_info.data_role,
      );

      /* Build the user object we keep in Redux */
      const userInfo = {
        ...data.user_info,
        role: data.member_info.data_role,      // 'mod_customer' or 'mod_employee'
        iddatarole: data.member_info.id_data_role,
        device_token: deviceToken,
        deviceType,
      };
      if (data.patients) userInfo.patients = data.patients;

      /* Persist doctor creds locally so PatientList -> “switch back” works */
      if (userInfo.role === 'mod_employee') {
        await AsyncStorage.setItem('doctor_username', username);
        await AsyncStorage.setItem('doctor_password', password);
      }

      /* Push into Redux */
      this.props.addUser({ user: userInfo, token: data.data });

      /* Deep-reset navigation target depending on role */
      /* Already stored user in Redux above … */

      if (userInfo.role === 'mod_employee') {
        // Send ONE action that jumps to AppSwitch AND inside AppStack to PatientList
        const jumpToPatientList = NavigationActions.navigate({
          routeName: 'App',                 // SwitchNavigator route
          action: NavigationActions.navigate({ routeName: 'PatientList' }) // inner stack
        });
        this.props.navigation.dispatch(jumpToPatientList);
      } else if (userInfo.role === 'mod_customer') {
        this.props.navigation.navigate('App');   // normal flow
      } else {
        AlertFix.alertBasic('Unknown role', 'You do not have access rights assigned.');
      }
    } catch (err) {
      console.error('Sign-in error ➜', err);
      AlertFix.alertBasic('Login failed', 'Network or server error. Please retry.');
    }
  };


  actionSignlnFacebook = token => {
    fetch(
      `https://graph.facebook.com/v2.12/me?fields=name,first_name,last_name,email&access_token=${token}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    )
      .then(res => res.json())
      .then(res => {
        console.log(res);

        fetch(`${API}/loginfacebook`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fname: res.first_name,
            lname: res.last_name,
            email: res.email,
            id_facebook: res.id,
          }),
        })
          .then(res => {
            return res.json();
          })
          .then(res => {
            console.log(res);

            if (res.status == 'สำเร็จ') {
              // console.log('array => ')
              // console.log(res.customer_info[0])
              // console.log('====')

              this.props.addUser({
                user: res.customer_info[0],
                token: res.customer_info[0].id_facebook,
              });
              this.props.navigation.navigate('App');
            } else if (res.status == 'สำเร็จพร้อมบันทึก') {
              // console.log('json => ')
              // console.log(res.customer_info)
              // console.log('====')

              this.props.addUser({
                user: res.customer_info,
                token: res.customer_info.id_facebook,
              });
              this.props.navigation.navigate('App');
            } else {
              alert('error');
            }
          })
          .catch(error => {
            console.log(error);
          });
      })
      .catch(error => {
        console.error(error);
      });
  };

  actionFacebook = async () => {
    let {isCancelled} = await LoginManager.logInWithPermissions([
      'public_profile',
      'email',
    ]);

    if (!isCancelled) {
      let data = await AccessToken.getCurrentAccessToken();
      this.actionSignlnFacebook(data.accessToken);
    }
  };

  actionTwitter = () => {
    //alert('Twitter !')
  };

  actionGoogle = () => {
    //alert('Google !')
  };

  actionLang = () => {
    this.props.lang == 1 ? this.props.edit_Lang(0) : this.props.edit_Lang(1);
  };

  render() {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={UI.color_Gradient}
          style={{height: '100%', justifyContent: 'center'}}>
          <View style={{padding: 15}}>
            <CardSingln
              labelLang={this.props.lang ? 'English' : 'ภาษาไทย'}
              onLang={() => this.actionLang()}
              labelTitle={
                this.props.lang ? Lang.titleName.thai : Lang.titleName.eng
              }
              labelBack={'test!'}
              labelUsername={
                this.props.lang
                  ? Lang.fieldUsername.thai
                  : Lang.fieldUsername.eng
              }
              inputUsername={txt => {
                this.setState({username: txt});
              }}
              labelPassword={
                this.props.lang
                  ? Lang.fieldPassword.thai
                  : Lang.fieldPassword.eng
              }
              inputPassword={txt => {
                this.setState({password: txt});
              }}
              labelBtn={
                this.props.lang ? Lang.titleBtn.thai : Lang.titleBtn.eng
              }
              labelForgetpass={
                this.props.lang ? Lang.labelForgot.thai : Lang.labelForgot.eng
              }
              onSingln={() => {
                this.props.addRightDevice(undefined);
                this.props.addLeftDevice(undefined);
                this.actionSignln(this.state.username, this.state.password);
              }
               
              }
              navigation={this.props.navigation}
              forgetpass={'ForgetPass'}
            />

            <CardSingup
              labelSignup={
                this.props.lang ? Lang.labelSignUp.thai : Lang.labelSignUp.eng
              }
              name={'Terms'}
              navigation={this.props.navigation}
            />

            <View style={{height: '5%'}} />

            {Platform.OS == 'android' ? (
              <Iconsfooter
                onFacebook={() => this.actionFacebook()}
                onTwitter={() => this.actionTwitter()}
                onGoogle={() => this.actionGoogle()}
              />
            ) : null}

            <View style={{height: '7%'}} />
          </View>
        </LinearGradient>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});

const mapDispatchToProps = dispatch => {
  return {
    addUser: user => {
      return dispatch({type: 'ADD_USERINFO', payload: user});
    },
    edit_Lang: data => {
      return dispatch({type: 'EDIT_LANG', payload: data});
    },
    addLeftDevice: device => {
      dispatch({type: 'ADD_LEFT_DEVICE', payload: device});
    },
    addRightDevice: device => {
      dispatch({type: 'ADD_RIGHT_DEVICE', payload: device});
    },
  };
};

const mapStateToProps = state => {
  return {
    lang: state.lang,
    rightDevice: state.rightDevice,
    leftDevice: state.leftDevice,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SingIn);
