import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Dimensions, Text as RNText, Modal, Platform, PermissionsAndroid, NativeModules, NativeEventEmitter, BackHandler, AppState } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import HeaderFix from '../../common/HeaderFix';
import { connect } from 'react-redux';
import LangHome from '../../../assets/language/screen/lang_home';
import { useSelector, useDispatch } from 'react-redux';
import BleManager from 'react-native-ble-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import BackgroundTimer from 'react-native-background-timer';

const GALLERY_ICON = require('../../../assets/image/gesture_analysis/gallery.png');

const { width, height } = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const MAX_UPLOAD_ATTEMPTS = 3;

const Gesture = (props) => {
  const navigation = props.navigation || useNavigation();
  const dispatch = useDispatch();
  
  // Video and UI states
  const [videoUri, setVideoUri] = useState(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSensorSuccess, setShowSensorSuccess] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  
  // Recording states
  const [recording, setRecording] = useState(false);
  const [sensorDataArray, setSensorDataArray] = useState([]);
  const [bleListener, setBleListener] = useState(null);
  const [backgroundTimerId, setBackgroundTimerId] = useState(null);
  const [appStateListener, setAppStateListener] = useState(null);
  
  // CRITICAL: Use refs for precise timing control
  const sensorRecordingRef = useRef(false);
  const actualVideoStartTime = useRef(null);
  const actualVideoEndTime = useRef(null);
  const lastTimestamp = useRef(null);
  
  // Other states
  const [shoeSize, setShoeSize] = useState(42);
  const [token, setToken] = useState(props.token);
  const [idMember, setIdMember] = useState(props.id_member);
  
  const productNumber = useSelector ? useSelector(state => state.productNumber) : null;
  const user = useSelector ? useSelector(state => state.user) : null;
  const idCustomer = user?.id_customer || props.id_member;

  useEffect(() => {
    requestCameraPermission();
    setupBLEConnection();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      cleanupAllRecording();
      navigation.navigate('Home');
      return true;
    });
    
    return () => {
      backHandler.remove();
      cleanupAllRecording();
    };
  }, []);

  useEffect(() => {
    return () => {
      console.log('🧹 [COMPONENT] Gesture component unmounting...');
      cleanupAllRecording();
    };
  }, []);

  useEffect(() => {
    const fetchAuthData = async () => {
      if (!token) {
        const t = await AsyncStorage.getItem('token');
        if (t) setToken(t);
      }
      if (!idMember) {
        const idm = await AsyncStorage.getItem('id_member');
        if (idm) setIdMember(idm);
      }
    };
    fetchAuthData();
  }, [token, idMember]);

  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "This app needs access to your camera to record videos.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setHasPermission(true);
      }
    } catch (err) {
      console.warn(err);
      setHasPermission(false);
    }
  };

  const setupBLEConnection = async () => {
    try {
      console.log('🔌 [BLE] Setting up BLE connection...');
      await ensureBLEConnection();
      console.log('✅ [BLE] BLE connection setup complete');
    } catch (error) {
      console.log('❌ [BLE] Error setting up BLE connection:', error);
    }
  };

  const ensureBLEConnection = async () => {
    try {
      console.log('🔍 [BLE] Checking BLE device connections...');
      const connectedDevices = await BleManager.getConnectedPeripherals([]);
      console.log('🔍 [BLE] Connected devices:', connectedDevices.map(d => d.id));
      
      const leftConnected = connectedDevices.some(device => device.id === props.leftDevice);
      const rightConnected = connectedDevices.some(device => device.id === props.rightDevice);
      
      console.log(`🔍 [BLE] Left device (${props.leftDevice}): ${leftConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🔍 [BLE] Right device (${props.rightDevice}): ${rightConnected ? '✅ Connected' : '❌ Disconnected'}`);
      
      if (!leftConnected && props.leftDevice) {
        console.log('🔄 [BLE] Attempting to reconnect left device...');
        try {
          await BleManager.connect(props.leftDevice);
          await BleManager.retrieveServices(props.leftDevice);
          await BleManager.startNotification(props.leftDevice, 'FFE0', 'FFE1');
          console.log('✅ [BLE] Left device reconnected successfully');
        } catch (error) {
          console.log('❌ [BLE] Failed to reconnect left device:', error);
        }
      }
      
      if (!rightConnected && props.rightDevice) {
        console.log('🔄 [BLE] Attempting to reconnect right device...');
        try {
          await BleManager.connect(props.rightDevice);
          await BleManager.retrieveServices(props.rightDevice);
          await BleManager.startNotification(props.rightDevice, 'FFE0', 'FFE1');
          console.log('✅ [BLE] Right device reconnected successfully');
        } catch (error) {
          console.log('❌ [BLE] Failed to reconnect right device:', error);
        }
      }
      
      const finalConnectedDevices = await BleManager.getConnectedPeripherals([]);
      const finalLeftConnected = finalConnectedDevices.some(device => device.id === props.leftDevice);
      const finalRightConnected = finalConnectedDevices.some(device => device.id === props.rightDevice);
      
      if (!finalLeftConnected || !finalRightConnected) {
        console.log('⚠️ [BLE] Warning: Not all devices connected');
        Alert.alert('BLE Connection Warning', 'Some sensors are not connected. Sensor data may be incomplete.');
        return false;
      }
      
      console.log('🎉 [BLE] All devices connected successfully!');
      return true;
    } catch (error) {
      console.log('❌ [BLE] Error ensuring BLE connection:', error);
      return false;
    }
  };

  // FIXED: Start sensor recording but only collect data when video is recording
  const startSensorRecording = () => {
    console.log('🚀 [SENSOR] Starting sensor listener...');
    
    // Clean up existing listener
    if (bleListener) {
      bleListener.remove();
    }
    
    // Reset state
    setSensorDataArray([]);
    setRecording(true);
    sensorRecordingRef.current = true;
    lastTimestamp.current = Date.now();
    
    // Set up BLE listener
    const listener = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral }) => {
        // CRITICAL: Only collect data during actual video recording window
        if (sensorRecordingRef.current && actualVideoStartTime.current && !actualVideoEndTime.current) {
          processSensorData(value, peripheral);
        }
      }
    );
    
    setBleListener(listener);
    
    // Background timer for connection checks
    const timerId = BackgroundTimer.setInterval(() => {
      if (sensorRecordingRef.current) {
        checkBLEConnection();
      }
    }, 5000);
    setBackgroundTimerId(timerId);
    
    // App state listener
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background') {
        console.log('📱 [APP] Going to background, maintaining sensor recording');
      } else if (nextAppState === 'active') {
        console.log('📱 [APP] Returning to foreground, sensor recording active');
        if (sensorRecordingRef.current) {
          checkBLEConnection();
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    setAppStateListener(subscription);
    
    dispatch({ type: 'READ_BLUETOOTH_STATE', payload: true });
    console.log('✅ [SENSOR] Sensor listener ready (waiting for video start signal)');
  };

  const stopSensorRecording = () => {
    console.log('⏹️ [SENSOR] Stopping sensor recording...');
    
    setRecording(false);
    sensorRecordingRef.current = false;
    
    // Mark video end time
    if (actualVideoStartTime.current && !actualVideoEndTime.current) {
      actualVideoEndTime.current = Date.now();
      console.log(`📅 [VIDEO-END] Video recording ended at: ${new Date(actualVideoEndTime.current).toISOString()}`);
    }
    
    if (bleListener) {
      bleListener.remove();
      setBleListener(null);
    }
    
    if (backgroundTimerId) {
      BackgroundTimer.clearInterval(backgroundTimerId);
      setBackgroundTimerId(null);
    }
    
    if (appStateListener) {
      appStateListener.remove();
      setAppStateListener(null);
    }
    
    dispatch({ type: 'READ_BLUETOOTH_STATE', payload: false });
    console.log('✅ [SENSOR] Sensor recording stopped completely');
  };

  const cleanupAllRecording = () => {
    console.log('🧹 [CLEANUP] Cleaning up all recording processes...');
    
    setRecording(false);
    sensorRecordingRef.current = false;
    actualVideoStartTime.current = null;
    actualVideoEndTime.current = null;
    lastTimestamp.current = null;
    
    if (bleListener) {
      bleListener.remove();
      setBleListener(null);
    }
    
    if (backgroundTimerId) {
      BackgroundTimer.clearInterval(backgroundTimerId);
      setBackgroundTimerId(null);
    }
    
    if (appStateListener) {
      appStateListener.remove();
      setAppStateListener(null);
    }
    
    dispatch({ type: 'READ_BLUETOOTH_STATE', payload: false });
    console.log('✅ [CLEANUP] All recording processes cleaned up');
  };

  const processSensorData = (value, peripheral) => {
    const now = Date.now();
    const duration = now - (lastTimestamp.current || now);
    lastTimestamp.current = now;
    
    // Enhanced sensor data processing
    let sensorArr = toDecimalArray(value);
    
    // Enhanced validation for meaningful data
    const hasNonZeroData = sensorArr.some(val => val > 0);
    if (!hasNonZeroData) {
      return;
    }
    
    // Apply sensor calibration
    const calibratedValues = applySensorCalibration(sensorArr, peripheral);
    
    let left = null, right = null;
    
    if (peripheral === props.leftDevice) {
      left = { sensor: calibratedValues };
    } else if (peripheral === props.rightDevice) {
      right = { sensor: calibratedValues };
    }
    
    setSensorDataArray(prev => {
      const last = prev[prev.length - 1] || {};
      const newData = {
        duration,
        timestamp: new Date(now).toISOString(),
        left: left ? left : last.left || { sensor: [0,0,0,0,0,0,0,0] },
        right: right ? right : last.right || { sensor: [0,0,0,0,0,0,0,0] },
      };
      
      dispatch({ type: 'ADD_BLUETOOTH_DATA', payload: newData });
      const newArray = [...prev, newData];
      
      // Log progress every 50 data points
      if (newArray.length % 50 === 0) {
        console.log(`📈 [ACTIVE-RECORDING] Collected ${newArray.length} sensor data points during video recording`);
      }
      
      return newArray;
    });
  };

  const checkBLEConnection = async () => {
    try {
      const connectedDevices = await BleManager.getConnectedPeripherals([]);
      const leftConnected = connectedDevices.some(device => device.id === props.leftDevice);
      const rightConnected = connectedDevices.some(device => device.id === props.rightDevice);
      
      if (!leftConnected || !rightConnected) {
        console.log('🔄 [BLE] Device disconnected during recording, attempting reconnection...');
        await ensureBLEConnection();
      }
    } catch (error) {
      console.log('❌ [BLE] Error checking BLE connection:', error);
    }
  };

  // FIXED: Enhanced toDecimalArray function
  function toDecimalArray(byteArray) {
    let dec = [];
    
    if (byteArray.length >= 17) {
      // Handle 17-byte format - extract meaningful values
      const nonZeroBytes = [];
      
      // Check last few bytes which contain sensor values
      for (let i = Math.max(0, byteArray.length - 5); i < byteArray.length; i++) {
        if (byteArray[i] > 0) {
          nonZeroBytes.push(byteArray[i]);
        }
      }
      
      // Check middle bytes for additional sensor data
      for (let i = 10; i < byteArray.length - 5; i++) {
        if (byteArray[i] > 0 && nonZeroBytes.length < 8) {
          nonZeroBytes.push(byteArray[i]);
        }
      }
      
      dec = nonZeroBytes.slice(0, 8);
    } else if (byteArray.length >= 10) {
      // Medium packet format
      for (let i = 0; i < byteArray.length - 1; i += 2) {
        // FIXED: Use 256 instead of 255 for proper byte combination
        const value = byteArray[i] * 256 + byteArray[i + 1];
        if (value > 0 && dec.length < 8) {
          dec.push(value);
        }
      }
    } else {
      // Short packet format - use individual bytes
      for (let i = 0; i < byteArray.length; i++) {
        if (byteArray[i] > 0 && dec.length < 8) {
          dec.push(byteArray[i]);
        }
      }
    }
    
    // Ensure we return exactly 8 values to match API format
    while (dec.length < 8) {
      dec.push(0);
    }
    
    return dec.slice(0, 8);
  }

  const applySensorCalibration = (sensorValues, deviceId) => {
    return sensorValues.map(value => {
      if (value < 0 || value > 4095) {
        return 0;
      }
      return Math.round(value);
    });
  };

  // FIXED: Video recording with precise timing detection
  const recordVideo = async () => {
    if (!props.leftDevice || !props.rightDevice) {
      Alert.alert('Warning!', 'Please check your Bluetooth connection and add both devices.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Device', {
              name: props.lang ? LangHome.addDeviceButton.thai : LangHome.addDeviceButton.eng,
            });
          },
        },
      ]);
      return;
    }
    
    const permissionGranted = await requestCameraPermission();
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Camera permission is required to record videos.');
      return;
    }

    // Pre-connect BLE devices
    console.log('🔌 [PRE-CONNECT] Ensuring BLE connection before camera launch...');
    const bleReady = await ensureBLEConnection();
    if (!bleReady) {
      Alert.alert('BLE Error', 'Cannot establish sensor connection. Please check your devices.');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ [PRE-CONNECT] BLE connection ready, launching camera...');

    const options = {
      mediaType: 'video',
      videoQuality: 'high',
      durationLimit: 60,
      saveToPhotos: false,
      cameraType: 'back',
      presentationStyle: 'fullScreen',
    };

    // Start sensor listener (but not data collection yet)
    console.log('🔄 [FLOW] Starting sensor listener...');
    startSensorRecording();
    
    console.log('🎥 [CAMERA] Camera launched...');

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('📱 [VIDEO] User cancelled camera');
        stopSensorRecording();
        return;
      }
      
      if (response.errorCode) {
        console.log('❌ [VIDEO] Camera error occurred');
        stopSensorRecording();
        Alert.alert('Error', response.errorMessage);
        return;
      }
      
      if (response.assets && response.assets[0]) {
        const videoAsset = response.assets[0];
        
        // CRITICAL: Set video end time when camera returns
        actualVideoEndTime.current = Date.now();
        
        console.log(`📅 [VIDEO-COMPLETE] Video recording completed at: ${new Date(actualVideoEndTime.current).toISOString()}`);
        console.log(`📊 [DATA-COLLECTED] Total sensor data points: ${sensorDataArray.length}`);
        
        // Stop sensor recording
        stopSensorRecording();
        
        // Process with actual timing
        if (actualVideoStartTime.current && actualVideoEndTime.current) {
          const filteredSensorData = filterSensorDataByVideoTiming(
            sensorDataArray,
            actualVideoStartTime.current,
            actualVideoEndTime.current
          );
          setSensorDataArray(filteredSensorData);
          console.log(`✅ [FILTERED] Final sensor data points: ${filteredSensorData.length}`);
        }
        
        setVideoUri(videoAsset.uri);
        setPreview(true);
      } else {
        console.log('❌ [VIDEO] No video recorded');
        stopSensorRecording();
      }
    });

    // CRITICAL: Start collecting sensor data after a delay (when user likely starts recording)
    setTimeout(() => {
      if (sensorRecordingRef.current) {
        actualVideoStartTime.current = Date.now();
        console.log(`📅 [VIDEO-START] Video recording started at: ${new Date(actualVideoStartTime.current).toISOString()}`);
        console.log('🎬 [COLLECT] Now collecting sensor data for video...');
      }
    }, 2000); // 2 second delay to account for user interaction
  };

  // FIXED: Better filtering with debugging
  const filterSensorDataByVideoTiming = (sensorData, videoStartTime, videoEndTime) => {
    console.log(`🔍 [FILTER] Filtering sensor data...`);
    console.log(`🔍 [FILTER] Video start: ${new Date(videoStartTime).toISOString()}`);
    console.log(`🔍 [FILTER] Video end: ${new Date(videoEndTime).toISOString()}`);
    console.log(`🔍 [FILTER] Total sensor points before filter: ${sensorData.length}`);
    
    if (sensorData.length === 0) {
      console.log('⚠️ [FILTER] No sensor data to filter');
      return [];
    }
    
    // Debug sensor data timestamp range
    if (sensorData.length > 0) {
      const firstDataTime = new Date(sensorData[0].timestamp).getTime();
      const lastDataTime = new Date(sensorData[sensorData.length - 1].timestamp).getTime();
      console.log(`🔍 [FILTER] First sensor data: ${new Date(firstDataTime).toISOString()}`);
      console.log(`🔍 [FILTER] Last sensor data: ${new Date(lastDataTime).toISOString()}`);
      console.log(`🔍 [FILTER] Sensor data duration: ${(lastDataTime - firstDataTime) / 1000}s`);
      
      // Check for time overlap
      const hasOverlap = !(lastDataTime < videoStartTime || firstDataTime > videoEndTime);
      console.log(`🔍 [FILTER] Time overlap exists: ${hasOverlap}`);
      
      if (!hasOverlap) {
        console.log('⚠️ [FILTER] No time overlap detected, using all collected sensor data...');
        // Use all sensor data as fallback since timing detection failed
        return sensorData.map((dataPoint, index) => ({
          ...dataPoint,
          duration: index === 0 ? 0 : 1000,
          timestamp: dataPoint.timestamp,
          relativeTime: index,
          fallbackFiltering: true,
        }));
      }
    }
    
    // Normal filtering with time range
    const filteredData = sensorData.filter(dataPoint => {
      const dataTimestamp = new Date(dataPoint.timestamp).getTime();
      return dataTimestamp >= videoStartTime && dataTimestamp <= videoEndTime;
    });
    
    // Process filtered data for API
    const processedData = filteredData.map((dataPoint, index) => {
      const dataTimestamp = new Date(dataPoint.timestamp).getTime();
      const relativeTime = dataTimestamp - videoStartTime;
      
      return {
        ...dataPoint,
        duration: index === 0 ? 0 : relativeTime,
        timestamp: dataPoint.timestamp,
        videoRelativeTime: relativeTime / 1000,
        fallbackFiltering: false,
      };
    });
    
    console.log(`✅ [FILTER] Filtered ${processedData.length} sensor data points`);
    return processedData;
  };

  const uploadVideo = async () => {
    if (!videoUri) {
      Alert.alert('Error', 'No video to upload');
      return;
    }
    
    const authToken = props.token || token;
    const authIdMember = (user && (user.id_member || user.id_customer)) || idMember;
    
    if (!authToken || !authIdMember) {
      Alert.alert('Error', 'Authentication data missing');
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    setPreview(false);
    
    try {
      const formData = new FormData();
      formData.append('id_member', authIdMember);
      formData.append('video_file', {
        uri: Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri,
        type: 'video/mp4',
        name: 'gesture_video.mp4',
      });
      
      const response = await fetch('https://api1.suratec.co.th/api/video/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        body: formData,
      });
      
      const data = await response.json();
      console.log('[uploadVideo] Response:', data);
      
      if (response.ok) {
        setShowSuccess(true);
        const vid = data.video_id || data.id || data.data?.video_id;
        
        if (vid) {
          await handleAfterVideoUpload(vid);
        }
        
        setTimeout(() => {
          setShowSuccess(false);
          setVideoUri(null);
          setUploading(false);
          setSensorDataArray([]);
          actualVideoStartTime.current = null;
          actualVideoEndTime.current = null;
        }, 2000);
      } else {
        setUploadError(data.message || 'Upload failed');
        setUploading(false);
      }
    } catch (error) {
      console.log('[uploadVideo] Error:', error);
      setUploadError(error.message || 'Upload failed');
      setUploading(false);
    }
  };

  const uploadSensorData = async ({ video_id, attempts = 1 }) => {
    if (!sensorDataArray || sensorDataArray.length === 0) {
      console.warn('[uploadSensorData] No sensor data to upload');
      Alert.alert('No Sensor Data', 'No sensor data was recorded during video recording.');
      return false;
    }

    console.log(`[uploadSensorData] Uploading ${sensorDataArray.length} sensor data points`);

    const payload = {
      id_customer: idCustomer,
      video_id,
      product_number: productNumber,
      bluetooth_left_id: props.leftDevice,
      bluetooth_right_id: props.rightDevice,
      shoe_size: shoeSize,
      data: sensorDataArray,
    };

    try {
      const response = await fetch('https://api1.suratec.co.th/surasole-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const respData = await response.json();
      console.log('[uploadSensorData] Response:', respData);

      if (response.ok) {
        return respData;
      } else {
        throw new Error(respData.message || 'Upload failed');
      }
    } catch (error) {
      console.log('[uploadSensorData] Error:', error);
      
      if (attempts < MAX_UPLOAD_ATTEMPTS) {
        return uploadSensorData({ video_id, attempts: attempts + 1 });
      } else {
        try {
          await AsyncStorage.setItem(
            `sensorData_${video_id}`,
            JSON.stringify(payload)
          );
          Alert.alert('Upload Failed', 'Sensor data saved locally for retry.');
        } catch (e) {
          console.log('Failed to save sensor data locally:', e);
        }
        return false;
      }
    }
  };

  const handleAfterVideoUpload = async (vid) => {
    const sensorResult = await uploadSensorData({ video_id: vid });
    
    if (sensorResult && sensorResult.status === 'success') {
      setShowSensorSuccess(true);
      setTimeout(() => setShowSensorSuccess(false), 2000);
    }
  };

  const discardVideo = () => {
    setPreview(false);
    setVideoUri(null);
    setUploadError(null);
    setSensorDataArray([]);
    actualVideoStartTime.current = null;
    actualVideoEndTime.current = null;
    cleanupAllRecording();
  };

  if (hasPermission === null) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#00bfc5" /></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.loadingContainer}><RNText style={{ color: '#fff' }}>No access to camera</RNText></View>;
  }

  return (
    <View style={styles.fullScreenContainer}>
      <HeaderFix
        title="Gesture"
        lang={props.lang}
        icon_left={true}
        onpress_left={() => {
          cleanupAllRecording();
          navigation.navigate('Home');
        }}
      />
      
      <View style={styles.cameraContainer}>
        <View style={styles.camera} />
        
        {recording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <RNText style={styles.recordingText}>
              {actualVideoStartTime.current ? 'Recording Video & Sensors...' : 'Preparing...'}
            </RNText>
            <RNText style={styles.recordingSubText}>
              Sensor data: {sensorDataArray.length} points
            </RNText>
          </View>
        )}
        
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.recordButton} 
            onPress={recordVideo}
            disabled={uploading}
          >
            <RNText style={styles.recordText}>Record</RNText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.galleryButton} 
            onPress={() => {
              cleanupAllRecording();
              navigation.navigate('GestureAnalysis');
            }}
          >
            <Image source={GALLERY_ICON} style={styles.galleryIcon} />
          </TouchableOpacity>
        </View>
        
        {/* All your existing modals remain the same */}
        <Modal visible={preview} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <RNText style={styles.modalTitle}>Video Recorded</RNText>
              <RNText style={styles.modalSubtitle}>
                Sensor data points: {sensorDataArray.length}
              </RNText>
              {sensorDataArray.length > 0 && sensorDataArray[0].fallbackFiltering && (
                <RNText style={styles.modalWarning}>
                  ⚠️ Used fallback timing synchronization
                </RNText>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.uploadButton]} 
                  onPress={uploadVideo}
                >
                  <RNText style={styles.modalButtonText}>Upload</RNText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.discardButton]} 
                  onPress={discardVideo}
                >
                  <RNText style={styles.modalButtonText}>Discard</RNText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <View style={styles.uploadingContent}>
              <ActivityIndicator size="large" color="#00bfc5" />
              <RNText style={styles.uploadingText}>Uploading video and sensor data...</RNText>
            </View>
          </View>
        )}

        {showSuccess && (
          <View style={styles.successOverlay}>
            <View style={styles.successPopup}>
              <View style={styles.successIcon}>
                <RNText style={styles.successIconText}>✓</RNText>
              </View>
              <RNText style={styles.successText}>Video uploaded successfully!</RNText>
            </View>
          </View>
        )}

        {showSensorSuccess && (
          <View style={styles.successOverlay}>
            <View style={styles.successPopup}>
              <View style={styles.successIcon}>
                <RNText style={styles.successIconText}>✓</RNText>
              </View>
              <RNText style={styles.successText}>Sensor data uploaded successfully!</RNText>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// Keep all your existing styles
const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  camera: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 200,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff0000',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recordingSubText: {
    color: '#ccc',
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    width: '100%',
    zIndex: 10,
  },
  recordButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  recordText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  galleryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  galleryIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 14,
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  uploadButton: {
    backgroundColor: '#00bfc5',
  },
  discardButton: {
    backgroundColor: '#D32F2F',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  uploadingContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
    fontWeight: '500',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  successPopup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00bfc5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});

const mapStateToProps = (state) => ({
  leftDevice: state.leftDevice,
  rightDevice: state.rightDevice,
  lang: state.lang,
  token: state.token,
  id_member: state.id_member,
});

export default connect(mapStateToProps)(Gesture);
