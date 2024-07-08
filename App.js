import React from 'react';
import {View, Image, Dimensions} from 'react-native';
import {createAppContainer, createSwitchNavigator} from 'react-navigation';

import {createStackNavigator} from 'react-navigation-stack';
import {ModalPortal} from 'react-native-modals';
import TermsScreen from './src/components/auth/terms';
import SignInScreen from './src/components/auth/Signln';
import RegisterScreen from './src/components/auth/Register';
import ForgetPasswordScreen from './src/components/auth/ForgetPass';
import AuthLoadingScreen from './src/components/auth/AuthLoading';
import LoadingScreen from './src/components/auth/Loading';


import HomeScreen from './src/components/screnns/home';

import DeviceScreen from './src/components/menu/device';
import ProductScreen from './src/components/menu/product';
import DailyDataScreen from './src/components/menu/dailydata';
import PressureMapScreen from './src/components/menu/pressuremap';
import GailAnalysisScreen from './src/components/menu/gail';
import TrainingScreen from './src/components/menu/training';
import DashboardScreen from './src/components/menu/dashboard';
import ProfileScreen from './src/components/menu/profile';
import FootsBalanceScreen from './src/components/menu/balance';
import LeftFootsScreen from './src/components/menu/balance/left';
import RightFootsScreen from './src/components/menu/balance/right';

import PressureMapEightSensorScreen from './src/components/eight/pressuremap';
import GailAnalysisEightSensorScreen from './src/components/eight/gail';
import TrainingEightSensorScreen from './src/components/eight/training';
import FootsBalanceEightSensorScreen from './src/components/eight/balance/index';
import LeftFootsEightSensorScreen from './src/components/eight/balance/left';
import RightFootsEightSensorScreen from './src/components/eight/balance/right';
import DashboardEightSensorScreen from './src/components/eight/dashboard';

import {Root} from 'native-base';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/lib/integration/react';
import configureStore from './src/Store';
import Footscreen from './src/components/screnns/Foot/Footscreen';
import Tryf from './src/components/screnns/Try/Tryf';
import Legs from './src/components/screnns/Try/Legs';
import MonofilamentNew from './src/components/screnns/Try/MonofilamentNew';

console.disableYellowBox = true;

const {store, persister} = configureStore();

const AuthStack = createStackNavigator(
  {
    SignIn: SignInScreen,
    Terms: TermsScreen,
    Register: RegisterScreen,
    ForgetPass: ForgetPasswordScreen,
  },
  {
    defaultNavigationOptions: {
      headerShown: false,
    },
    initialRouteName: 'SignIn',
  },
);

const AppStack = createStackNavigator(
  {
    Home: HomeScreen,
    Footscreen: Footscreen,

    Device: DeviceScreen,
    Product: ProductScreen,
    DailyData: DailyDataScreen,
    PressureMap: PressureMapScreen,
    GailAnalysis: GailAnalysisScreen,
    Training: TrainingScreen,
    Dashboard: DashboardScreen,

    Profile: ProfileScreen,
    FootsBalance: FootsBalanceScreen,
    Try: Tryf,
    MonofilamentNew: MonofilamentNew,
    Legs: Legs,
    LeftFoots: LeftFootsScreen,
    RigthFoots: RightFootsScreen,

    PressureMapEight: PressureMapEightSensorScreen,
    GailAnalysisEight: GailAnalysisEightSensorScreen,
    TrainingEight: TrainingEightSensorScreen,
    FootsBalanceEight: FootsBalanceEightSensorScreen,
    LeftFootsEight: LeftFootsEightSensorScreen,
    RigthFootsEight: RightFootsEightSensorScreen,
    DashboardEight: DashboardEightSensorScreen,
  },
  {
    defaultNavigationOptions: {
      headerShown: false,
    },
    initialRouteName: 'Home',
  },
);

class PreloadScreen extends React.PureComponent {

componentDidMount(){
  Firebase.initializeApp();
}


  render() {
    return (
      <View>
        <Image
          style={{
            width: Dimensions.get('screen').width,
            height: Dimensions.get('screen').height,
            resizeMode: 'contain',
          }}
          // source={require('./src/assets/image/icons/surasolelogo.png')}
        />
      </View>
    );
  }
}

const Main = createAppContainer(
  createSwitchNavigator(
    {
      AuthLoading: AuthLoadingScreen,
      App: AppStack,
      Auth: AuthStack,
      Loading: LoadingScreen,
    },
    {
      initialRouteName: 'AuthLoading',
    },
  ),
);

export default () => (
  <Provider store={store}>
    <PersistGate persistor={persister} loading={null}>
      <Root>
        <ModalPortal />
        <Main />
      </Root>
    </PersistGate>
  </Provider>
);

//export default createAppContainer(AppNavigator);
