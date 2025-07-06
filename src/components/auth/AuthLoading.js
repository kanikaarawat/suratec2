import React, { PureComponent } from 'react';
import { View, ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXIT_FLAG = 'doctor_left_on_patientlist';

class AuthLoading extends PureComponent {
  componentDidMount() {
    this.bootstrap();
  }

  /**  Decide where to go next */
  bootstrap = async () => {
    try {
      // 1️⃣ Did the doctor quit the app while on PatientList?
      const leftOnPatientList = await AsyncStorage.getItem(EXIT_FLAG);

      if (leftOnPatientList === '1') {
        // wipe flag + auth keys, then force Sign-In
        await AsyncStorage.multiRemove([
          EXIT_FLAG,
          'token',
          'user',
          'doctor_user',
          'doctor_token',
          'patient_token',
          'patient_id',
        ]);
        this.props.navigation.navigate('Auth');
        return;
      }

      // 2️⃣ Normal path: token present → App, otherwise → Auth
      this.props.navigation.navigate(this.props.token ? 'App' : 'Auth');
    } catch (e) {
      // fallback: go to Sign-In if anything goes wrong
      console.log('AuthLoading bootstrap error', e);
      this.props.navigation.navigate('Auth');
    }
  };

  render() {
    return (
        <View style={styles.container}>
          <ActivityIndicator />
          <StatusBar barStyle="default" />
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

const mapStateToProps = state => ({
  token: state.token,        // <- token is what really matters
});

export default connect(mapStateToProps)(AuthLoading);
