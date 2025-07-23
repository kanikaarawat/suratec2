import React, { Component } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  BackHandler,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { writeFile } from 'react-native-fs';
import XLSX from 'xlsx';
import PagerView from 'react-native-pager-view';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { Spinner } from 'native-base';
import HeaderFix from '../../common/HeaderFix';
import ButtonFix from '../../common/ButtonFix';
import Toast from 'react-native-simple-toast';
import API from '../../../config/Api';
import LinearGradient from 'react-native-linear-gradient';
import RadarChart from '../../common/RadarChartFix';
// import FabChatbot from '../../common/FabChatbot';
import RadarChartForDashboard from '../../common/RadarChartForDashboard';
import DashboardLang from '../../../assets/language/menu/lang_dashboard';

const { height, width } = Dimensions.get('window');

function detectSensorType(healthData) {
  // Check for 8-point fields
  const has8Point =
    healthData?.peak_l6 !== undefined ||
    healthData?.peak_l7 !== undefined ||
    healthData?.peak_l8 !== undefined ||
    healthData?.peak_r6 !== undefined ||
    healthData?.peak_r7 !== undefined ||
    healthData?.peak_r8 !== undefined;

  if (has8Point) {
    return '8-point';
  }

  // Check for 5-point fields (optional, for clarity)
  const has5Point =
    healthData?.peak_l1 !== undefined &&
    healthData?.peak_l2 !== undefined &&
    healthData?.peak_l3 !== undefined &&
    healthData?.peak_l4 !== undefined &&
    healthData?.peak_l5 !== undefined &&
    healthData?.peak_r1 !== undefined &&
    healthData?.peak_r2 !== undefined &&
    healthData?.peak_r3 !== undefined &&
    healthData?.peak_r4 !== undefined &&
    healthData?.peak_r5 !== undefined;

  if (has5Point) {
    return '5-point';
  }

  // Fallback
  return 'unknown';
}

class DashboardScreen extends Component {
  constructor() {
    super();
    this.state = {
      dataResult: [
        { nameZone: 'Toe', valueWalk: '- -', valueRun: '- -' },
        { nameZone: 'Medial Metatarsal', valueWalk: '- -', valueRun: '- -' },
        { nameZone: 'Lateral Metatarsal', valueWalk: '- -', valueRun: '- -' },
        { nameZone: 'Medial Midfoot', valueWalk: '- -', valueRun: '- -' },
        { nameZone: 'Heel', valueWalk: '- -', valueRun: '- -' },
      ],
      isLoading: true,
      dataSpecified: [{ dateTime: '00:00:00', valueZone: '', valuePeak: '0' }],
      record: [],
      healthData: {},
      isConnected: null,
      spinner: false,
      dataShow: false,
      currentPage: 0,
      isStaticDashboard: true,
      hasCopData: false,
      positionValue: [],
      summaryText: 'Loading summary...',
      summaryLoading: true,
    };
  }

