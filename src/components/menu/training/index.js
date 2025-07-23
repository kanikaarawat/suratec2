import React, {Component} from 'react';
import {
  Image,
  Dimensions,
  NativeModules,
  NativeEventEmitter,
  Vibration,
  Alert,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import {
  Container,
  Header,
  Content,
  Card,
  CardItem,
  Text,
  Button,
  Icon,
  Body,
  Title,
  Left,
  Right,
  Grid,
  Col,
  Tab,
  Tabs,
  Fab,
  View,
  Switch,
  Input,
  Item,
  Picker
} from 'native-base';
import {connect} from 'react-redux';
import {
  FileManager,
  getFileList,
  deleteFile,
  readFile,
} from '../../../FileManager';
import {Dropdown} from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderFix from '../../common/HeaderFix';
import NotificationsState from '../../shared/Notification';
import TextFix from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix';
import AlertFix from '../../common/AlertsFix';
import API from '../../../config/Api';

import CardStatusFix from '../../common/CardStatusFix';

import gradstop from 'gradstop';
import LinearGradient from 'react-native-linear-gradient';
import UI from '../../../config/styles/CommonStyles';
import * as Svg from 'react-native-svg';
import BleManager from 'react-native-ble-manager';

import Lang from '../../../assets/language/menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import TrainingLang from '../../../assets/language/menu/lang_training';


const settingsIcon = require('../../../assets/image/icons/settings.png');
const soundIcon = require('../../../assets/image/icons/sound.png');

var RNFS = require('react-native-fs');

const gradient = gradstop({
  stops: 30,
  inputFormat: 'hex',
  colorArray: [UI.color_buttonConfirm, UI.color_buttonAction],
});

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const TIMER = 100;
const TIMER_BIG = 1;

class index extends Component {
  //#region variable
  constructor() {
    super();
    this.state = {
      isFocus1: false,
      isFocus2: false,
      drpDown1PlcHldr: '',
      drpDown2PlcHldr: '',
      textAction: 'Record',
      rsensor: [0, 0, 0, 0, 0],
      rstage: 0,
      lsensor: [0, 0, 0, 0, 0],
      lstage: 0,
      shouldVibrate: false,
      mode: 0,
      foot: 0,
      status: 'waiting',
      statusTxt: 'waiting for device',
      isConnected: true,
      peripherals: new Map(),
      notiAlarm: 0,
      standard: '',
    };
  }

  leftSwingTime = 0;
  rightSwingTime = 0;
  leftStanceTime = 0;
  rightStanceTime = 0;
  durationTime = 0;
  fileTime = 0;
  leftPhase = 0;
  rightPhase = 0;
  duration = 0;
  fileStamp_n = '';

  readDelay = new Date();

  lsensor = [0, 0, 0, 0, 0];
  rsensor = [0, 0, 0, 0, 0];

  start = new Date();

  lastLtime = new Date();
  lastRtime = new Date();

  round = Math.floor(1000 + Math.random() * 9000);

  rtime = new Date();
  ltime = new Date();
  //#endregion

  componentDidMount = async () => {
    console.log('[NAVIGATION] Entered menu/training module');
    // notiAlarm
    let noti = await AsyncStorage.getItem('notiSetting');
    noti !== null ? this.setState({notiAlarm: parseInt(noti)}) : 100;

    this.getWalktrainingdata();

    // console.log(this.props.user)
    // console.log(this.actionGradientColor(Math.floor(Math.random() * 700)))
    NetInfo.addEventListener(this.handleConnectivityChange);
    this.retrieveConnected();
    this.startReading();

    this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
  };

  componentWillUnmount = () => {
    clearInterval(this.readInterval);
    if (this.dataRecord) {
      this.dataRecord.remove();
    }
    if (this.props.dispatch) {
      this.props.dispatch({ type: 'READ_BLUETOOTH_STATE', payload: false });
    }
    if (this.backHandler) this.backHandler.remove();
  };

  getWalktrainingdata() {
    fetch(`${API}/walktrainingdata/get/${this.props.user.id_customer}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(async res => {
        console.log(res.message);
        this.setState({standard: res.message});
      })
      .catch(error => {
        console.error(error);
      });
  }

  toDecimalArray(byteArray) {
    let dec = [];
    for (let i = 0; i < byteArray.length - 1; i += 2) {
      dec.push(byteArray[i] * 255 + byteArray[i + 1]);
    }
    return dec;
  }

  calMeasurePressure = value => {
    return 2.206 * Math.exp(0.0068 * value);
  };

  measurePressure = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (this.calMeasurePressure(sensor[i]) > this.state.notiAlarm) {
        Vibration.vibrate(100);
        return;
      }
    }
  };

  checkStandardForNoti = sensor => {
    if (this.state.mode == 1 && this.state.foot != 0) {
      let compareMax = 0;
      this.state.foot == 1
        ? (compareMax = this.state.standard.left_toe_touch)
        : (compareMax = this.state.standard.right_toe_touch);
      let sensorOneToKilo = this.toKilo(sensor[0]);
      let sensorTwoToKilo = this.toKilo(sensor[1]);
      let sensorThreeToKilo = this.toKilo(sensor[2]);
      let kilo = sensorOneToKilo + sensorTwoToKilo + sensorThreeToKilo;
      let sensorPercent = (kilo * 100) / this.props.user.weight;
      if (sensorPercent > compareMax) {
        Vibration.vibrate(100);
        return;
      }
    } else if (this.state.mode == 2 && this.state.foot != 0) {
      let compareMaxForefoot = 0;
      let compareMaxMidfoot = 0;
      this.state.foot == 1
        ? (compareMaxForefoot = this.state.standard.left_forefoot)
        : (compareMaxForefoot = this.state.standard.right_forefoot);
      this.state.foot == 1
        ? (compareMaxMidfoot = this.state.standard.left_midfoot)
        : (compareMaxMidfoot = this.state.standard.right_midfoot);
      let sensorOneToKilo = this.toKilo(sensor[0]);
      let sensorTwoToKilo = this.toKilo(sensor[1]);
      let sensorThreeToKilo = this.toKilo(sensor[2]);
      let sensorFourToKilo = this.toKilo(sensor[3]);
      let sumForefootKilo =
        sensorOneToKilo + sensorTwoToKilo + sensorThreeToKilo;
      let sensorPercentForefoot =
        (sumForefootKilo * 100) / this.props.user.weight;
      let sensorPercentMidfoot =
        (sensorFourToKilo * 100) / this.props.user.weight;
      if (
        sensorPercentForefoot > compareMaxForefoot ||
        sensorPercentMidfoot > compareMaxMidfoot
      ) {
        Vibration.vibrate(100);
        return;
      }
    } else if (this.state.mode == 3 && this.state.foot != 0) {
      let compareMaxFullweight = 0;
      this.state.foot == 1
        ? (compareMaxFullweight = this.state.standard.left_full_weight)
        : (compareMaxFullweight = this.state.standard.right_full_weight);
      let sensorOneToKilo = this.toKilo(sensor[0]);
      let sensorTwoToKilo = this.toKilo(sensor[1]);
      let sensorThreeToKilo = this.toKilo(sensor[2]);
      let sensorFourToKilo = this.toKilo(sensor[3]);
      let sensorFiveToKilo = this.toKilo(sensor[4]);
      let sumFullweightKilo =
        sensorOneToKilo +
        sensorTwoToKilo +
        sensorThreeToKilo +
        sensorFourToKilo +
        sensorFiveToKilo;
      let sensorPercentFullweight =
        (sumFullweightKilo * 100) / this.props.user.weight;
      if (sensorPercentFullweight > compareMaxFullweight) {
        Vibration.vibrate(100);
        return;
      }
    }
  };

  // สูตรแปลงค่าเป็น kilo
  toKilo = value => {
    const a1 = 1 / (1000 * ((5 / ((value * 5) / 1023)) -1));
    return ((2.36111 * Math.exp(1428.01995 * a1)) / 9.81) ;
  };

  shouldBeVibration = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (this.toKilo(sensor[i]) > this.props.user.weight * 0.2) {
        this.setState({shouldVibrate: true});
        return;
      }
    }
    this.setState({shouldVibrate: false});
  };

  getText = (value, weight, lang) => {
    let shouldVibrate = false;
    let status = '';
    let statusTxt = '';
    if (value >= weight * 0.8) {
      shouldVibrate = true;
      status = 'bad';
      lang
        ? (statusTxt = TrainingLang.highPressure.thai)
        : (statusTxt = TrainingLang.highPressure.thai);
    } else if (value >= weight * 0.6) {
      status = 'medium';
      lang
        ? (statusTxt = TrainingLang.mediumPressure.thai)
        : (statusTxt = TrainingLang.mediumPressure.thai);
    } else {
      status = 'good';
      lang
        ? (statusTxt = TrainingLang.lowPressure.thai)
        : (statusTxt = TrainingLang.lowPressure.thai);
    }
    return {shouldVibrate, status, statusTxt};
  };

  onModeSelected(mode, sensor, weight, lang) {
    let shouldVibrate = false;
    if (mode === 1) {
      // toe touch
      let sum = 0;
      let amount = 0;
      for (let i = 0; i < 3; i++) {
        // for 3 first senser
        if (sensor[i] > 0) {
          sum += sensor[i];
          amount += 1;
        }
      }
      if (amount === 0) amount = 1;
      let kilo = this.toKilo(sum / amount);
      let temp = this.getText(kilo, weight, lang);
      return {
        sensor: [sensor[0], sensor[1], sensor[2], 0, 0],
        shouldVibrate: temp.shouldVibrate,
        status: temp.status,
        statusTxt: temp.statusTxt,
      };
    } else if (mode === 2) {
      // partial touch
      let kilo = this.toKilo(sensor[0] + sensor[1] + sensor[2] + sensor[3] / 4);
      let temp = this.getText(kilo, weight, lang);
      return {
        sensor: [sensor[0], sensor[1], sensor[2], sensor[3], 0],
        shouldVibrate,
        status: temp.status,
        statusTxt: temp.statusTxt,
      };
    } else if (mode === 3) {
      // full weight
      let kilo = this.toKilo(
        sensor[0] + sensor[1] + sensor[2] + sensor[3] + sensor[4] / 5,
      );
      let temp = this.getText(kilo, weight, lang);
      return {
        sensor,
        shouldVibrate: temp.shouldVibrate,
        status: temp.status,
        statusTxt: temp.statusTxt,
      };
    } else {
      let kilo = this.toKilo(
        sensor[0] + sensor[1] + sensor[2] + sensor[3] + sensor[4] / 5,
      );
      let temp = this.getText(kilo, weight, lang);
      return {
        sensor,
        shouldVibrate: temp.shouldVibrate,
        status: temp.status,
        statusTxt: temp.statusTxt,
      };
    }
  }

  actionConnectDevice(peripheral) {
    if (peripheral) {
      if (peripheral.connected) {
        BleManager.disconnect(peripheral.id);
      } else {
        BleManager.connect(peripheral.id)
          .then(() => {
            let peripherals = this.state.peripherals;
            let p = peripherals.get(peripheral.id);
            if (p) {
              p.connected = true;
              peripherals.set(peripheral.id, p);
              this.setState({peripherals});
            }
            if (peripheral.name[peripheral.name.length - 1] === 'L') {
              this.props.addLeftDevice(peripheral.id);
            } else if (peripheral.name[peripheral.name.length - 1] === 'R') {
              this.props.addRightDevice(peripheral.id);
            }
            console.log('Connected to ' + peripheral.id);

            setTimeout(() => {
              BleManager.retrieveServices(peripheral.id).then(
                peripheralInfo => {
                  console.log(peripheralInfo);

                  var service;
                  var bakeCharacteristic;
                  var crustCharacteristic;
                  if (Platform.OS === 'android') {
                    service = '0000FFE0-0000-1000-8000-00805F9B34FB';
                    bakeCharacteristic = '0000FFE1-0000-1000-8000-00805F9B34FB';
                    crustCharacteristic =
                      '0000FFE1-0000-1000-8000-00805F9B34FB';
                  } else {
                    service = 'FFE0';
                    bakeCharacteristic = 'FFE1';
                    crustCharacteristic = 'FFE1';
                  }
                },
              );
            }, 900);
          })
          .catch(error => {
            console.log('Connection error', error);
          });
      }
    }
  }

  retrieveConnected() {
    BleManager.getConnectedPeripherals([]).then(results => {
      if (results.length == 0) {
        console.log('No connected peripherals');
      }
      console.log(results);
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        this.actionConnectDevice(peripheral);
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        this.setState({peripherals});
      }
    });
  }

  async startReading() {
    if (typeof this.props.record !== 'undefined') {
      if (this.props.record === 'Stop') {
        this.actionRecording();
      }
    } else {
      this.props.actionRecordingButton('Record');
      this.setState({textAction: 'Record'});
    }
    this.dataRecord = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({value, peripheral, characteristic, service}) => {
        let time = new Date();
        let newData = null;
        if (peripheral === this.props.rightDevice) {
          let rsensor = this.toDecimalArray(value);
          this.recordData(rsensor, 2);
          if (time - this.rtime > 250) {
            const {sensor, shouldVibrate} = this.onModeSelected(
              this.state.mode,
              rsensor,
              this.props.user.weight,
              this.props.lang,
            );
            this.setState({rsensor: sensor, shouldVibrate});
            this.rtime = time;
            newData = { side: 'right', sensor };
          }
        }
        if (peripheral === this.props.leftDevice) {
          let lsensor = this.toDecimalArray(value);
          this.recordData(lsensor, 1);
          if (time - this.ltime > 250) {
            const {sensor, shouldVibrate} = this.onModeSelected(
              this.state.mode,
              lsensor,
              this.props.user.weight,
              this.props.lang,
            );
            this.setState({lsensor: sensor, shouldVibrate});
            this.ltime = time;
            newData = { side: 'left', sensor };
          }
        }
        if (newData && this.props.dispatch) {
          this.props.dispatch({ type: 'ADD_BLUETOOTH_DATA', payload: newData });
        }
      },
    );
    if (this.props.dispatch) {
      this.props.dispatch({ type: 'READ_BLUETOOTH_STATE', payload: true });
    }
  }

  recordData(data, sensor) {
    if (sensor === 1) {
      this.lsensor = data;
    } else {
      this.rsensor = data;
    }

    if (this.props.noti === true && this.state.foot === sensor) {
      // this.measurePressure(data);
      this.checkStandardForNoti(data);
    }
  }

  // แสดงผลสี
  actionGradientColor = data => {
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    let cal = (avg * gradient.length - 1) / 700;
    cal >= 29 ? (cal = 29) : (cal = cal);
    return gradient[Math.round(cal)];
  };

  handleConnectivityChange = status => {
    this.setState({isConnected: status.isConnected});
    console.log(`Wifi Status : ${this.state.isConnected}`);
  };

  actionRecording = async () => {
    if (
      typeof this.props.rightDevice === 'undefined' &&
      typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert('Warning !', 'Please Check Your Bluetooth Connect', [
        {
          text: 'OK',
          onPress: () => {
            this.props.navigation.navigate('Device', {
              name: this.props.lang
                ? LangHome.addDeviceButton.thai
                : LangHome.addDeviceButton.eng,
            });
          },
        },
      ]);
      return;
    }
    console.log('==============' + this.state.textAction);
    if (this.state.textAction == 'Record') {
      this.setState({textAction: 'Stop'});
      this.props.actionRecordingButton('Stop');
      let initTime = new Date();
      this.start = initTime;
      this.lastLtime = initTime;
      this.lastRtime = initTime;
      this.readInterval = setInterval(async () => {
        time = new Date();
        data = {
          stamp: time.getTime(),
          timestamp: time,
          duration: Math.floor((time - this.start) / 1000),
          left: {
            sensor: this.lsensor,
            swing: this.leftSwingTime,
            stance: this.leftStanceTime,
          },
          right: {
            sensor: this.rsensor,
            swing: this.rightSwingTime,
            stance: this.rightStanceTime,
          },
          id_customer: this.props.user.id_customer,
        };
        try {
          // var file = await RNFS.stat(
          //   RNFS.CachesDirectoryPath +
          //     '/suratechM/' +
          //     this.start.getFullYear() +
          //     this.start.getMonth() +
          //     this.start.getDate() +
          //     this.round,
          // );
          // if (file.size > 100000) {
          //   this.round += 1;
          // }
          await await RNFS.appendFile(
            RNFS.CachesDirectoryPath +
              '/suratechM/' +
              this.start.getFullYear() +
              this.start.getMonth() +
              this.start.getDate() +
              this.round,
            JSON.stringify(data) + ',',
          );
        } catch {
          await RNFS.mkdir(RNFS.CachesDirectoryPath + '/suratechM/');
          await RNFS.appendFile(
            RNFS.CachesDirectoryPath +
              '/suratechM/' +
              this.start.getFullYear() +
              this.start.getMonth() +
              this.start.getDate() +
              this.round,
            JSON.stringify(data) + ',',
          );
        }
      }, 100);
    } else {
      this.setState({textAction: 'Record'});
      this.props.actionRecordingButton('Record');
      clearInterval(this.readInterval);
      this.sendDataToSetver();
    }
  };

  sendDataToSetver() {
    this.state.isConnected == false
      ? RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
          console.log('WiFi is not connect');
          res.forEach(r => {
            console.log(r.path);
          });
        })
      : RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
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
                  product_number: this.props.productNumber,
                  bluetooth_left_id: this.props.rightDevice,
                  bluetooth_right_id: this.props.leftDevice,
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
    alert(this.props.lang ? Lang.alert.thai : Lang.alert.eng);
  }

  actionDashboard = () => {
    // if (this.state.switch) {
    //   Vibration.vibrate(1500);
    // }
    // Vibration.vibrate(DURATION);
    this.props.navigation.navigate('Dashboard');
  };

  actionUpdate = content => {
    console.log('Update =>');

    content = {
      data: content,
      id_customer: this.props.user.id_customer,
      id_device: '',
      type: 1, // for medical
    };
    console.log(content);

    // console.log('Delete =>' + this.fileStamp_n);

    fetch(`${API}/addjson`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    })
      .then(res => res.json())
      .then(res => {
        console.log('res => ');
        console.log(res);
        if (res.status === 'สำเร็จ') {
          AlertFix.alertBasic(
            this.props.lang ? Lang.successTitle.thai : Lang.successTitle.eng,
            this.props.lang ? Lang.successBody.thai : Lang.successBody.eng,
          );
          deleteFile(this.fileStamp_n);
        } else {
          AlertFix.alertBasic(
            this.props.lang ? Lang.errorTitle.thai : Lang.errorTitle.eng,
            this.props.lang ? Lang.errorBody1.thai : Lang.errorBody1.eng,
          );
        }
      })
      .catch(error => {
        AlertFix.alertBasic(
          this.props.lang ? Lang.errorTitle.thai : Lang.errorTitle.eng,
          this.props.lang ? Lang.errorBody2.thai : Lang.errorBody2.eng,
        );
      });

    //อ่านไฟล์ และส่งข่อมูล

    // fetch(`${API}/..`, {
    //   method: 'POST',
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     id_customer: this.props.user.id_customer
    //   })
    // }).then((res) => res.json())
    //   .then((res) => {
    //     if (res.status != 'บันทึกข้อมูลสำเร็จ') {
    //       //error
    //       AlertFix.alertBasic(null, 'ไม่สามาถแก้ไขโปรไฟล์ได้ !')
    //     } else {
    //       //sucsss !
    //       AlertFix.alertBasic(false, 'แก้ไขข้อมูลสำเร็จ !')

    //       this.props.navigation.goBack()
    //     }
    //   }).catch((error) => {
    //     console.error(error);
    //   });
  };

  canVibration = (vibrate, master) => {
    if (vibrate && master) {
      Vibration.vibrate(500);
    } else {
      Vibration.cancel();
    }
  };

  onDropDownChange = (item, value) => {
    // alert(item)
    this.setState({drpDown2PlcHldr: value});
    switch (item) {
      case '1':
        this.setState({mode: item});
        break;
      case '2':
        this.setState({mode: item});
        break;
      case '3':
        this.setState({mode: item});
        break;
      default:
        this.setState({mode: 0});
        break;
    }
  };

  selectFoot = (item, value) => {
    switch (item) {
      case '1':
        this.setState({drpDown1PlcHldr: value});
        this.setState({foot: item});
        break;
      case '2':
        this.setState({drpDown1PlcHldr: value});
        this.setState({foot: item});
        break;
      default:
        this.setState({drpDown1PlcHldr: ''});
        this.setState({foot: 0});
        break;
    }
  };

  handleBackPress = () => {
    const { navigation } = this.props;
    if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
      return true;
    } else if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Home');
      return true;
    }
    return false;
  };

  render() {
    this.canVibration(this.state.shouldVibrate, this.state.switch);
    return (
      <Container style={{backgroundColor: '#fff'}}>
        <HeaderFix
          icon_left={'left'}
          onpress_left={() => {
            this.props.navigation.goBack();
          }}
          title={'Walk Training'}
        />

        <Content contentContainerStyle={{flexGrow: 1}}>

          {/* Settings Heading */}
          <View style={styles.settingsHeader}>
            <Text style={styles.headerText}>Settings</Text>
            <TouchableOpacity 
              onPress={() => this.props.navigation.navigate('WalkTrainingSettings')}
              style={styles.iconButton}>
              <Image source={settingsIcon} style={styles.icon} />
            </TouchableOpacity>
          </View>

          {/* Notification Section */}
          <Card style={styles.notificationContainer}>
            <View style={styles.notificationRow}>
              <Text style={styles.notificationText}>Notifications</Text>
              <View style={styles.notificationControls}>
                <Switch
                  value={this.props.noti}
                  onValueChange={v => this.props.actionNotificationButton(v)}
                  thumbColor={this.props.noti ? UI.color_buttonConfirm : UI.color_greyLight}
                  trackColor={{false: UI.color_greyLight, true: UI.color_buttonConfirmLight}}
                />
                <Image source={soundIcon} style={[styles.icon, styles.soundIcon]} />
              </View>
            </View>
          </Card>

          {/* Dropdowns Row */}
          <View style={styles.dropdownsContainer}>
            <View style={styles.dropdownWrapper}>
              <Text style={styles.dropdownLabel}>Select foot</Text>
              <Dropdown
                style={[styles.dropdown, this.state.isFocus1 && {borderColor: 'blue'}]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                iconStyle={styles.iconStyle}
                data={[
                  {label: 'Left', value: 'Left', id: '1'},
                  {label: 'Right', value: 'Right', id: '2'},
                ]}
                itemTextStyle={styles.placeholderStyle}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={'Select item'}
                value={this.state.drpDown1PlcHldr}
                onFocus={() => this.setState({isFocus1: true})}
                onBlur={() => this.setState({isFocus1: false})}
                onChange={item => {
                  this.selectFoot(item.id, item.value);
                  this.setState({isFocus1: false});
                }}
              />
            </View>

            <View style={styles.dropdownWrapper}>
              <Text style={styles.dropdownLabel}>Select training mode</Text>
              <Dropdown
                style={[styles.dropdown, this.state.isFocus2 && {borderColor: 'blue'}]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                iconStyle={styles.iconStyle}
                data={[
                  {label: 'Toe touch', value: 'Toe touch', id: '1'},
                  {label: 'Partial weight', value: 'Partial weight', id: '2'},
                  {label: 'Full weight', value: 'Full weight', id: '3'},
                ]}
                itemTextStyle={styles.placeholderStyle}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={'Select item'}
                value={this.state.drpDown2PlcHldr}
                onFocus={() => this.setState({isFocus2: true})}
                onBlur={() => this.setState({isFocus2: false})}
                onChange={item => {
                  this.onDropDownChange(item.id, item.value);
                  this.setState({isFocus2: false});
                }}
              />
            </View>
          </View>

          {/* Footprints - SVG Version */}
          <View style={styles.footprintsContainer}>
            <View style={styles.footSvgContainer}>
              <Svg.Svg
                width={Dimensions.get('window').width / 2.5}
                height={Dimensions.get('window').height / 2.5}
                viewBox="0 0 382.38 1010.54">
                <Svg.Path
                  fill="#999999"
                  d="M211,1010.19a153.23,153.23,0,0,0,15.74-.84H195.63A151.93,151.93,0,0,0,211,1010.19Z"
                  transform="translate(0 0)"
                />
                <Svg.Path
                  fill={
                    this.state.foot === 1
                      ? this.actionGradientColor([this.state.lsensor[4]])
                      : this.actionGradientColor([0])
                  }
                  d="M364.26,759.82c-5-26.36-12.86-52-20.44-76.88-4.93-16.16-10-32.87-14.28-49.56-1.93-7.57-4.5-15-5.89-22.46H56.34c4,39.25,2.11,79.19.14,120.42-1,22-2.12,44.69-2.22,67.16-.27,63.6,8,152.89,82.84,194a152.1,152.1,0,0,0,58.07,18h31a152.82,152.82,0,0,0,86.65-38.4C377.7,913.7,376.6,824.49,364.26,759.82Z"
                  transform="translate(0 0)"
                />
                <Svg.Path
                  fill={
                    this.state.foot === 1
                      ? this.actionGradientColor([this.state.lsensor[3]])
                      : this.actionGradientColor([0])
                  }
                  d="M1.93,308.16c-2.66,34-2.59,66.19.35,96,4.26,43.28,17.86,80.77,35.19,125.29,4,13.81,8.45,28.25,12.48,41.09a342.5,342.5,0,0,1,6.51,40.79H324c-7.8-41.4-7.21-80.4,1.86-118.55,6.46-27.25,15.88-54.21,25-80.29,6.88-19.7,14-40.07,19.85-60.54a333.92,333.92,0,0,0,9.39-43.79Z"
                  transform="translate(0 0)"
                />
                <Svg.Path
                  fill={
                    this.state.foot === 1
                      ? this.actionGradientColor([
                          this.state.lsensor[0],
                          this.state.lsensor[1],
                          this.state.lsensor[2],
                        ])
                      : this.actionGradientColor([0])
                  }
                  d="M380.15,308.16a292.35,292.35,0,0,0-2.82-90.07c-16.46-88-42.54-174.16-120.56-208.76-.21-.09-.42-.18-.64-.25s-.52-.25-.81-.37C200.46-12.56,133.87,6.08,93.33,54,36.52,121.28,14.43,212.3,5.87,276.83c-1.23,9.3-2.2,18.46-3,27.52l-.37,3.81Z"
                  transform="translate(0 0)"
                />
              </Svg.Svg>
            </View>
            <View style={styles.footSvgContainer}>
              <Svg.Svg
                width={Dimensions.get('window').width / 2.5}
                height={Dimensions.get('window').height / 2.5}
                viewBox="0 0 387.21 1023.36">
                <Svg.Path
                  fill="#999999"
                  d="M173.54,1023.05a154.31,154.31,0,0,1-15.94-.86h31.51A152.79,152.79,0,0,1,173.54,1023.05Z"
                  transform="translate(-0.05 0)"
                />
                <Svg.Path
                  fill={
                    this.state.foot === 2
                      ? this.actionGradientColor([this.state.rsensor[4]])
                      : this.actionGradientColor([0])
                  }
                  d="M70,984.47a154.76,154.76,0,0,0,87.76,38.89h31.49A154,154,0,0,0,248,1005.14c75.77-41.63,84.17-132,83.9-196.44-.1-22.76-1.2-45.77-2.25-68-2-41.78-3.88-82.18.14-121.94H59.09c-1.41,7.5-4,15-6,22.75-4.3,16.89-9.47,33.82-14.46,50.17C31,716.82,23,742.79,17.92,769.53,5.45,834.94,4.34,925.38,70,984.47Z"
                  transform="translate(-0.05 0)"
                />
                <Svg.Path
                  fill={
                    this.state.foot === 2
                      ? this.actionGradientColor([this.state.rsensor[3]])
                      : this.actionGradientColor([0])
                  }
                  d="M385.3,312.08c2.7,34.42,2.62,67-.36,97.27-4.31,43.79-18.08,81.76-35.63,126.84-4.07,14-8.56,28.61-12.65,41.62a349.17,349.17,0,0,0-6.58,41.29H59.1c7.9-42,7.3-81.45-1.84-120-6.54-27.6-16.09-54.91-25.32-81.32-7-19.95-14.18-40.58-20.1-61.31A338.25,338.25,0,0,1,2.3,312.08Z"
                  transform="translate(-0.05 0)"
                />
                <Svg.Path
                  fill={
                    this.state.foot === 2
                      ? this.actionGradientColor([
                          this.state.rsensor[0],
                          this.state.rsensor[1],
                          this.state.rsensor[2],
                        ])
                      : this.actionGradientColor([0])
                  }
                  d="M2.3,312.08a296,296,0,0,1,2.85-91.21C21.82,131.74,48.19,44.44,127.2,9.45c.21-.09.42-.18.64-.25a8.58,8.58,0,0,1,.82-.37c55.56-21.54,123-2.67,164.06,45.9C350.3,122.82,372.62,215,381.3,280.36c1.24,9.43,2.23,18.69,3.08,27.88l.37,3.85Z"
                  transform="translate(-0.05 0)"
                />
              </Svg.Svg>
            </View>
          </View>

          {/* Gradient Bar */}
          <View style={styles.gradientContainer}>
            <LinearGradient
              start={{x: 0.0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              colors={[UI.color_buttonConfirm, UI.color_buttonAction]}
              style={styles.gradientBar}
            />
          </View>

          {/* Record Button */}
          <View style={styles.buttonContainer}>
            <ButtonFix
              action={true}
              rounded={true}
              title={this.state.textAction}
              onPress={() => this.actionRecording()}
            />
          </View>
        </Content>

      </Container>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.user,
    leftDevice: state.leftDevice,
    rightDevice: state.rightDevice,
    lang: state.lang,
    record: state.record,
    noti: state.noti,
    productNumber: state.productNumber,
  };
};

const mapDisPatchToProps = dispatch => {
  return {
    addLeftDevice: device => {
      return dispatch({type: 'ADD_LEFT_DEVICE', payload: device});
    },
    addRightDevice: device => {
      return dispatch({type: 'ADD_RIGHT_DEVICE', payload: device});
    },
    addDashBoardData: data => {
      return dispatch({type: 'ADD_BLUETOOTH_DATA', payload: data});
    },
    actionRecordingButton: data => {
      return dispatch({type: 'ACTION_BUTTON_RECORD', payload: data});
    },
    actionNotificationButton: data => {
      return dispatch({type: 'ACTION_BUTTON_NOTIFICATION', payload: data});
    },
  };
};

export default connect(mapStateToProps, mapDisPatchToProps)(index);

const styles = StyleSheet.create({
settingsHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16,
  paddingBottom: 8,
},
headerText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#000', // Changed to black for better visibility
},
iconButton: {
  padding: 4,
},
icon: {
  width: 24,
  height: 24,
  tintColor: UI.color_textSecondary,
},
notificationContainer: {
  marginHorizontal: 16,
  marginBottom: 16,
  borderRadius: 8,
  padding: 16,
  backgroundColor: '#fff',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 1,
},
notificationRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
notificationText: {
  fontSize: 16,
  color: '#000', // Changed to black for better visibility
},
notificationControls: {
  flexDirection: 'row',
  alignItems: 'center',
},
soundIcon: {
  marginLeft: 16,
},
// ... rest of your styles remain the same
  dropdownsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  dropdownWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  dropdown: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#666',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  footprintsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  footSvgContainer: {
    marginHorizontal: 8,
  },
  gradientContainer: {
    height: 18,
    marginHorizontal: 20,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 16,
  },
  gradientBar: {
    height: '100%',
    width: '100%',
  },
  statusCard: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 16,
  },
});
