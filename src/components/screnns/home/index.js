//5.11.2562 14.55

import React, {Component} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
  Button,
  Dimensions,
  SafeAreaView,
  BackHandler,
  Alert,
} from 'react-native';
import {NavigationEvents} from 'react-navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import UI from '../../../config/styles/CommonStyles';
import Text from '../../common/TextFix';
import ListItem from './listItem';
import BleManager from 'react-native-ble-manager';
import {connect} from 'react-redux';

import HeaderFix from '../../common/HeaderFix';
import messaging from '@react-native-firebase/messaging';

// import LangAlert from '../../../assets/language/alert/lang_alert';

import LangAlert from '../../../assets/language/alert/lang_alert';

import API, {IMAGE_URL} from '../../../config/Api';

var RNFS = require('react-native-fs');

import Modal, {
  ModalTitle,
  ModalContent,
  ModalFooter,
  ModalButton,
} from 'react-native-modals';
import RefreshComponent from '../../common/RefreshComponent';

const screenWidth = Math.round(Dimensions.get('window').width) * 0.25;
class index extends Component {
  constructor() {
    super();
    this.state = {
      count: 0,
      show: false,
      peripherals: new Map(),
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  actionProfile = () => {
    this.props.navigation.navigate('Profile');
  };
  actionLogout = async () => {
    //await AsyncStorage.clear();
    console.log('ActinLogot');
    this.actionDisconnectBle();
    this.props.resetUser();
    this.props.navigation.navigate('Auth');
  };

  actionDisconnectBle = async () => {
    if (typeof this.props.rightDevice !== 'undefined') {
      BleManager.disconnect(this.props.rightDevice);
    }
    if (typeof this.props.leftDevice !== 'undefined') {
      BleManager.disconnect(this.props.leftDevice);
    }
    this.props.addRightDevice(undefined);
    this.props.addLeftDevice(undefined);
    
  };

  async componentDidMount() {
    console.log('HOME !!!');
    console.log(this.props.user);
    console.log(this.state, 'here we go');
    await messaging().requestPermission();
    const enabled = await messaging().hasPermission();
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );

    NetInfo.addEventListener(this.handleConnectivityChange);

    this.sendDataToSetver();

    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]).then(() => {
        if (
          !this.props.user.age &&
          !this.props.user.weight &&
          !this.props.user.height
        ) {
          this.setState({show: true});
        }
      });
    } else {
      if (
        !this.props.user.age &&
        !this.props.user.weight &&
        !this.props.user.height
      ) {
        this.setState({show: true});
      }
    }
  }

  handleBackButtonClick = async () => {
    console.log(this.props.navigation.dangerouslyGetParent().state.index);
    let index = this.props.navigation.dangerouslyGetParent().state.index;
    if (index === 0) {
      Alert.alert(
        '',
        this.props.lang ? LangAlert.closeApp.thai : LangAlert.closeApp.eng,
        [
          {
            text: this.props.lang ? LangAlert.yes.thai : LangAlert.yes.eng,
            onPress: () => {
              this.actionDisconnectBle();
              setTimeout(() => {
                BackHandler.exitApp();
              }, 1000);
            },
          },
          {
            text: this.props.lang ? LangAlert.no.thai : LangAlert.no.eng,
            onPress: () => console.log('NO Pressed'),
          },
        ],
        {cancelable: false},
      );
      return true;
    }
  };

  handleConnectivityChange = status => {
    this.setState({isConnected: status.isConnected});
    if (this.state.isConnected) this.sendDataToSetver();
  };

  sendDataToSetver() {
    RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
      res.forEach(r => {
        console.log(r.path);
        RNFS.readFile(r.path)
          .then(text => {
            let data = JSON.parse(
              '[' + text.substring(0, text.length - 1) + ']',
            );
            var content = {
              data: data,
              id_customer: data[0].id_customer,
              id_device: '',
              type: 1, // for medical
            };
            fetch(`${API}/addjson`, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(content),
            })
              .then(resp => resp.json())
              .then(resp => {
                if (resp.status != 'ผิดพลาด') {
                  console.log(`Clear : ${r.path}`);
                  RNFS.unlink(r.path);

                  fetch(`${API}member/getUserDashboardStatic`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: this.props.user.id_customer,
                      // id: 'wef0cdb8296f90cc467fbf1d3645c57f9dp',
                    }),
                  })
                  .then(resp1 => {
                        console.log('============API Response============');
                        return  resp1.json();
                      })
                    .then(resp1 => {
                      
                      fetch(`${API}member/get_user_data`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: this.props.user.id_customer,
                          ...resp1
                          // id: 'wef0cdb8296f90cc467fbf1d3645c57f9dp',
                        }),
                      })
                        .then(res => {
                          console.log('============API Response============');
                          return console.log(res), res.json();
                        })
                        .then(res => {
                          console.log(res, 'responseFromAPU');

                        })
                        .catch(err => {
                          console.log(err);
                          this.setState({ isLoading: false });
                          Toast.show('Something went wrong. Please Try again!!!');
                        });
                    }

                    )
                    .catch(err => {
                      console.log(err);
                      this.setState({ isLoading: false });
                      Toast.show('Something went wrong. Please Try again!!!');
                    });
                }
              });
          })
          .catch(e => {});
      });
    });
  }

  popup = () => (
    <Modal
      width={0.9}
      visible={this.state.show}
      rounded
      actionsBordered
      onTouchOutside={() => {
        this.setState({show: false});
      }}
      modalTitle={
        <ModalTitle
          title="Warning - Please complete your profile"
          align="left"
        />
      }
      footer={
        <ModalFooter>
          <ModalButton
            text="Later"
            bordered
            onPress={() => {
              this.setState({show: false});
            }}
            key="button-1"
          />
          <ModalButton
            text="OK"
            bordered
            onPress={() => {
              this.setState({show: false});
              this.actionProfile();
            }}
            key="button-2"
          />
        </ModalFooter>
      }>
      <ModalContent style={{backgroundColor: '#fff'}}>
        <Text>some function will dosen't work</Text>
      </ModalContent>
    </Modal>
  );

  render() {
    let img = 'user.png';
    if (this.props.user.image === '' || this.props.user.image === undefined) {
      if (this.props.user.role == 'mod_employee') {
        img = 'doctor.png';
      } else {
        img = 'user.png';
      }
    } else {
      img = this.props.user.image;
    }

    return (
      <View style={{backgroundColor: 'white', flex: 1}}>
        {this.popup()}
        <ScrollView
          contentContainerStyle={{height: Dimensions.get('window').height}}>
          
          <View style={styles.oval}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: screenWidth * 0.2,
                top: screenWidth * 0.55,
                borderWidth: 1.2,
                borderColor: '#fff',
                padding: 2,
                borderRadius: screenWidth / 2,
              }}
              onPress={() => this.actionLogout()}>
              <Image
                style={{width: 30, height: 30}}
                source={require('../../../assets/image/icons/logout.png')}
              />
            </TouchableOpacity>
            {this.props.user && (
              <View
                style={{
                  top: -10,
                  alignContent: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  alignItems: 'center',
                }}>
                <TouchableOpacity onPress={() => this.actionProfile()}>
                  <Image
                    style={{
                      width: screenWidth - 20,
                      height: screenWidth - 20,
                      borderWidth: 1,
                      borderColor: '#fff',
                      padding: 2,
                      borderRadius: screenWidth / 2,
                    }}
                    // resizeMode="contain"
                    source={{
                      uri: this.props.user.image,

                      // uri: IMAGE_URL + img
                    }}
                  />
                  <Image
                    onPress={() => this.actionProfile()}
                    style={{
                      width: 35,
                      height: 35,
                      position: 'absolute',
                      top: -10,
                      right: -5,
                    }}
                    source={require('../../../assets/image/icons/pencil.png')}
                  />
                </TouchableOpacity>
                <Text
                  styles={{color: '#fff', height: 30, marginTop: 10}}
                  type={'bold'}>
                  {this.props.user.fname} {this.props.user.lname}
                </Text>
                <Text styles={{color: '#fff', fontWeight: '400', height: 40}}>
                  {this.props.user.email}
                </Text>
              </View>
            )}
          </View>

          <ListItem navigation={this.props.navigation} />
        </ScrollView>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  oval: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '35%',
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    borderBottomWidth: 30,
    borderColor: '#ffffff',
    backgroundColor: UI.color_Gradient[1],
    paddingTop: 50,
  },
});

const mapStateToProps = state => {
  return {
    user: state.user,
    lang: state.lang,
    rightDevice: state.rightDevice,
    leftDevice: state.leftDevice,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    upDateState: bleState => {
      dispatch({type: 'READ_BLUETOOTH_STATE', payload: bleState});
    },
    addLeftDevice: device => {
      dispatch({type: 'ADD_LEFT_DEVICE', payload: device});
    },
    resetUser: () => {
      return dispatch({type: 'RESET_USERINFO'});
    },
    addRightDevice: device => {
      dispatch({type: 'ADD_RIGHT_DEVICE', payload: device});
    },
    updatePath: path => {
      return dispatch({type: 'EDIT_PROFILE_PATH', payload: path});
    },
    selectedChat: bleState => {
      dispatch({type: 'SELECTED_CHAT', payload: bleState});
    },
    startCall: bleState => {
      dispatch({type: 'START_CALL', payload: bleState});
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(index);
