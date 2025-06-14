//5.11.2562

import React, { Component } from 'react';
import {
  View,
  Platform,
  Dimensions,
  ToastAndroid,
  Text as RNText,
} from 'react-native';
import Items from './item';
import { Body, Card, CardItem, Icon, Right, Left, Thumbnail } from 'native-base';
import Lang from '../../../assets/language/screen/lang_home';
import UI from '../../../config/styles/CommonStyles';
import Text from '../../common/TextFix';
import { connect } from 'react-redux';
const { height: D_HEIGHT, width: D_WIDTH } = Dimensions.get('window');
import { withNavigation } from 'react-navigation';


class listItem extends Component {
  componentDidMount() {
    console.log(this.props.eightSensor);
  }

  actionDashboard = () => {
    // if (this.state.switch) {
    //   Vibration.vibrate(1500);
    // }
    // Vibration.vibrate(DURATION);
  };

  // render() {
  //   return (
  //     <View
  //       style={{
  //         backgroundColor: '#fff',
  //         justifyContent: 'center',
  //         alignItems: 'center',
  //         padding: 10,
  //       }}>
  //       <View
  //         style={{
  //           width: '96%',
  //           alignSelf: 'center',
  //           flexDirection: 'row',
  //           justifyContent: 'center',
  //           alignItems: 'center',
  //           marginHorizontal: 5,
  //         }}>
  //         <Items
  //           text={
  //             this.props.lang
  //               ? Lang.addDeviceButton.thai
  //               : Lang.addDeviceButton.eng
  //           }
  //           source={require('../../../assets/image/menu/add.png')}
  //           onPress={() => {
  //             this.props.navigation.navigate('Product', {
  //               name: this.props.lang
  //                 ? Lang.addDeviceButton.thai
  //                 : Lang.addDeviceButton.eng,
  //             });
  //           }}
  //         />
  //         <Items
  //           text={this.props.lang ? Lang.dashboard.thai : Lang.dashboard.eng}
  //           source={require('../../../assets/image/dashboard.png')}
  //           onPress={() => {
  //             this.props.navigation.navigate('Dashboard');
  //           }}
  //         />
  //         <Items
  //           text={
  //             this.props.lang
  //               ? Lang.pressureMapButton.thai
  //               : Lang.pressureMapButton.eng
  //           }
  //           source={require('../../../assets/image/menu/pressure.png')}
  //           onPress={() => {
  //             this.props.navigation.navigate(
  //               this.props.eightSensor ? 'PressureMapEight' : 'PressureMap',
  //               {
  //                 name: this.props.lang
  //                   ? Lang.pressureMapButton.thai
  //                   : Lang.pressureMapButton.eng,
  //               },
  //             );
  //           }}
  //         />
  //       </View>
  //       <View
  //         style={{
  //           width: '96%',
  //           alignSelf: 'center',
  //           flexDirection: 'row',
  //           justifyContent: 'center',
  //           alignItems: 'center',
  //           marginHorizontal: 5,
  //         }}>
  //         <Items
  //           text={
  //             this.props.lang
  //               ? Lang.gaitAnalysisButton.thai
  //               : Lang.gaitAnalysisButton.eng
  //           }
  //           source={require('../../../assets/image/menu/gail.png')}
  //           onPress={() => {
  //             this.props.navigation.navigate(
  //               this.props.eightSensor ? 'GailAnalysisEight' : 'GailAnalysis',
  //               {
  //                 name: this.props.lang
  //                   ? Lang.gaitAnalysisButton.thai
  //                   : Lang.gaitAnalysisButton.eng,
  //               },
  //             );
  //           }}
  //         />
  //
  //         <Items
  //           text={
  //             this.props.lang
  //               ? Lang.trainningModeButton.thai
  //               : Lang.trainningModeButton.eng
  //           }
  //           source={require('../../../assets/image/menu/training.png')}
  //           onPress={() => {
  //             this.props.navigation.navigate(
  //               this.props.eightSensor ? 'TrainingEight' : 'Training',
  //               {
  //                 name: this.props.lang
  //                   ? Lang.trainningModeButton.thai
  //                   : Lang.trainningModeButton.eng,
  //               },
  //             );
  //           }}
  //         />
  //
  //         <Items
  //           text={
  //             this.props.lang
  //               ? Lang.footsBalanceButton.thai
  //               : Lang.footsBalanceButton.eng
  //           }
  //           source={require('../../../assets/image/menu/balance.png')}
  //           onPress={() => {
  //             console.log(" this.props.eightSensor", this.props.eightSensor)
  //             if (this.props.eightSensor) {
  //               this.props.navigation.navigate(
  //                 'FootsBalanceEight',
  //                 {
  //                   name: this.props.lang
  //                     ? Lang.footsBalanceButton.thai
  //                     : Lang.footsBalanceButton.eng,
  //                 },
  //               );
  //             } else {
  //               this.props.navigation.navigate(
  //                 'FootsBalance',
  //                 {
  //                   name: this.props.lang
  //                     ? Lang.footsBalanceButton.thai
  //                     : Lang.footsBalanceButton.eng,
  //                 },
  //               );
  //             }
  //
  //             // this.props.navigation.navigate(
  //             //   this.props.eightSensor ? 'FootsBalanceEight' : 'FootsBalance',
  //             //   {
  //             //     name: this.props.lang
  //             //       ? Lang.footsBalanceButton.thai
  //             //       : Lang.footsBalanceButton.eng,
  //             //   },
  //             // );
  //           }}
  //         />
  //       </View>
  //       <View
  //         style={{
  //           width: '96%',
  //           alignSelf: 'center',
  //           flexDirection: 'row',
  //           justifyContent: 'center',
  //           alignItems: 'center',
  //           marginHorizontal: 5,
  //         }}>
  //         <Items
  //           text={'Foot Photo'}
  //           source={require('../../../assets/image/camimg.png')}
  //           resizeMode="contain"
  //           onPress={() => {
  //             this.props.navigation.navigate('Footscreen');
  //           }}
  //         />
  //
  //         <Items
  //           text={'Monofilament'}
  //           source={require('../../../assets/image/Monofilament.png')}
  //           onPress={() => {
  //             this.props.navigation.navigate('Try', {
  //               name: this.props.lang
  //                 ? Lang.dailyDataButton.thai
  //                 : Lang.dailyDataButton.eng,
  //             });
  //           }}
  //         />
  //
  //         <Items
  //           text={'Foot Pain Location'}
  //           source={require('../../../assets/image/FootPainLocation.png')}
  //           onPress={() => {
  //             this.props.navigation.navigate('MonofilamentNew', {
  //               name: this.props.lang
  //                 ? Lang.dailyDataButton.thai
  //                 : Lang.dailyDataButton.eng,
  //             });
  //           }}
  //         />
  //       </View>
  //     </View>
  //   );
  // }

