import React, {Component} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {AccessToken, LoginManager} from 'react-native-fbsdk';

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
    if (username != '' && password != '') {
      console.log(username);
      console.log(API);

      console.log(password);
      fetch(`${API}/check/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      })
        .then(res => res.json())
        .then(async res => {
          console.log(res);
          if (res.status == 'ผิดพลาด') {
            //error
            AlertFix.alertBasic(
              this.props.lang
                ? Lang.alertErrorTitle.thai
                : Lang.alertErrorTitle.eng,
              this.props.lang
                ? Lang.alertErrorBody1.thai
                : Lang.alertErrorBody1.eng,
            );
          } else {
            // AsyncStorage.setItem('userToken', res.data);
            // AsyncStorage.setItem('userInfo', JSON.stringify(res.user_info));
            // AsyncStorage.setItem('memberInfo', JSON.stringify(res.member_info));
            // AsyncStorage.setItem('role', res.member_info.data_role);
            // AsyncStorage.setItem('id', res.user_info.id_member);

            const deviceType = Platform.OS === 'ios' ? 2 : 1;
            let userInfo = res.user_info;
            const useId = res.member_info.id_data_role;
            const roleInfo = res.member_info.data_role;
            console.log('Firebase Token');
            // const device_token = await messaging()
            // .registerDeviceForRemoteMessages() // no-op on Android and if already registered
            // .then(() => messaging())
            // .then((t) => t
            // )fpc001
            const device_token = await messaging().getToken();
            console.log('Firebase Token', device_token);
            await this.addDeviceToken(
              useId,
              device_token,
              deviceType,
              roleInfo,
            );
            userInfo.role = res.member_info.data_role;
            userInfo.device_token = device_token;
            userInfo.deviceType = deviceType;
            userInfo.iddatarole = res.member_info.id_data_role;

            this.props.addUser({user: userInfo, token: res.data});
            this.props.navigation.navigate('App');
          }
        })
        .catch(error => {
          console.error(error);
        });
    } else {
      AlertFix.alertBasic(
        this.props.lang ? Lang.alertErrorTitle.thai : Lang.alertErrorTitle.eng,
        this.props.lang ? Lang.alertErrorBody2.thai : Lang.alertErrorBody2.eng,
      );
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
