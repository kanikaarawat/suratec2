import React, {Component} from 'react';
import {View} from 'react-native';
import {connect} from 'react-redux';

import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UI from '../../../config/styles/CommonStyles';
import AlertFix from '../../common/AlertsFix';
import CardForget from './card_forget';
import API from '../../../config/Api';

import Lang from '../../../assets/language/auth/lang_forget';

class ForgetPass extends Component {
  state = {
    email: '',
  };

  actionResetEmail = email => {
    if (email != '') {
      fetch(`${API}/forget-password`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      })
        .then(res => res.json())
        .then(res => {
          if (res.status != 'OK') {
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
            //sucsss !
            AlertFix.alertBasic(
              this.props.lang
                ? Lang.alertSuccessTitle.thai
                : Lang.alertSuccessTitle.eng,
              this.props.lang
                ? Lang.alertSuccessBody.thai
                : Lang.alertSuccessBody.eng,
            );
            this.props.navigation.navigate('SignIn');
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

  render() {
    return (
      <LinearGradient
        colors={UI.color_Gradient}
        style={{height: '100%', justifyContent: 'center'}}>
        <View style={{padding: 15}}>
          <CardForget
            labelTitle={
              this.props.lang ? Lang.titleName.thai : Lang.titleName.eng
            }
            labelEmail={
              this.props.lang ? Lang.fieldEmail.thai : Lang.fieldEmail.eng
            }
            inputEmail={txt => {
              this.setState({email: txt});
            }}
            labelBtn={this.props.lang ? Lang.titleBtn.thai : Lang.titleBtn.eng}
            onForget={() => this.actionResetEmail(this.state.email)}
            navigation={this.props.navigation}
            labelBack={
              this.props.lang ? Lang.labelBack.thai : Lang.labelBack.eng
            }
          />
        </View>
      </LinearGradient>
    );
  }
}

const mapStateToProps = state => {
  return {
    lang: state.lang,
  };
};

export default connect(mapStateToProps)(ForgetPass);