    render() {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 10,
                }}>

                {/* Row 1 */}
                <View
                    style={{
                        width: '96%',
                        alignSelf: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 5,
                    }}>
                    <Items
                        text={this.props.lang ? Lang.addDeviceButton.thai : Lang.addDeviceButton.eng}
                        source={require('../../../assets/image/menu/add.png')}
                        onPress={() => {
                            this.props.navigation.navigate('Product', {
                                name: this.props.lang ? Lang.addDeviceButton.thai : Lang.addDeviceButton.eng,
                            });
                        }}
                    />
                    <Items
                        text={this.props.lang ? Lang.dashboard.thai : Lang.dashboard.eng}
                        source={require('../../../assets/image/dashboard.png')}
                        onPress={() => {
                            this.props.navigation.navigate('Dashboard');
                        }}
                    />
                    <Items
                        text={this.props.lang ? Lang.pressureMapButton.thai : Lang.pressureMapButton.eng}
                        source={require('../../../assets/image/menu/pressure.png')}
                        onPress={() => {
                            this.props.navigation.navigate(
                                this.props.eightSensor ? 'PressureMapEight' : 'PressureMap',
                                {
                                    name: this.props.lang ? Lang.pressureMapButton.thai : Lang.pressureMapButton.eng,
                                },
                            );
                        }}
                    />
                </View>

                {/* Row 2 */}
                <View
                    style={{
                        width: '96%',
                        alignSelf: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 5,
                    }}>
                    <Items
                        text={'Assessment Tests'}
                        source={require('../../../assets/image/menu/assessment_icon.png')}
                        onPress={() => {
                            this.props.navigation.navigate('FallRiskScreen');
                        }}
                    />
                    <Items
                        text={this.props.lang ? Lang.gaitAnalysisButton.thai : Lang.gaitAnalysisButton.eng}
                        source={require('../../../assets/image/menu/gail.png')}
                        onPress={() => {
                            this.props.navigation.navigate(
                                this.props.eightSensor ? 'GailAnalysisEight' : 'GailAnalysis',
                                {
                                    name: this.props.lang ? Lang.gaitAnalysisButton.thai : Lang.gaitAnalysisButton.eng,
                                },
                            );
                        }}
                    />
                    <Items
                        text={'Exercise Training'}
                        source={require('../../../assets/image/menu/training.png')}
                        onPress={() => {
                            this.props.navigation.navigate('ExerciseTraining');
                        }}
                    />

                </View>

                {/* Row 3 */}
                <View
                    style={{
                        width: '96%',
                        alignSelf: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 5,
                    }}>
                    <Items
                        text={this.props.lang ? Lang.footsBalanceButton.thai : Lang.footsBalanceButton.eng}
                        source={require('../../../assets/image/menu/balance.png')}
                        onPress={() => {
                            if (this.props.eightSensor) {
                                this.props.navigation.navigate('FootsBalanceEight', {
                                    name: this.props.lang ? Lang.footsBalanceButton.thai : Lang.footsBalanceButton.eng,
                                });
                            } else {
                                this.props.navigation.navigate('FootsBalance', {
                                    name: this.props.lang ? Lang.footsBalanceButton.thai : Lang.footsBalanceButton.eng,
                                });
                            }
                        }}
                    />
                    <Items
                        text={'Shoe Recommend'}
                        source={require('../../../assets/image/menu/shoe_icon.png')}
                        onPress={() => {
                            this.props.navigation.navigate('ShoeRecommend');
                        }}
                    />
                    <View
                        style={{
                            borderWidth: 0,
                            height: 150,
                            width: '30%',
                            marginHorizontal: 5,
                            borderRadius: 6,
                            marginVertical: 5,
                            backgroundColor: 'transparent', // invisible
                        }}
                    />

                </View>
            </View>
        );
    }

}

const mapStateToProps = state => {
  return {
    lang: state.lang,
    eightSensor: state.eightSensor,
  };
};

// export default connect(mapStateToProps)(listItem);
export default withNavigation(connect(mapStateToProps)(listItem));
