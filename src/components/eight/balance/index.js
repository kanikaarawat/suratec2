//5.11.62

import React, { Component } from 'react';
import {
  View,
  Image,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
  Vibration,
  TouchableOpacity, Text as RNText,
  Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Col, Grid } from 'react-native-easy-grid';
import { connect } from 'react-redux';

import HeaderFix from '../../common/HeaderFix';
import NotificationsState from '../../shared/Notification';
import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix';
import RadarChartFix from '../../common/RadarChartFix';
import CardStatusFix from '../../common/CardStatusFix';
import AlertFix from '../../common/AlertsFix';
import ScoreFix from '../../common/ScoreFix';
import API from '../../../config/Api';
import BleManager from 'react-native-ble-manager';

import {
  FileManager,
  getFileList,
  deleteFile,
  readFile,
} from '../../../FileManager';
import { TabHeading } from 'native-base';

import BalanceLang from '../../../assets/language/menu/lang_balance';
import Lang from '../../../assets/language/menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import { getLocalizedText } from '../../../assets/language/langUtils';

const RNFS = require('react-native-fs');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const TIMER = 100;
const TIMER_BIG = 1;
const Duration = 1500;

class index extends Component {
  leftSwingTime = 0;
  rightSwingTime = 0;
  leftStanceTime = 0;
  rightStanceTime = 0;
  durationTime = 0;

  lsensor = [0, 0, 0, 0, 0, 0, 0, 0];
  rsensor = [0, 0, 0, 0, 0, 0, 0, 0];

  readDelay = new Date();
  start = new Date();
  lastRtime = new Date();
  lastLtime = new Date();

  round = Math.floor(1000 + Math.random() * 9000);

  ltime = new Date();
  rtime = new Date();

  counter = 1;

  state = {
    textAction: 'Record',
    lstage: 0,
    rstage: 0,
    xPosN: 150,
    yPosN: 150,
    focus: true,
    lphase: 0,
    rphase: 0,
    rsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    lsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    shouldVibrate: false,
    score: 0,
    balance: 0,
    txt: '',
    status: 'waiting',
    isConnected: true,
    peripherals: new Map(),
    notiAlarm: 0,
    shoeSize: 0,
    // Removed selectedMenu and menuAction from state
  };

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

  toDecimalArray(byteArray) {
    let dec = [];
    for (let i = 0; i < byteArray.length - 1; i += 2) {
      dec.push(byteArray[i] * 255 + byteArray[i + 1]);
    }
    return dec;
  }

  toKilo = value => {
    return (5.6 * 10 ** -4 * Math.exp(value / 53.36) + 6.72) / 0.796;
  };

