import React, { Component } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessToken, LoginManager } from 'react-native-fbsdk';
import { NavigationActions } from 'react-navigation';
import LinearGradient from 'react-native-linear-gradient';

import AlertFix from '../../common/AlertsFix';
import messaging from '@react-native-firebase/messaging';
import API from '../../../config/Api';
import Lang from '../../../assets/language/auth/lang_singln';

import { connect } from 'react-redux';

class SignIn extends Component {
  state = {
    username: '',
    password: '',
    isFocused: null,
  };

  async componentDidMount() {
    const permission = await messaging().requestPermission();
    console.log("Messaging permission:", permission);
    const token = await messaging().getToken();
    console.log("Device Token:", token);
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
    }).then(res => res.json())
        .then(console.log)
        .catch(err => console.log('Device ID Registration Error', err));
  };

  actionSignIn = async (username, password) => {
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
      console.log('Login response:', data);

      if (data.status === 'ผิดพลาด') {
        AlertFix.alertBasic(
            this.props.lang ? Lang.alertErrorTitle.thai : Lang.alertErrorTitle.eng,
            this.props.lang ? Lang.alertErrorBody1.thai : Lang.alertErrorBody1.eng,
        );
        return;
      }

      const deviceType = Platform.OS === 'ios' ? 2 : 1;
      const deviceToken = await messaging().getToken();

      await this.addDeviceToken(
          data.member_info.id_data_role,
          deviceToken,
          deviceType,
          data.member_info.data_role,
      );

      const userInfo = {
        ...data.user_info,
        role: data.member_info.data_role,
        iddatarole: data.member_info.id_data_role,
        device_token: deviceToken,
        deviceType,
        security_token: data.data,
      };
      if (data.patients) userInfo.patients = data.patients;

      if (userInfo.role === 'mod_employee') {
        await AsyncStorage.setItem('doctor_username', username);
        await AsyncStorage.setItem('doctor_password', password);
      }

      this.props.addUser({ user: userInfo, token: data.data });
      console.log('USER ID:', userInfo.id_customer);
      console.log('SECURITY TOKEN:', data.data);


      if (userInfo.role === 'mod_employee') {
        const jumpToPatientList = NavigationActions.navigate({
          routeName: 'App',
          action: NavigationActions.navigate({ routeName: 'PatientList' }),
        });
        this.props.navigation.dispatch(jumpToPatientList);
      } else if (userInfo.role === 'mod_customer') {
        this.props.navigation.navigate('App');
      } else {
        AlertFix.alertBasic('Unknown role', 'You do not have access rights assigned.');
      }

    } catch (err) {
      console.error('Sign-in error ➜', err);
      AlertFix.alertBasic('Login failed', 'Network or server error. Please retry.');
    }
  };

  actionLang = () => {
    this.props.edit_Lang(this.props.lang === 1 ? 0 : 1);
  };

  render() {
    const { lang } = this.props;
    const { username, password, isFocused } = this.state;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <LinearGradient colors={['#00B3B3', '#007A7A']} style={styles.gradient}>
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Image
                    source={require('../../../assets/image/icons/surasolelogofallrisk.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>
                  {lang ? Lang.titleName.thai : Lang.titleName.eng}
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {lang ? Lang.signIn.thai : Lang.signIn.eng}
                  </Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {lang ? Lang.fieldUsername.thai : Lang.fieldUsername.eng}
                  </Text>
                  <TextInput
                      value={username}
                      onChangeText={(txt) => this.setState({ username: txt })}
                      style={[
                        styles.input,
                        isFocused === 'username' && styles.inputFocused,
                      ]}
                      onFocus={() => this.setState({ isFocused: 'username' })}
                      onBlur={() => this.setState({ isFocused: null })}
                      placeholder={lang ? Lang.usernamePlaceholder.thai : Lang.usernamePlaceholder.eng}
                      placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {lang ? Lang.fieldPassword.thai : Lang.fieldPassword.eng}
                  </Text>
                  <TextInput
                      value={password}
                      onChangeText={(txt) => this.setState({ password: txt })}
                      secureTextEntry
                      style={[
                        styles.input,
                        isFocused === 'password' && styles.inputFocused,
                      ]}
                      onFocus={() => this.setState({ isFocused: 'password' })}
                      onBlur={() => this.setState({ isFocused: null })}
                      placeholder={lang ? Lang.passwordPlaceholder.thai : Lang.passwordPlaceholder.eng}
                      placeholderTextColor="#888"
                  />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      this.props.addRightDevice(undefined);
                      this.props.addLeftDevice(undefined);
                      this.actionSignIn(username, password);
                    }}
                >
                  <Text style={styles.buttonText}>
                    {lang ? Lang.titleBtn.thai : Lang.titleBtn.eng}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={this.actionLang} style={styles.langButton}>
                <Text style={styles.langText}>
                  {lang ? 'English' : 'ภาษาไทย'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 120, height: 120,
    marginBottom: 15, borderRadius: 16,
  },
  title: {
    fontSize: 28, fontWeight: '700',
    color: '#FFF', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: { marginBottom: 25 },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00B3B3',
    textAlign: 'center',
  },
  divider: {
    height: 3,
    width: 60,
    backgroundColor: '#00B3B3',
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 2,
  },
  inputContainer: { marginBottom: 22 },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00B3B3',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputFocused: {
    borderColor: '#00B3B3',
    backgroundColor: '#FFF',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  button: {
    backgroundColor: '#00B3B3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#009E9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  langButton: { alignSelf: 'center', marginTop: 30, padding: 10 },
  langText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

const mapDispatchToProps = dispatch => ({
  addUser: user => dispatch({ type: 'ADD_USERINFO', payload: user }),
  edit_Lang: data => dispatch({ type: 'EDIT_LANG', payload: data }),
  addLeftDevice: device => dispatch({ type: 'ADD_LEFT_DEVICE', payload: device }),
  addRightDevice: device => dispatch({ type: 'ADD_RIGHT_DEVICE', payload: device }),
});

const mapStateToProps = state => ({
  lang: state.lang,
  rightDevice: state.rightDevice,
  leftDevice: state.leftDevice,
});

export default connect(mapStateToProps, mapDispatchToProps)(SignIn);
