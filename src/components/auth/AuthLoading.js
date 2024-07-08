import React, {Component} from 'react';
import {View, ActivityIndicator, StatusBar, StyleSheet} from 'react-native';
import {connect} from 'react-redux';

class AuthLoading extends React.PureComponent {
  constructor(props) {
    super(props);

    this._bootstrapAsync();
  }

  _bootstrapAsync = () => {
    this.props.navigation.navigate(this.props.user ? 'App' : 'Auth');
    // await AsyncStorage.setItem('lang', '0'); // ( 0 , true ) = ภาษาไทย || ( 1 , false ) = ภาษาอังกฤษ
    // const userToken = await AsyncStorage.getItem('userToken');

    //this.props.navigation.navigate(this.props.user ? 'App' : 'Auth');
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const mapStateToProps = state => {
  return {
    user: state.token,
  };
};

export default connect(mapStateToProps)(AuthLoading);