  shouldBeVibration = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (this.toKilo(sensor[i]) > this.props.user.weight * 0.3) {
        return true;
      }
    }
    return false;
  };

  componentDidMount = async () => {
    // notiAlarm
    let noti = await AsyncStorage.getItem('notiSetting');
    noti !== null ? this.setState({ notiAlarm: parseInt(noti) }) : 100;
    NetInfo.addEventListener(this.handleConnectivityChange);
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didFocus', () => {
      this.retrieveConnected();
      this.startReading();
      this.setState({ focus: true });
    });
    this.zoneInterval = setInterval(() => {
      var score =
        (this.state.balance + Number.parseInt(this.state.score)) / this.counter;
      this.setState({ score: score.toFixed(0) }, () => this.counter++);
    }, 1000);
  };

  componentWillUnmount = () => {
    clearInterval(this.readInterval);
    clearInterval(this.zoneInterval);
    if (this.dataRecord) {
      this.dataRecord.remove();
    }
    this.focusListener.remove();
  };

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
              this.setState({ peripherals });
            }
            if (peripheral.name[peripheral.name.length - 1] === 'L') {
              this.props.addLeftDevice(peripheral.id);
              this.setState({ shoeSize: peripheral.name[peripheral.name.length - 3] + peripheral.name[peripheral.name.length - 2] })
            } else if (peripheral.name[peripheral.name.length - 1] === 'R') {
              this.props.addRightDevice(peripheral.id);
            }

            setTimeout(() => {
              BleManager.retrieveServices(peripheral.id).then(
                peripheralInfo => {
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
        // console.log('No connected peripherals');
      }
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        this.actionConnectDevice(peripheral);
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals });
      }
    });
  }

  async startReading() {
    this.dataRecord = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral, characteristic, service }) => {
        let time = new Date();
        if (peripheral === this.props.rightDevice) {
          let rsensor = this.toDecimalArray(value);
          this.recordData(rsensor, 'R');
          if (time - this.rtime > 250) {
            let lsensor = this.state.lsensor;
            let shouldVibrate = this.shouldBeVibration(lsensor);
            let sumright =
              (rsensor[0] + rsensor[1] + rsensor[2] + rsensor[3] + rsensor[4]) /
              5 +
              (rsensor[5] + rsensor[6]) / 2 +
              rsensor[7];
            let sumleft =
              (lsensor[0] + lsensor[1] + lsensor[2] + lsensor[3] + lsensor[4]) /
              5 +
              (lsensor[5] + lsensor[6]) / 2 +
              lsensor[7];
            let sumup =
              (rsensor[0] + rsensor[1] + rsensor[2] + rsensor[3] + rsensor[4]) /
              5 +
              (lsensor[0] + lsensor[1] + lsensor[2] + lsensor[3] + lsensor[4]) /
              5;
            let sumdown = lsensor[7] + rsensor[7];
            let xPos = (sumright - sumleft) / 23.4;
            let yPos = (sumup - sumdown) / -15.6;
            let xPosN = (xPos + 100) * 1.5;
            let yPosN = (yPos + 100) * 1.5;
            let rphase = rsensor.reduce((a, b) => a + b, 0);
            let { txt, status, balance } = this.setStatus(xPos, yPos);
            this.setState({
              xPosN,
              yPosN,
              rphase,
              rsensor,
              shouldVibrate,
              txt,
              status,
              balance,
            });
            this.rtime = time;
          }
        }
        if (peripheral === this.props.leftDevice) {
          let lsensor = this.toDecimalArray(value);
          this.recordData(lsensor, 'L');
          if (time - this.ltime > 250) {
            let rsensor = this.state.rsensor;
            let shouldVibrate = this.shouldBeVibration(lsensor);
            let sumright =
              (rsensor[0] + rsensor[1] + rsensor[2] + rsensor[3] + rsensor[4]) /
              5 +
              (rsensor[5] + rsensor[6]) / 2 +
              rsensor[7];
            let sumleft =
              (lsensor[0] + lsensor[1] + lsensor[2] + lsensor[3] + lsensor[4]) /
              5 +
              (lsensor[5] + lsensor[6]) / 2 +
              lsensor[7];
            let sumup =
              (rsensor[0] + rsensor[1] + rsensor[2] + rsensor[3] + rsensor[4]) /
              5 +
              (lsensor[0] + lsensor[1] + lsensor[2] + lsensor[3] + lsensor[4]) /
              5;
            let sumdown = lsensor[7] + rsensor[7];
            let xPos = (sumright - sumleft) / 23.4;
            let yPos = (sumup - sumdown) / -15.6;
            let xPosN = (xPos + 100) * 1.5;
            let yPosN = (yPos + 100) * 1.5;

            let lphase = lsensor.reduce((a, b) => a + b, 0);
            let { txt, status, balance } = this.setStatus(xPos, yPos);
            this.setState({
              xPosN,
              yPosN,
              lphase,
              lsensor,
              shouldVibrate,
              txt,
              status,
              balance,
            });
            this.ltime = time;
          }
        }
      },
    );
  }

  recordData(data, sensor) {
    if (sensor == 'L') {
      this.lsensor = data;
    } else {
      this.rsensor = data;
    }

    if (this.props.noti === true) {
      this.measurePressure(data);
    }
  }

  setStatus(x, y) {
    var persent = 0;
    if (x > y) {
      persent = Math.abs(x);
    } else {
      persent = Math.abs(y);
    }
    if (100 - persent >= 80) {
      return {
        txt: getLocalizedText(this.state.lang, BalanceLang.goodBalance),
        status: 'Good',
        balance: Math.round(100 - persent),
      };
    } else if (100 - persent >= 40) {
      return {
        txt: getLocalizedText(this.state.lang, BalanceLang.goodBalance),
        status: 'Medium',
        balance: Math.round(100 - persent),
      };
    } else {
      return {
        txt: getLocalizedText(this.state.lang, BalanceLang.badBalance),
        status: 'Bad',
        balance: Math.round(100 - persent),
      };
    }
  }

  handleConnectivityChange = status => {
    this.setState({ isConnected: status.isConnected });
    // console.log(`Wifi Status : ${this.state.isConnected}`);
  };

  actionRecording = async () => {
    if (
      typeof this.props.rightDevice === 'undefined' &&
      typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert(getLocalizedText(this.props.lang, BalanceLang.warning), getLocalizedText(this.props.lang, BalanceLang.bluetoothAlert), [
        {
          text: 'OK',
          onPress: () => {
            this.props.navigation.navigate('Product', {
              name: getLocalizedText(this.state.lang, LangHome.addDeviceButton),
            });
          },
        },
      ]);
      return;
    }
    if (this.state.textAction == 'Record') {
      this.setState({ textAction: 'Stop' });
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
      this.setState({ textAction: 'Record' });
      this.props.actionRecordingButton('Record');
      clearInterval(this.readInterval);
      this.sendDataToSetver();
    }
  };

  sendDataToSetver = () => {
    this.state.isConnected == false
      ? RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
        res.forEach(r => {
          console.log(r.path);
        });
      })
      : RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
        res.forEach(r => {
          console.log(r.path, 'path');
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
                bluetooth_left_id: this.props.leftDevice,
                bluetooth_right_id: this.props.rightDevice,
                shoe_size: this.state.shoeSize,
                leg_type: 'D'
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
                      }),
                    })
                      .then(resp1 => {
                        console.log('============API Response============');
                        return resp1.json();
                      })
                      .then(resp1 => {
                        fetch(`${API}member/get_user_data`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: this.props.user.id_customer,
                            ...resp1
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
                      })
                      .catch(err => {
                        console.log(err);
                        this.setState({ isLoading: false });
                        Toast.show('Something went wrong. Please Try again!!!');
                      });
                  }
                });
            })
            .catch(e => { });
        });
      });
  }

  actionUpdate = content => {
    content = {
      data: content,
      id_customer: this.props.user.id_customer,
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
      .then(res => res.json())
      .then(res => {
        if (res.status === 'สำเร็จ') {
          AlertFix.alertBasic(
            getLocalizedText(this.state.lang, Lang.successTitle),
            getLocalizedText(this.state.lang, Lang.successBody),
          );
          deleteFile(this.fileStamp_n);
        } else {
          AlertFix.alertBasic(
            getLocalizedText(this.state.lang, Lang.errorTitle),
            getLocalizedText(this.state.lang, Lang.errorBody1),
          );
        }
      })
      .catch(error => {
        AlertFix.alertBasic(
          getLocalizedText(this.state.lang, Lang.errorTitle),
          getLocalizedText(this.state.lang, Lang.errorBody2),
        );
      });
  };

  actionDashboard = () => {
    this.props.navigation.navigate('Dashboard');
  };

  canVibration = (vibrate, master) => {
    if (vibrate && master) {
      Vibration.vibrate(500);
    } else {
      Vibration.cancel();
    }
  };

  render() {
    this.canVibration(this.state.shouldVibrate, this.state.switch);
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
        <HeaderFix
          icon_left={'left'}
          onpress_left={() => {
            this.props.navigation.goBack();
          }}
          title={this.props.navigation.getParam('name', '')}
        />

        {/*<NotificationsState />*/}
        <View
          style={{
            padding: 15
          }}>
          <View style={{ flex: 4, height: '100%', marginHorizontal: 10 }}>

            <View style={{ alignItems: 'center' }}>
              {this.state.focus ? (
                <RadarChartFix
                  xPos={this.state.xPosN}
                  yPos={this.state.yPosN}
                />
              ) : (
                <View />
              )}
            </View>
          </View>

          {/* Dynamic content - Left and Right foot buttons */}
          <View style={{ flex: 1, height: '100%' }}>
            <Grid style={{ padding: 15 }}>
              <Col>
                <BalanceButton
                  bntName={'Left'}
                  onPress={() => {
                    if (this.dataRecord) {
                      this.dataRecord.remove();
                    }
                    this.setState({ focus: false });
                    this.props.navigation.navigate('LeftFootsEight');
                  }}
                />
              </Col>
              <Col>
                <BalanceButton
                  bntName={'Right'}
                  onPress={() => {
                    if (this.dataRecord) {
                      this.dataRecord.remove();
                    }
                    this.setState({ focus: false });
                    this.props.navigation.navigate('RigthFootsEight');
                  }}
                />
              </Col>
            </Grid>
          </View>

          <ScoreFix
            title={'Balancing Grade'}
            status={this.state.status}
            score={this.state.score}
          />

          {/* <CardStatusFix
            title={'Balancing Grade'}
            status={this.state.status}
            txt={this.state.txt}
          /> */}

          {/* Dynamic content - Record button */}
          <View
            style={{
              flex: 1,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <ButtonFix
              action={true}
              rounded={true}
              title={getLocalizedText(this.props.lang, Lang.record)}
              onPress={() => this.actionRecording()}
            />
          </View>
        </View>
      </ScrollView>
    );
  }
}

class BalanceButton extends React.PureComponent {
  render() {
    return (
      <TouchableOpacity
        style={{ padding: 10, flex: 1 }}
        onPress={this.props.onPress}>
        <View
          style={{
            padding: 10,
            backgroundColor: '#d2afa8',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            borderRadius: 50,
          }}>
          <Text>{this.props.bntName}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.user,
    rightDevice: state.rightDevice,
    leftDevice: state.leftDevice,
    lang: state.lang,
    record: state.record,
    noti: state.noti,
    productNumber: state.productNumber,
  };
};

const mapDisPatchToProps = dispatch => {
  return {
    addLeftDevice: device => {
      return dispatch({ type: 'ADD_LEFT_DEVICE', payload: device });
    },
    addRightDevice: device => {
      return dispatch({ type: 'ADD_RIGHT_DEVICE', payload: device });
    },
    addDashBoardData: data => {
      return dispatch({ type: 'ADD_BLUETOOTH_DATA', payload: data });
    },
    actionRecordingButton: data => {
      return dispatch({ type: 'ACTION_BUTTON_RECORD', payload: data });
    },
    actionNotificationButton: data => {
      return dispatch({ type: 'ACTION_BUTTON_NOTIFICATION', payload: data });
    },
    productID: data => {
      return dispatch({ type: 'PRODUCT_ID', payload: data });
    },
  };
};

export default connect(mapStateToProps, mapDisPatchToProps)(index);
