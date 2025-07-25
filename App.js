import React from 'react';
import { View, Image, Dimensions, StyleSheet } from 'react-native';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { ModalPortal } from 'react-native-modals';
import { Root } from 'native-base';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import configureStore from './src/Store';

// Auth Screens
import TermsScreen from './src/components/auth/terms';
import SignInScreen from './src/components/auth/Signln';
import RegisterScreen from './src/components/auth/Register';
import ForgetPasswordScreen from './src/components/auth/ForgetPass';
import AuthLoadingScreen from './src/components/auth/AuthLoading';
import LoadingScreen from './src/components/auth/Loading';

// Menu Screens
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
import FallRiskScreen from './src/components/menu/assessment/FallRiskScreen';
import StandEyes from './src/components/menu/assessment/StandEyes';

import TenMeterWalkTest from './src/components/menu/assessment/TenMeterWalkTest';
import Chatbot from './src/components/menu/chat/Chatbot';
import ShoeRecommendScreen from './src/components/menu/shoe/ShoeRecommendScreen';
import CartScreen from './src/components/menu/shoe/CartScreen';

// Eight-Sensor Screens
import PressureMapEightSensorScreen from './src/components/eight/pressuremap';
import GailAnalysisEightSensorScreen from './src/components/eight/gail';
import TrainingEightSensorScreen from './src/components/eight/training';
import FootsBalanceEightSensorScreen from './src/components/eight/balance/index';
import LeftFootsEightSensorScreen from './src/components/eight/balance/left';
import RightFootsEightSensorScreen from './src/components/eight/balance/right';
import DashboardEightSensorScreen from './src/components/eight/dashboard';

// Other Screens
import Footscreen from './src/components/screnns/Foot/Footscreen';
import Tryf from './src/components/screnns/Try/Tryf';
import Legs from './src/components/screnns/Try/Legs';
import MonofilamentNew from './src/components/screnns/Try/MonofilamentNew';
import PatientList from './src/components/screnns/Try/PatientList';

// Add these imports at the top with other menu screens
import Gesture from './src/components/menu/gesture';
import GestureAnalysisWrapper from './src/components/menu/gesture_analysis/GestureAnalysisWrapper';
import VideoAnalysisScreen from './src/components/menu/gesture_analysis/VideoAnalysisScreen';
import TrainingSettings from './src/components/menu/training/settings';

// Import WalkTrainingSettings for navigation
import WalkTrainingSettings from './src/components/menu/training/settings';


// FAB Component
import DraggableFAB from './src/components/common/DraggableFAB';

console.disableYellowBox = true;

const { store, persister } = configureStore();

// 1. HOC to inject FAB on every screen except Chatbot
const withFAB = (ScreenComponent) => {
    return class extends React.Component {
        render() {
            return (
                <View style={styles.screenContainer}>
                    <ScreenComponent
                        {...this.props}
                        navigation={this.props.navigation}
                        route={this.props.route}
                    />
                    <DraggableFAB navigation={this.props.navigation} />
                </View>
            );
        }
    };
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
    },
});

// 2. Auth Stack (no FAB needed)
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

// 3. App Stack (FAB added to all except Chatbot)
const AppStack = createStackNavigator(
    {
        Home: withFAB(HomeScreen),
        Footscreen: withFAB(Footscreen),
        Device: withFAB(DeviceScreen),
        Product: withFAB(ProductScreen),
        DailyData: withFAB(DailyDataScreen),
        PressureMap: withFAB(PressureMapScreen),
        GailAnalysis: withFAB(GailAnalysisScreen),
        Training: withFAB(TrainingScreen),


        StandOpenEyes: withFAB((props) => <StandEyes {...props} type="open" />),
        StandEyesClosed: withFAB((props) => <StandEyes {...props} type="closed" />),
        TenMeterWalkTest: withFAB(TenMeterWalkTest),
        Dashboard: withFAB(DashboardScreen),
        ShoeRecommend: withFAB(ShoeRecommendScreen),
        CartScreen: withFAB(CartScreen),
        Profile: withFAB(ProfileScreen),
        FootsBalance: withFAB(FootsBalanceScreen),
        Try: withFAB(Tryf),
        MonofilamentNew: withFAB(MonofilamentNew),
        Legs: withFAB(Legs),
        LeftFoots: withFAB(LeftFootsScreen),
        RigthFoots: withFAB(RightFootsScreen),
        PressureMapEight: withFAB(PressureMapEightSensorScreen),
        GailAnalysisEight: withFAB(GailAnalysisEightSensorScreen),
        TrainingEight: withFAB(TrainingEightSensorScreen),
        FootsBalanceEight: withFAB(FootsBalanceEightSensorScreen),
        LeftFootsEight: withFAB(LeftFootsEightSensorScreen),
        RigthFootsEight: withFAB(RightFootsEightSensorScreen),
        DashboardEight: withFAB(DashboardEightSensorScreen),
        Gesture: withFAB(Gesture),
        GestureAnalysis: withFAB((props) => {
            const { useSelector } = require('react-redux');
            const token = useSelector(state => state?.token);
            const user = useSelector(state => state?.user);
            const id_member = user?.member_info?.id_member || user?.id_member || user?.id_data_role || user?.id_customer;
            return <GestureAnalysisWrapper {...props} token={token} id_member={id_member} />;
        }),
        VideoAnalysis: withFAB(VideoAnalysisScreen),
        Chatbot: Chatbot, // <-- No FAB here
        PatientList: PatientList,   // no withFAB
        TrainingSettings: withFAB(TrainingSettings),
        WalkTrainingSettings: withFAB(WalkTrainingSettings),
    },
    {
        defaultNavigationOptions: {
            headerShown: false,
        },
        initialRouteName: 'Home',
    },
);

// 4. Preload Screen (optional)
class PreloadScreen extends React.PureComponent {
    componentDidMount() {
        // Firebase.initializeApp(); ← uncomment if Firebase used
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

// 5. Main Navigation Container
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

// 6. Root Component with Redux & Modal
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