  componentDidMount() {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    NetInfo.addEventListener(this.handleConnectivityChange);
    this.handleFetchDashboardData();
    
    fetch(`${API}/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: this.props.user.id_customer,
      }),
    })
    .then(res => res.json())
    .then(res => {
      let dataSpecified = [];
      res.forEach(e => {
        let date = new Date(e.action.replace(' ', 'T'));
        let { max, index } = this.findPeak([...e.left, ...e.right]);
        dataSpecified.push({
          dateTime: `${date.getHours().toString().slice(-2)}:${date
            .getMinutes()
            .toString()
            .slice(-2)}:${date.getSeconds().toString().slice(-2)}`,
          valueZone: index,
          valuePeak: max,
        });
      });
      let result = this.findDataResult(res);
      let dataResult = [
        {
          nameZone: 'Toe',
          valueWalk: result.value[0],
          valueRun: result.max[0],
        },
        {
          nameZone: 'Medial Metatarsal',
          valueWalk: result.value[1],
          valueRun: result.max[1],
        },
        {
          nameZone: 'Lateral Metatarsal',
          valueWalk: result.value[2],
          valueRun: result.max[2],
        },
        {
          nameZone: 'Medial Midfoot',
          valueWalk: result.value[3],
          valueRun: result.max[3],
        },
        {
          nameZone: 'Heel',
          valueWalk: result.value[4],
          valueRun: result.max[4],
        },
      ];
      this.setState({ record: res, dataSpecified, dataResult });
    })
    .catch(err => {
      console.log(err);
    });
  }

  componentWillUnmount() {
    this.backHandler?.remove();
    this.netInfoSubscription?.();
  }

  handleBackPress = () => {
    this.props.navigation.goBack();
    return true;
  };

  handleConnectivityChange = (state) => {
    console.log(state.isConnected);
    this.setState({ isConnected: state.isConnected });
    console.log(`Internet Connection : ${this.state.isConnected}`);
  };

  findPeak = (arr) => {
    let max = Math.max(...arr);
    let index = arr.indexOf(max);
    return { max, index };
  };

  findDataResult = (data) => {
    let value = [0, 0, 0, 0, 0];
    let max = [0, 0, 0, 0, 0];
    
    data.forEach(item => {
      for (let i = 0; i < 5; i++) {
        value[i] += item.left[i] + item.right[i];
        max[i] = Math.max(max[i], item.left[i], item.right[i]);
      }
    });
    
    for (let i = 0; i < 5; i++) {
      value[i] = (value[i] / (data.length * 2)).toFixed(1);
      max[i] = max[i].toFixed(1);
    }
    
    return { value, max };
  };

  calculatePressurePercentage = (side, zone) => {
    const { healthData } = this.state;
    if (!healthData) return 0;
    // Use dynamic sensor type detection
    const sensorType = detectSensorType(healthData);
    const toPressure = (rawValue) => {
      return (0.42 * Math.exp(rawValue / 54.3)) + 5.2;
    };
    if (sensorType === '5-point') {
      if (side === 'left') {
        switch (zone) {
          case 'forefoot':
            const forefootAvg = (
              parseInt(healthData.peak_l1 || 0) + 
              parseInt(healthData.peak_l2 || 0) + 
              parseInt(healthData.peak_l3 || 0)
            ) / 3;
            return toPressure(forefootAvg);
          case 'midfoot':
            return toPressure(parseInt(healthData.peak_l4 || 0));
          case 'heel':
            return toPressure(parseInt(healthData.peak_l5 || 0));
          default:
            return 0;
        }
      } else {
        switch (zone) {
          case 'forefoot':
            const forefootAvg = (
              parseInt(healthData.peak_r1 || 0) + 
              parseInt(healthData.peak_r2 || 0) + 
              parseInt(healthData.peak_r3 || 0)
            ) / 3;
            return toPressure(forefootAvg);
          case 'midfoot':
            return toPressure(parseInt(healthData.peak_r4 || 0));
          case 'heel':
            return toPressure(parseInt(healthData.peak_r5 || 0));
          default:
            return 0;
        }
      }
    } else if (sensorType === '8-point') {
      if (side === 'left') {
        switch (zone) {
          case 'forefoot':
            const forefootAvg = (
              parseInt(healthData.peak_l1 || 0) + 
              parseInt(healthData.peak_l2 || 0) + 
              parseInt(healthData.peak_l3 || 0)
            ) / 3;
            return toPressure(forefootAvg);
          case 'midfoot':
            const midfootAvg = (
              parseInt(healthData.peak_l4 || 0) + 
              parseInt(healthData.peak_l5 || 0)
            ) / 2;
            return toPressure(midfootAvg);
          case 'heel':
            const heelAvg = (
              parseInt(healthData.peak_l6 || 0) + 
              parseInt(healthData.peak_l7 || 0) + 
              parseInt(healthData.peak_l8 || 0)
            ) / 3;
            return toPressure(heelAvg);
          default:
            return 0;
        }
      } else {
        switch (zone) {
          case 'forefoot':
            const forefootAvg = (
              parseInt(healthData.peak_r1 || 0) + 
              parseInt(healthData.peak_r2 || 0) + 
              parseInt(healthData.peak_r3 || 0)
            ) / 3;
            return toPressure(forefootAvg);
          case 'midfoot':
            const midfootAvg = (
              parseInt(healthData.peak_r4 || 0) + 
              parseInt(healthData.peak_r5 || 0)
            ) / 2;
            return toPressure(midfootAvg);
          case 'heel':
            const heelAvg = (
              parseInt(healthData.peak_r6 || 0) + 
              parseInt(healthData.peak_r7 || 0) + 
              parseInt(healthData.peak_r8 || 0)
            ) / 3;
            return toPressure(heelAvg);
          default:
            return 0;
        }
      }
    } else {
      // Unknown sensor type, fallback to 0
      return 0;
    }
  };

  renderPressureValue = (side, zone) => {
    const pressure = this.calculatePressurePercentage(side, zone);
    const percentage = ((pressure / 100) * 100).toFixed(0);
    return `${percentage}%`;
  };

  handleFetchDashboardData = async () => {
    const { id_customer } = this.props.user;
    const { user, token } = this.props;
    console.log('[DASHBOARD] Fetching user details for:', id_customer, 'Full user:', user, 'Token:', token);
    try {
      const response = await fetch(
        `${API}/member/get_user_details?id=${id_customer}`,
        { method: 'POST' },
      );
      const res = await response.json();

      console.log('res', res);

      if (res.message === 'User Details Successfully') {
        const user_details = res.user_details;
        
        // Check if COP data exists
        const hasCopData = user_details.cop_x && user_details.cop_y && 
                         (JSON.parse(user_details.cop_x).length > 0 || 
                          JSON.parse(user_details.cop_y).length > 0);
        
        // Handle both stringified array and actual array cases
        let xPos = [];
        let yPos = [];
        
        if (typeof user_details.cop_x === 'string') {
          try {
            xPos = JSON.parse(user_details.cop_x);
            yPos = JSON.parse(user_details.cop_y);
          } catch (e) {
            console.error('Error parsing cop_x/cop_y:', e);
            // Fallback to manual calculation if parsing fails
            xPos = this.calculateCOP_X(user_details);
            yPos = this.calculateCOP_Y(user_details);
          }
        } else if (Array.isArray(user_details.cop_x)) {
          xPos = user_details.cop_x;
          yPos = user_details.cop_y;
        } else {
          // If data is not in expected format, calculate manually
          xPos = this.calculateCOP_X(user_details);
          yPos = this.calculateCOP_Y(user_details);
        }

        const positionValue = xPos.map((x, index) => ({
          x_key: x,
          y_key: yPos[index],
        }));

        this.setState({
          healthData: user_details,
          positionValue,
          isLoading: false,
          dataShow: false,
          hasCopData,
          isStaticDashboard: user_details.data_type === '1',
        });
      } else {
        this.setState({ dataShow: true, isLoading: false, hasCopData: false });
      }
    } catch (error) {
      console.error(error);
      this.setState({ isLoading: false, dataShow: true, hasCopData: false });
    }
    
    // Fetch dashboard summary
    this.fetchDashboardSummary();
  };

  fetchDashboardSummary = async () => {
    try {
      const { user, token, lang } = this.props;
      const user_id = user.id_customer;
      const lang_mode = lang === 1 ? 1 : 0; // 1 = Thai, 0 = English
      const security_token = token;
      console.log('[DASHBOARD] Fetching summary for user:', user_id, 'Token:', security_token);
      const response = await fetch('https://www.surasole.com/api/dashboard/dashboard-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          security_token,
          user_id,
          lang_mode
        }),
      });
      const data = await response.json();
      console.log('Dashboard summary response:', data);
      if (data && data.summary) {
        this.setState({ summaryText: data.summary, summaryLoading: false });
      } else {
        this.setState({ summaryText: 'No summary available at this time.', summaryLoading: false });
      }
    } catch (error) {
      this.setState({ summaryText: `Unable to load summary: ${error.message}`, summaryLoading: false });
    }
  };

  calculateCOP_X = (data) => {
    // Simplified calculation for demonstration
    // In a real app, you would use proper biomechanical formulas
    const xPositions = [];
    for (let i = 0; i < 10; i++) {
      xPositions.push(Math.random() * 200 - 100); // Random values between -100 and 100
    }
    return xPositions;
  };

  calculateCOP_Y = (data) => {
    // Simplified calculation for demonstration
    const yPositions = [];
    for (let i = 0; i < 10; i++) {
      yPositions.push(Math.random() * 200 - 100); // Random values between -100 and 100
    }
    return yPositions;
  };

  renderMetricsRow = () => {
    if (!this.state.hasCopData) return null;

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginHorizontal: 20 }}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginBottom: 5 }}>
            {this.props.lang ? DashboardLang.cadenceText.thai : DashboardLang.cadenceText.eng}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#007bff', marginBottom: 0 }}>
            {this.state.healthData.cadence || '0'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6c757d', marginTop: -5 }}>
            {this.props.lang ? 'ก้าว/นาที' : 'steps/min'}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginBottom: 5 }}>
            {this.props.lang ? DashboardLang.stepCountText.thai : DashboardLang.stepCountText.eng}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#007bff', marginBottom: 0 }}>
            {this.state.healthData.step_count || '0'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6c757d', marginTop: -5 }}>
            {this.props.lang ? 'ก้าว' : 'steps'}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginBottom: 5 }}>
            {this.props.lang ? DashboardLang.gaitSpeedText.thai : DashboardLang.gaitSpeedText.eng}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#007bff', marginBottom: 0 }}>
            {this.state.healthData.gait_speed || '0'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6c757d', marginTop: -5 }}>
            {this.props.lang ? 'ม./วินาที' : 'm/s'}
          </Text>
        </View>
      </View>
    );
  };

  renderBalanceMetricsCard = () => {
    if (this.state.hasCopData) return null;
  
    return (
      <LinearGradient
        colors={['#005b50', '#0cfdd1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          marginHorizontal: 12,
          marginTop: 18,
          padding: 2
        }}
      >
        <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }}>
                  Path Sway
                </Text>
                <Text style={{ fontSize: 24, color: '#007bff', textAlign: 'center' }}>
                  {this.state.healthData.path_sway || '0'} cm
                </Text>
              </View>
  
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }}>
                  ML Sway
                </Text>
                <Text style={{ fontSize: 24, color: '#007bff', textAlign: 'center' }}>
                  {this.state.healthData.ml_sway || '0'} cm
                </Text>
              </View>
  
              <View style={{ marginBottom: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }}>
                  AP Sway
                </Text>
                <Text style={{ fontSize: 24, color: '#007bff', textAlign: 'center' }}>
                  {this.state.healthData.ap_sway || '0'} cm
                </Text>
              </View>
            </View>
  
            <View style={{ height: 1, backgroundColor: '#ccc', marginHorizontal: 10 }} />
  
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }}>
                  Ellipse Area
                </Text>
                <Text style={{ fontSize: 24, color: '#007bff', textAlign: 'center' }}>
                  {this.state.healthData.ellipse_area || '0'} cm²
                </Text>
              </View>
  
              <View style={{ marginBottom: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }}>
                  Velocity
                </Text>
                <Text style={{ fontSize: 24, color: '#007bff', textAlign: 'center' }}>
                  {this.state.healthData.velocity || '0'} cm/sec
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  renderCopChart = () => {
    if (!this.state.hasCopData) {
      return (
        <Image 
          source={require('../../../assets/image/dashboard/cop_chart.jpg')} 
          style={{ 
            width: '100%', 
            height: 120, 
            resizeMode: 'contain',
            marginBottom: 8
          }} 
        />
      );
    }
  
    // Normalize COP data to fit within the chart dimensions
    const normalizedPoints = this.state.positionValue.map(point => {
      const x = 50 + (point.x_key / 2000) * 40;
      const y = 50 - (point.y_key / 2000) * 40;
      return { x, y };
    });

    return (
      <View style={{ width: '100%', height: 120, position: 'relative' }}>
        <Image 
          source={require('../../../assets/image/dashboard/cop_chart.jpg')} 
          style={{ 
            width: '100%', 
            height: '100%', 
            resizeMode: 'contain',
            position: 'absolute'
          }} 
        />

        <View style={{ position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          {normalizedPoints.length > 1 && (
            <View style={{ position: 'absolute', width: '80%', height: '80%', top: '10%', left: '10%' }}>
              {normalizedPoints.slice(1).map((point, index) => {
                const prevPoint = normalizedPoints[index];
                const dx = point.x - prevPoint.x;
                const dy = point.y - prevPoint.y;
                const angle = Math.atan2(dy, dx);
                const distance = Math.sqrt(dx * dx + dy * dy);

                return (
                  <View
                    key={`line-${index}`}
                    style={{
                      position: 'absolute',
                      left: `${prevPoint.x}%`,
                      top: `${prevPoint.y}%`,
                      width: `${distance}%`,
                      height: 2,
                      backgroundColor: '#00b2b2',
                      transform: [
                        { rotate: `${angle}rad` }
                      ],
                      transformOrigin: 'left center'
                    }}
                  />
                );
              })}
            </View>
          )}

          {normalizedPoints.map((point, index) => (
            <View 
              key={`point-${index}`}
              style={{
                position: 'absolute',
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: index === normalizedPoints.length - 1 ? '#ff0000' : '#00b2b2',
                zIndex: 2
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  renderStaticDashboard = () => {
    const currentDate = moment().format('DD/MM/YYYY');
    const currentTime = moment().format('h:mm A');
    const { healthData, positionValue } = this.state;
    // Calculate left/right foot values as before
    const getHighestZone = (side) => {
      const zones = ['forefoot', 'midfoot', 'heel'];
      let maxZone = '';
      let maxValue = 0;
      zones.forEach(zone => {
        const value = parseFloat(this.calculatePressurePercentage(side, zone));
        if (value > maxValue) {
          maxValue = value;
          maxZone = zone;
        }
      });
      return { zone: maxZone, value: maxValue };
    };
    const leftHighest = getHighestZone('left');
    const rightHighest = getHighestZone('right');
    const leftTotal = ['forefoot', 'midfoot', 'heel'].reduce((sum, zone) => sum + parseFloat(this.calculatePressurePercentage('left', zone)), 0);
    const rightTotal = ['forefoot', 'midfoot', 'heel'].reduce((sum, zone) => sum + parseFloat(this.calculatePressurePercentage('right', zone)), 0);
    const totalPressure = leftTotal + rightTotal;
    const leftPercentage = totalPressure > 0 ? Math.round((leftTotal / totalPressure) * 100) : 50;
    const rightPercentage = totalPressure > 0 ? Math.round((rightTotal / totalPressure) * 100) : 50;
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Date and Time */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginHorizontal: 20, marginTop: 10, marginBottom: 5 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff' }}>{currentDate} {currentTime}</Text>
        </View>
        {/* Left and Right Foot Cards */}
        <View style={{ flexDirection: 'row', marginTop: 10, marginHorizontal: 15 }}>
          {/* Left Foot Card */}
          <LinearGradient colors={['#005b50', '#0cfdd1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 24, marginRight: 10, padding: 5 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 10, textAlign: 'center' }}>
                {this.props.lang ? DashboardLang.leftFootText.thai : DashboardLang.leftFootText.eng}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'center' }}>
                <Image source={require('../../../assets/image/dashboard/left_foot.png')} style={{ width: 80, height: 60, marginRight: 10 }} />
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }}>
                    {this.props.lang ? DashboardLang[`${leftHighest.zone}Text`]?.thai || leftHighest.zone : DashboardLang[`${leftHighest.zone}Text`]?.eng || leftHighest.zone}
                  </Text>
                  <Text style={{ fontSize: 16, color: '#007bff', textAlign: 'center' }}>{leftHighest.value.toFixed(1)}%</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {['forefoot', 'midfoot', 'heel']
                  .filter(zone => zone !== leftHighest.zone)
                  .map((zone, index, arr) => (
                    <React.Fragment key={zone}>
                      {index > 0 && (
                        <View style={{ height: 80, width: 1, backgroundColor: '#ccc', marginHorizontal: 10 }} />
                      )}
                      <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#007bff' }}>
                            {this.props.lang ? DashboardLang[`${zone}Text`]?.thai || zone : DashboardLang[`${zone}Text`]?.eng || zone}
                          </Text>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff' }}>{this.renderPressureValue('left', zone)}</Text>
                        </View>
                      </View>
                    </React.Fragment>
                  ))}
              </View>
            </View>
          </LinearGradient>
          {/* Right Foot Card */}
          <LinearGradient colors={['#005b50', '#0cfdd1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 24, marginLeft: 10, padding: 5 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 10, textAlign: 'center' }}>
                {this.props.lang ? DashboardLang.rightFootText.thai : DashboardLang.rightFootText.eng}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'center' }}>
                <Image source={require('../../../assets/image/dashboard/right_foot.png')} style={{ width: 80, height: 60, marginRight: 10 }} />
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }}>
                    {this.props.lang ? DashboardLang[`${rightHighest.zone}Text`]?.thai || rightHighest.zone : DashboardLang[`${rightHighest.zone}Text`]?.eng || rightHighest.zone}
                  </Text>
                  <Text style={{ fontSize: 16, color: '#007bff', textAlign: 'center' }}>{rightHighest.value.toFixed(1)}%</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {['forefoot', 'midfoot', 'heel']
                  .filter(zone => zone !== rightHighest.zone)
                  .map((zone, index, arr) => (
                    <React.Fragment key={zone}>
                      {index > 0 && (
                        <View style={{ height: 80, width: 1, backgroundColor: '#ccc', marginHorizontal: 10 }} />
                      )}
                      <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#007bff' }}>
                            {this.props.lang ? DashboardLang[`${zone}Text`]?.thai || zone : DashboardLang[`${zone}Text`]?.eng || zone}
                          </Text>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff' }}>{this.renderPressureValue('right', zone)}</Text>
                        </View>
                      </View>
                    </React.Fragment>
                  ))}
              </View>
            </View>
          </LinearGradient>
        </View>
        {/* Pressure Percentage and Foot Balance Row */}
        <View style={{ flexDirection: 'row', marginTop: 10, marginHorizontal: 15 }}>
          {/* Pressure Percentage Card */}
          <LinearGradient colors={['#005b50', '#0cfdd1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 24, marginRight: 10, padding: 5, height: 220 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 16, height: '100%' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 10, textAlign: 'center' }}>
                {this.props.lang ? DashboardLang.pressurePercentageText.thai : DashboardLang.pressurePercentageText.eng}
              </Text>
              <View style={{ flexDirection: 'row', height: 55, borderRadius: 12, marginBottom: 10, backgroundColor: '#e0e0e0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
                <View style={{ flex: 50 / 100, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 24 }}>{leftPercentage}%</Text>
                </View>
                <View style={{ flex: 50 / 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 24 }}>{rightPercentage}%</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0, marginTop: 10 }}>
                <View style={{ alignSelf: 'flex-start', marginLeft: 0, paddingRight: 5 }}>
                  <Text style={{ color: '#007bff', fontSize: 20 }}>
                    {this.props.lang ? DashboardLang.leftText.thai : DashboardLang.leftText.eng}
                  </Text>
                </View>
                <Text style={{ color: '#007bff', fontSize: 20, alignSelf: 'flex-end', marginRight: 0 }}>
                  {this.props.lang ? DashboardLang.rightText.thai : DashboardLang.rightText.eng}
                </Text>
              </View>
            </View>
          </LinearGradient>
          {/* Foot Balance Card with Radar Chart */}
          <LinearGradient colors={['#005C51', '#0CFFD3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 24, marginLeft: 10, padding: 5, height: 220 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 16, height: '100%' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 10, textAlign: 'center' }}>
                {this.props.lang ? DashboardLang.footBalanceText.thai : DashboardLang.footBalanceText.eng}
              </Text>
              <View style={{ alignItems: 'center', marginTop: 10, flex: 1, justifyContent: 'center' }}>
                <RadarChartForDashboard positionValue={positionValue} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 16, color: '#007bff' }}>
                  {this.props.lang ? DashboardLang.leftText.thai : DashboardLang.leftText.eng}
                </Text>
                <Text style={{ fontSize: 16, color: '#007bff' }}>
                  {this.props.lang ? DashboardLang.rightText.thai : DashboardLang.rightText.eng}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        {/* Metrics Card: Path Sway, ML Sway, AP Sway, Velocity, Ellipse */}
        <View style={{ marginHorizontal: 15, marginTop: 10, marginBottom: 20, borderRadius: 16, borderWidth: 2, borderColor: '#007bff', backgroundColor: 'white', padding: 10, flexDirection: 'row', alignItems: 'center' }}>
          {/* Left Column */}
          <View style={{ flex: 1.2, paddingRight: 10 }}>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff' }}>
                {this.props.lang ? DashboardLang.pathSwayText.thai : DashboardLang.pathSwayText.eng}
              </Text>
              <Text style={{ fontSize: 16, color: '#007bff' }}>{healthData.path_sway || '0'} cm</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff' }}>
                  {this.props.lang ? DashboardLang.mlSwayText.thai : DashboardLang.mlSwayText.eng}
                </Text>
                <Text style={{ fontSize: 16, color: '#007bff' }}>{healthData.ml_sway || '0'} cm</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff' }}>
                  {this.props.lang ? DashboardLang.apSwayText.thai : DashboardLang.apSwayText.eng}
                </Text>
                <Text style={{ fontSize: 16, color: '#007bff' }}>{healthData.ap_sway || '0'} cm</Text>
              </View>
            </View>
          </View>
          {/* Divider */}
          <View style={{ height: 70, width: 1, backgroundColor: '#007bff', opacity: 0.4, marginHorizontal: 10 }} />
          {/* Right Column */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginBottom: 5 }}>
              {this.props.lang ? DashboardLang.ellipseAreaText.thai : DashboardLang.ellipseAreaText.eng}
            </Text>
            <Text style={{ fontSize: 16, color: '#007bff', marginBottom: 10 }}>{healthData.ellipse_area || '0'}
              <Text style={{ fontSize: 12, color: '#007bff' }}> cm</Text>
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginBottom: 5 }}>
              {this.props.lang ? DashboardLang.velocityText.thai : DashboardLang.velocityText.eng}
            </Text>
            <Text style={{ fontSize: 16, color: '#007bff' }}>{healthData.velocity || '0'}
              <Text style={{ fontSize: 12, color: '#007bff' }}> cm/sec</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  renderDynamicDashboard = () => {
    const currentDate = moment().format('DD/MM/YYYY');
    const currentTime = moment().format('h:mm A');
    const { healthData, positionValue } = this.state;
    // Calculate left/right pressure percentages for dynamic dashboard
    const leftTotal = ['forefoot', 'midfoot', 'heel'].reduce((sum, zone) => sum + parseFloat(this.calculatePressurePercentage('left', zone)), 0);
    const rightTotal = ['forefoot', 'midfoot', 'heel'].reduce((sum, zone) => sum + parseFloat(this.calculatePressurePercentage('right', zone)), 0);
    const totalPressure = leftTotal + rightTotal;
    const leftPercentage = totalPressure > 0 ? Math.round((leftTotal / totalPressure) * 100) : 50;
    const rightPercentage = totalPressure > 0 ? Math.round((rightTotal / totalPressure) * 100) : 50;
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Date and Time */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginHorizontal: 20, marginTop: 10, marginBottom: 5 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff' }}>{currentDate} {currentTime}</Text>
        </View>
        {/* Gait Speed, Cadence, Step Count Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginHorizontal: 15 }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginBottom: 5 }}>Cadence</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#007bff', marginBottom: 0 }}>{healthData.cadence || '0'}</Text>
            <Text style={{ fontSize: 14, color: '#6c757d', marginTop: -5 }}>steps/min</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginBottom: 5 }}>Step Count</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#007bff', marginBottom: 0 }}>{healthData.step_count || '0'}</Text>
            <Text style={{ fontSize: 14, color: '#6c757d', marginTop: -5 }}>steps</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginBottom: 5 }}>Gait Speed</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#007bff', marginBottom: 0 }}>{healthData.gait_speed || '0'}</Text>
            <Text style={{ fontSize: 14, color: '#6c757d', marginTop: -5 }}>m/s</Text>
          </View>
        </View>
        {/* Left and Right Foot Cards */}
        <View style={{ flexDirection: 'row', marginTop: 10, marginHorizontal: 15 }}>
          {/* Left Foot Card */}
          <LinearGradient colors={['#005b50', '#0cfdd1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 24, marginRight: 10, padding: 5 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 10, textAlign: 'center' }}>Left Foot</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'center' }}>
                <Image source={require('../../../assets/image/dashboard/left_foot.png')} style={{ width: 80, height: 60, marginRight: 10 }} />
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }}>{'forefoot'}</Text>
                  <Text style={{ fontSize: 16, color: '#007bff', textAlign: 'center' }}>{this.renderPressureValue('left', 'forefoot')}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {['midfoot', 'heel'].map((zone, index) => (
                  <React.Fragment key={zone}>
                    {index > 0 && (
                      <View style={{ height: 80, width: 1, backgroundColor: '#ccc', marginHorizontal: 10 }}
                      />
                    )}
                    <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                      <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#007bff' }}>{zone.charAt(0).toUpperCase() + zone.slice(1)}</Text>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff' }}>{this.renderPressureValue('left', zone)}</Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </LinearGradient>
          {/* Right Foot Card */}
          <LinearGradient colors={['#005b50', '#0cfdd1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 24, marginLeft: 10, padding: 5 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 10, textAlign: 'center' }}>Right Foot</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'center' }}>
                <Image source={require('../../../assets/image/dashboard/right_foot.png')} style={{ width: 80, height: 60, marginRight: 10 }} />
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }}>{'forefoot'}</Text>
                  <Text style={{ fontSize: 16, color: '#007bff', textAlign: 'center' }}>{this.renderPressureValue('right', 'forefoot')}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {['midfoot', 'heel'].map((zone, index) => (
                  <React.Fragment key={zone}>
                    {index > 0 && (
                      <View style={{ height: 80, width: 1, backgroundColor: '#ccc', marginHorizontal: 10 }}
                      />
                    )}
                    <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                      <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#007bff' }}>{zone.charAt(0).toUpperCase() + zone.slice(1)}</Text>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff' }}>{this.renderPressureValue('right', zone)}</Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>
        {/* Pressure Percentage and Foot Balance Row */}
        <View style={{ flexDirection: 'row', marginTop: 10, marginHorizontal: 15 }}>
          {/* Pressure Percentage Card */}
          <LinearGradient colors={['#005b50', '#0cfdd1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 24, marginRight: 10, padding: 5, height: 220 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 16, height: '100%' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 10, textAlign: 'center' }}>Pressure Percentage</Text>
              <View style={{ flexDirection: 'row', height: 55, borderRadius: 12, marginBottom: 10, backgroundColor: '#e0e0e0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
                <View style={{ flex: 50 / 100, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 24 }}>{leftPercentage}%</Text>
                </View>
                <View style={{ flex: 50 / 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 24 }}>{rightPercentage}%</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0, marginTop: 10 }}>
                <View style={{ alignSelf: 'flex-start', marginLeft: 0, paddingRight: 5 }}>
                  <Text style={{ color: '#007bff', fontSize: 20 }}>
                    {this.props.lang ? DashboardLang.leftText.thai : DashboardLang.leftText.eng}
                  </Text>
                </View>
                <Text style={{ color: '#007bff', fontSize: 20, alignSelf: 'flex-end', marginRight: 0 }}>
                  {this.props.lang ? DashboardLang.rightText.thai : DashboardLang.rightText.eng}
                </Text>
              </View>
            </View>
          </LinearGradient>
          {/* Foot Balance Card with COP Chart */}
          <LinearGradient colors={['#005C51', '#0CFFD3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 24, marginLeft: 10, padding: 5, height: 220 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 16, height: '100%' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 10, textAlign: 'center' }}>Foot Balance</Text>
              <View style={{ alignItems: 'center', marginTop: 10, flex: 1, justifyContent: 'center' }}>
                {this.renderCopChart()}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 16, color: '#007bff' }}>
                  {this.props.lang ? DashboardLang.leftText.thai : DashboardLang.leftText.eng}
                </Text>
                <Text style={{ fontSize: 16, color: '#007bff' }}>
                  {this.props.lang ? DashboardLang.rightText.thai : DashboardLang.rightText.eng}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    );
  };

  render() {
    const { isLoading, dataShow, healthData, currentPage } = this.state;
    let dashboardType = healthData && healthData.data_type;

    // --- Pressure Percentage Calculation (NEW LOGIC) ---
    function calculateTotalFootPressure(healthData, side) {
      const sensorType = detectSensorType(healthData);
      if (sensorType === '8-point') {
        let sum = 0;
        for (let i = 1; i <= 8; i++) {
          sum += parseInt(healthData[`${side === 'left' ? 'peak_l' : 'peak_r'}${i}`] || 0);
        }
        return sum;
      }
      if (sensorType === '5-point') {
        let sum = 0;
        for (let i = 1; i <= 5; i++) {
          sum += parseInt(healthData[`${side === 'left' ? 'peak_l' : 'peak_r'}${i}`] || 0);
        }
        return sum;
      }
      return 0;
    }
    let leftPercentage = 0;
    let rightPercentage = 0;
    if (healthData && Object.keys(healthData).length > 0) {
      const leftPressure = calculateTotalFootPressure(healthData, 'left');
      const rightPressure = calculateTotalFootPressure(healthData, 'right');
      const total = leftPressure + rightPressure;
      if (total > 0) {
        leftPercentage = ((leftPressure / total) * 100).toFixed(0);
        rightPercentage = ((rightPressure / total) * 100).toFixed(0);
      }
    }
    // --- END Pressure Percentage Calculation ---

    return (
      <View style={{ flex: 1, backgroundColor: '#f0f0f0' }}>
        <PagerView style={{ flex: 1 }} initialPage={0} onPageSelected={e => this.setState({ currentPage: e.nativeEvent.position })}>
          {/* First Page: Dashboard */}
          <View key="1" style={{ flex: 1 }}>
            <HeaderFix
              icon_left={'left'}
              onpress_left={() => this.props.navigation.goBack()}
              title={this.props.route?.params?.name || 'Dashboard'}
            />
            {/* Add FabChatbot to the first page
            <FabChatbot onPress={() => this.props.navigation.navigate('Chatbot')} /> */}
            {isLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Spinner size="lg" color="#007bff" />
              </View>
            ) : dataShow ? (
              <View style={{ flex: 1 }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ textAlign: 'center', fontSize: 16, color: '#6c757d' }}>
                    {'No data found.\nPress Back to record data or click Reload'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', width: '90%', justifyContent: 'space-between', alignSelf: 'center', marginBottom: '10%' }}>
                  <TouchableOpacity
                    onPress={() => this.props.navigation.goBack()}
                    style={{ width: '40%', height: 40, backgroundColor: '#dc3545', borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={this.handleFetchDashboardData}
                    style={{ width: '40%', height: 40, backgroundColor: '#17a2b8', borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Reload</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : dashboardType == 1 ? (
              this.renderStaticDashboard()
            ) : dashboardType == 2 ? (
              this.renderDynamicDashboard()
            ) : null}
            {/* Pagination Dots */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 5, width: '100%' }}>
              <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: currentPage === 0 ? '#007bff' : '#e0e0e0', marginHorizontal: 5 }} />
              <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: currentPage === 1 ? '#007bff' : '#e0e0e0', marginHorizontal: 5 }} />
            </View>
          </View>
         {/* Second Page - Summary */}
         <View key="2" style={{ flex: 1, backgroundColor: '#eafffa' }}>
           {/* Header matching Dashboard style */}
           <HeaderFix
             icon_left={'left'}
             onpress_left={() => this.props.navigation.goBack()}
             title={'Summary'}
           />

           {/* Content */}
           <ScrollView contentContainerStyle={{ 
             alignItems: 'center', 
             paddingTop: 20,
             paddingBottom: 80 
           }}>
             <Image 
               source={require('../../../assets/image/dashboard/foot-legs.png')} 
               style={{ 
                 width: 200, 
                 height: 350, 
                 resizeMode: 'contain', 
                 marginVertical: 30 
               }} 
             />
             
             <View style={{ width: '85%', backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
               {this.state.summaryLoading ? (
                 <View style={{ paddingVertical: 10 }}>
                   <Spinner size="sm" color="#007bff" />
                   <Text style={{ fontSize: 14, color: '#6c757d', marginTop: 5 }}>Loading summary...</Text>
                 </View>
               ) : (
                 <Text style={{ fontSize: 16, color: '#333', textAlign: 'left' }}>
                   {this.state.summaryText}
                 </Text>
               )}
             </View>
           </ScrollView>

           {/* FabChatbot
           <FabChatbot onPress={() => this.props.navigation.navigate('Chatbot')} /> */}

           {/* Pagination Dots */}
           <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 5, width: '100%' }}>
             <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: this.state.currentPage === 0 ? '#007bff' : '#e0e0e0', marginHorizontal: 5 }} />
             <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: this.state.currentPage === 1 ? '#007bff' : '#e0e0e0', marginHorizontal: 5 }} />
           </View>
         </View>
        </PagerView>
      </View>
    );
  }
}

const mapStateToProps = state => ({
  user: state.user,
  data: state.data,
  lang: state.lang,
  token: state.token,
});

export default connect(mapStateToProps)(DashboardScreen);