import React, {Component} from 'react';
import {View, ActivityIndicator, StatusBar, StyleSheet} from 'react-native';
import {connect} from 'react-redux';

class Loading extends React.PureComponent {
  constructor(props) {
    super(props);
    this._Loading();
  }

  _Loading = () => {
    setTimeout(() => {
      this.props.navigation.navigate('AuthLoading');
    }, 1000);
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

export default connect(mapStateToProps)(Loading);
