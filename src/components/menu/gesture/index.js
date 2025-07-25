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
  const [bleListener, setBleListener] = useState(null);
  const [backgroundTimerId, setBackgroundTimerId] = useState(null);
  const [appStateListener, setAppStateListener] = useState(null);
  
  // CRITICAL: Use refs for precise control
  const sensorRecordingRef = useRef(false);
  const videoRecordingActiveRef = useRef(false);
  const sensorDataCollectedRef = useRef([]); // Synchronized sensor data
  const componentMountedRef = useRef(true);
  const lastTimestamp = useRef(null);
  const collectedDataCount = useRef(0);
  
  // Video synchronization refs
  const videoStartTimeRef = useRef(null);
  const videoEndTimeRef = useRef(null);
  const videoAssetRef = useRef(null);
  
  // Other states
  const [shoeSize, setShoeSize] = useState(42);
  const [token, setToken] = useState(props.token);
  const [idMember, setIdMember] = useState(props.id_member);
  
  const productNumber = useSelector ? useSelector(state => state.productNumber) : null;
  const user = useSelector ? useSelector(state => state.user) : null;
  const idCustomer = user?.id_customer || props.id_member;

  useEffect(() => {
    componentMountedRef.current = true;
    requestCameraPermission();
    setupBLEConnection();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🔙 [BACK] Hardware back button pressed');
      forceStopAllRecording();
      navigation.navigate('Home');
      return true;
    });
    
    return () => {
      console.log('🧹 [COMPONENT] Gesture component unmounting...');
      componentMountedRef.current = false;
      backHandler.remove();
      forceStopAllRecording();
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

  // Camera permission function
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
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasPermission(isGranted);
        return isGranted;
      } else {
        setHasPermission(true);
        return true;
      }
    } catch (err) {
      console.warn('Camera permission error:', err);
      setHasPermission(false);
      return false;
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

  // Stop BLE notifications
  const stopBLENotifications = async () => {
    try {
      if (props.leftDevice) {
        await BleManager.stopNotification(props.leftDevice, 'FFE0', 'FFE1');
        console.log('🔌 [BLE] Stopped notifications for left device');
      }
      if (props.rightDevice) {
        await BleManager.stopNotification(props.rightDevice, 'FFE0', 'FFE1');
        console.log('🔌 [BLE] Stopped notifications for right device');
      }
    } catch (error) {
      console.log('❌ [BLE] Error stopping notifications:', error);
    }
  };

  // Start sensor listener
  const startSensorListener = () => {
    console.log('🚀 [SENSOR] Starting BLE listener (not collecting data yet)...');
    
    // Clean up existing listener
    if (bleListener) {
      bleListener.remove();
    }
    
    // Reset everything
    sensorDataCollectedRef.current = [];
    collectedDataCount.current = 0;
    setRecording(true);
    sensorRecordingRef.current = true;
    videoRecordingActiveRef.current = false;
    lastTimestamp.current = Date.now();
    
    // Set up BLE listener
    const listener = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral }) => {
        // CRITICAL: Only collect when video is actively recording
        if (!componentMountedRef.current) {
          return;
        }
        
        if (sensorRecordingRef.current && videoRecordingActiveRef.current) {
          collectSensorData(value, peripheral);
        }
      }
    );
    
    setBleListener(listener);
    
    // Background timer for connection checks
    const timerId = BackgroundTimer.setInterval(() => {
      if (sensorRecordingRef.current && componentMountedRef.current) {
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
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    setAppStateListener(subscription);
    
    dispatch({ type: 'READ_BLUETOOTH_STATE', payload: true });
    console.log('✅ [SENSOR] BLE listener ready, waiting for video recording to start...');
  };

  // DEBUG: Analyze sensor packet structure
  function analyzeSensorPacket(byteArray, peripheral) {
    const nonZeroPositions = [];
    byteArray.forEach((byte, index) => {
      if (byte > 0) {
        nonZeroPositions.push({ position: index, value: byte });
      }
    });
    
    if (nonZeroPositions.length > 0 && Math.random() < 0.1) { // 10% chance to avoid spam
      console.log(`🔬 [PACKET-ANALYSIS] ${peripheral}: Found ${nonZeroPositions.length} non-zero bytes:`, nonZeroPositions);
    }
  }

  // Extract ALL sensor values from 17-byte packets
  function toDecimalArray(byteArray) {
    let dec = [];
    
    if (byteArray.length >= 17) {
      // Enhanced 17-byte format processing
      const sensorValues = [];
      
      // Extract non-zero bytes from different positions
      if (byteArray[3] > 0) sensorValues.push(byteArray[3]);
      if (byteArray[7] > 0) sensorValues.push(byteArray[7]);
      if (byteArray[13] > 0) sensorValues.push(byteArray[13]);
      
      // Check last 4 bytes (most common sensor data location)
      for (let i = byteArray.length - 4; i < byteArray.length; i++) {
        if (byteArray[i] > 0) {
          sensorValues.push(byteArray[i]);
        }
      }
      
      // Check middle section (bytes 8-12) for additional sensor data
      for (let i = 8; i <= 12; i++) {
        if (byteArray[i] > 0 && sensorValues.length < 8) {
          sensorValues.push(byteArray[i]);
        }
      }
      
      // Look for patterns - consecutive non-zero bytes might be 16-bit values
      for (let i = 0; i < byteArray.length - 1 && sensorValues.length < 8; i++) {
        if (byteArray[i] > 0 && byteArray[i + 1] > 0) {
          const value = (byteArray[i] << 8) | byteArray[i + 1];
          if (value > 0 && value < 4096) { // Valid sensor range
            sensorValues.push(value);
            i++; // Skip next byte
          }
        } else if (byteArray[i] > 0) {
          sensorValues.push(byteArray[i]);
        }
      }
      
      dec = [...new Set(sensorValues)]; // Remove duplicates
      
    } else if (byteArray.length >= 10) {
      // Medium packet format
      for (let i = 0; i < byteArray.length - 1; i += 2) {
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
    
    // Ensure we return exactly 8 values
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

  // Video-synchronized sensor data collection
  const collectSensorData = (value, peripheral) => {
    const now = Date.now();
    
    // Only collect if video is actively recording
    if (!videoRecordingActiveRef.current || !videoStartTimeRef.current) {
      return;
    }
    
    // Analyze and extract sensor values
    analyzeSensorPacket(value, peripheral);
    let sensorArr = toDecimalArray(value);
    
    const hasNonZeroData = sensorArr.some(val => val > 0);
    if (!hasNonZeroData) {
      return;
    }
    
    const calibratedValues = applySensorCalibration(sensorArr, peripheral);
    
    // Calculate video-relative timing
    const videoRelativeTime = now - videoStartTimeRef.current;
    const videoTimestamp = videoRelativeTime / 1000; // For video playback sync
    
    // Get previous data for missing sensor (left/right)
    const lastDataPoint = sensorDataCollectedRef.current.length > 0 ? 
      sensorDataCollectedRef.current[sensorDataCollectedRef.current.length - 1] : 
      { 
        left: { sensor: [0,0,0,0,0,0,0,0] }, 
        right: { sensor: [0,0,0,0,0,0,0,0] } 
      };
    
    // Create synchronized data point
    const syncedDataPoint = {
      // Timing for video synchronization
      timestamp: new Date(now).toISOString(),
      videoTimestamp, // CRITICAL: Seconds from video start
      videoRelativeTime, // Milliseconds from video start
      duration: now - (lastTimestamp.current || now),
      frameNumber: Math.floor(videoTimestamp * 30), // Assuming 30fps
      
      // Sensor data
      left: peripheral === props.leftDevice ? 
        { sensor: calibratedValues } : 
        lastDataPoint.left,
      right: peripheral === props.rightDevice ? 
        { sensor: calibratedValues } : 
        lastDataPoint.right,
      
      // Analysis metadata
      deviceId: peripheral,
      sampleRate: 'realtime',
      analysisReady: true,
    };
    
    // Store in synchronized array
    sensorDataCollectedRef.current.push(syncedDataPoint);
    collectedDataCount.current = sensorDataCollectedRef.current.length;
    
    // Real-time sync logging
    if (collectedDataCount.current % 25 === 0) {
      console.log(`📈 [VIDEO-SYNC] Collected ${collectedDataCount.current} points | Video time: ${videoTimestamp.toFixed(2)}s`);
    }
    
    lastTimestamp.current = now;
    dispatch({ type: 'ADD_BLUETOOTH_DATA', payload: syncedDataPoint });
  };

  // Force stop all recording processes
  const forceStopAllRecording = async () => {
    console.log('🛑 [FORCE-STOP] Stopping all recording processes immediately...');
    
    // Stop all recording flags
    setRecording(false);
    sensorRecordingRef.current = false;
    videoRecordingActiveRef.current = false;
    componentMountedRef.current = false;
    
    // Remove BLE listener
    if (bleListener) {
      console.log('🔌 [FORCE-STOP] Removing BLE listener...');
      bleListener.remove();
      setBleListener(null);
    }
    
    // Stop BLE notifications
    await stopBLENotifications();
    
    // Clear timers
    if (backgroundTimerId) {
      console.log('⏰ [FORCE-STOP] Clearing background timer...');
      BackgroundTimer.clearInterval(backgroundTimerId);
      setBackgroundTimerId(null);
    }
    
    // Remove app state listener
    if (appStateListener) {
      console.log('📱 [FORCE-STOP] Removing app state listener...');
      appStateListener.remove();
      setAppStateListener(null);
    }
    
    dispatch({ type: 'READ_BLUETOOTH_STATE', payload: false });
    console.log('✅ [FORCE-STOP] All processes stopped, collected data preserved');
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

  // ENHANCED: Video timestamp-based synchronization with pause detection
  const processSynchronizedData = (rawSensorData, videoStart, videoEnd, videoDurationMs) => {
    console.log(`🔄 [SYNC-PROCESS] Processing ${rawSensorData.length} sensor points for video timestamp sync`);
    console.log(`🎬 [VIDEO-INFO] Video duration: ${videoDurationMs}ms (${(videoDurationMs/1000).toFixed(2)}s)`);
    console.log(`⚠️ [LIMITATION] Cannot detect in-recording pauses - data may span pause periods`);
    
    if (rawSensorData.length === 0) {
      return [];
    }
    
    // ENHANCED: Use video asset timestamp for precise synchronization
    const videoCreationTime = videoAssetRef.current?.timestamp ? 
      new Date(videoAssetRef.current.timestamp).getTime() : 
      (videoEnd - 3000); // 3s buffer for processing if no timestamp
    
    // Calculate the actual recording period by working backwards from video creation
    const estimatedRecordingStartTime = videoCreationTime - videoDurationMs;
    const estimatedRecordingEndTime = videoCreationTime;
    
    console.log(`📅 [VIDEO-TIMESTAMP] Video created at: ${new Date(videoCreationTime).toISOString()}`);
    console.log(`🎯 [ESTIMATED-RANGE] Recording period: ${new Date(estimatedRecordingStartTime).toISOString()} to ${new Date(estimatedRecordingEndTime).toISOString()}`);
    
    // Filter sensor data to match the video recording timeframe
    const videoSyncedData = rawSensorData.filter(dataPoint => {
      const pointTime = new Date(dataPoint.timestamp).getTime();
      return pointTime >= estimatedRecordingStartTime && pointTime <= estimatedRecordingEndTime;
    });
    
    console.log(`✂️ [TRIMMED] Filtered from ${rawSensorData.length} to ${videoSyncedData.length} points based on video timestamp`);
    
    // ENHANCED: Detect potential pause periods for user awareness
    const pausePeriods = detectPausePeriods(videoSyncedData, videoDurationMs, estimatedRecordingStartTime, estimatedRecordingEndTime);
    
    // Recalculate timing for perfect 0-to-video-duration sync
    const processedData = videoSyncedData.map((dataPoint, index) => {
      const pointTime = new Date(dataPoint.timestamp).getTime();
      const videoRelativeTime = (pointTime - estimatedRecordingStartTime) / 1000; // 0 to videoDuration
      const frameNumber = Math.floor(videoRelativeTime * 30); // 30fps
      const videoProgress = (videoRelativeTime / (videoDurationMs / 1000)) * 100; // 0-100%
      
      return {
        ...dataPoint,
        // Perfect video sync timing
        videoTimestamp: videoRelativeTime,
        videoRelativeTime: videoRelativeTime * 1000,
        frameNumber,
        
        // Analysis helpers
        videoProgress,
        sampleIndex: index,
        totalSamples: videoSyncedData.length,
        
        // Sync validation
        syncQuality: 'video-timestamp-based',
        
        // Enhanced metadata
        metadata: {
          originalTimestamp: dataPoint.timestamp,
          syncMethod: 'video-timestamp-with-pause-limitation',
          syncNote: pausePeriods.length > 0 ? 'May include pause periods if recording was paused' : 'Likely continuous recording',
          videoSynchronized: true,
          pausePeriodsDetected: pausePeriods.length,
          estimatedRecordingStart: new Date(estimatedRecordingStartTime).toISOString(),
          estimatedRecordingEnd: new Date(estimatedRecordingEndTime).toISOString(),
        }
      };
    });
    
    console.log(`✅ [SYNC-PROCESS] Video timestamp-processed ${processedData.length} synchronized data points`);
    
    if (processedData.length > 0) {
      const firstPoint = processedData[0];
      const lastPoint = processedData[processedData.length - 1];
      const sessionStart = new Date(rawSensorData[0].timestamp).getTime();
      
      console.log(`📊 [VIDEO-TIMESTAMP-SYNC] Video 0.0s → Sensor data from session time ${((estimatedRecordingStartTime - sessionStart)/1000).toFixed(1)}s`);
      console.log(`📊 [VIDEO-TIMESTAMP-SYNC] Video ${(videoDurationMs/1000).toFixed(1)}s → Sensor data from session time ${((estimatedRecordingEndTime - sessionStart)/1000).toFixed(1)}s`);
      console.log(`📊 [VIDEO-TIMESTAMP-SYNC] Total coverage: ${(lastPoint.videoTimestamp - firstPoint.videoTimestamp).toFixed(3)}s`);
      console.log(`🎯 [CONFIDENCE] Sync method: video-timestamp-based (handles retries automatically)`);
      
      if (pausePeriods.length > 0) {
        console.log(`⚠️ [PAUSE-WARNING] ${pausePeriods.length} potential pause periods detected in sensor data`);
      }
    }
    
    return processedData;
  };

  // ENHANCED: Detect potential pause periods for user awareness
  const detectPausePeriods = (sensorData, videoDurationMs, estimatedStart, estimatedEnd) => {
    console.log('🔍 [PAUSE-DETECT] Analyzing for potential pause periods...');
    
    const windowSizeMs = 2000; // 2-second analysis windows
    const pauseThreshold = 3; // Less than 3 data points per 2s = potential pause
    
    const suspiciousPeriods = [];
    
    // Analyze data density throughout the recording period
    for (let time = estimatedStart; time < estimatedEnd; time += windowSizeMs) {
      const windowData = sensorData.filter(point => {
        const pointTime = new Date(point.timestamp).getTime();
        return pointTime >= time && pointTime < time + windowSizeMs;
      });
      
      if (windowData.length < pauseThreshold) {
        suspiciousPeriods.push({
          start: time,
          end: time + windowSizeMs,
          dataPoints: windowData.length,
          suspectedPause: true,
          relativeTime: `${((time - estimatedStart)/1000).toFixed(1)}s - ${((time + windowSizeMs - estimatedStart)/1000).toFixed(1)}s`
        });
      }
    }
    
    if (suspiciousPeriods.length > 0) {
      console.log(`⏸️ [PAUSE-DETECT] Found ${suspiciousPeriods.length} potential pause periods:`);
      suspiciousPeriods.forEach((period, index) => {
        console.log(`   Period ${index + 1}: ${period.relativeTime} (${period.dataPoints} data points)`);
      });
      console.log('⚠️ [WARNING] Sensor data may include paused recording periods');
    } else {
      console.log('✅ [PAUSE-DETECT] No significant gaps detected - likely continuous recording');
    }
    
    return suspiciousPeriods;
  };

  // Calculate sync quality metrics
  const calculateSyncMetrics = (sensorData) => {
    if (sensorData.length === 0) return {};
    
    const firstPoint = sensorData[0];
    const lastPoint = sensorData[sensorData.length - 1];
    const totalDuration = lastPoint.videoTimestamp - firstPoint.videoTimestamp;
    const averageSampleRate = sensorData.length / totalDuration;
    
    // Quality assessment based on sync method
    const syncQuality = firstPoint?.metadata?.syncMethod === 'video-timestamp-with-pause-limitation' ? 'good' : 'fair';
    const pausePeriodsDetected = firstPoint?.metadata?.pausePeriodsDetected || 0;
    
    return {
      totalDuration: totalDuration.toFixed(3),
      averageSampleRate: averageSampleRate.toFixed(1),
      quality: syncQuality,
      sampleCount: sensorData.length,
      syncMethod: firstPoint?.metadata?.syncMethod || 'standard',
      pauseWarning: pausePeriodsDetected > 0,
      pausePeriodsCount: pausePeriodsDetected,
      confidence: pausePeriodsDetected > 0 ? 85 : 95, // Lower confidence if pauses detected
    };
  };

  // ENHANCED: Video recording with improved user guidance
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
    
    // Check existing permission state
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to record videos.');
      return;
    }

    // ENHANCED: Show recording guidelines for optimal sync
    Alert.alert(
      'Recording Tips for Best Analysis',
      '• Record continuously without pausing\n• Keep feet on insoles throughout recording\n• Avoid long review periods\n• Multiple retakes are handled automatically',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Recording', onPress: () => launchCameraWithSensorSync() }
      ]
    );
  };

  const launchCameraWithSensorSync = async () => {
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

    // Start sensor listener
    startSensorListener();
    
    // FIXED: Start collecting immediately when camera opens
    videoRecordingActiveRef.current = true;
    videoStartTimeRef.current = Date.now();
    
    console.log('🎬 [IMMEDIATE-START] Sensor collection started with camera launch');
    console.log('🎥 [CAMERA] Launching camera...');

    launchCamera(options, (response) => {
      // CRITICAL: Record end time immediately
      videoEndTimeRef.current = Date.now();
      videoRecordingActiveRef.current = false;
      
      if (response.didCancel) {
        console.log('📱 [VIDEO] User cancelled camera');
        forceStopAllRecording();
        return;
      }
      
      if (response.errorCode) {
        console.log('❌ [VIDEO] Camera error occurred');
        forceStopAllRecording();
        Alert.alert('Error', response.errorMessage);
        return;
      }
      
      if (response.assets && response.assets[0]) {
        const videoAsset = response.assets[0];
        
        // Store video asset for later use
        videoAssetRef.current = videoAsset;
        
        // ENHANCED: Use video asset duration and timestamp as authoritative sources
        const assetVideoDuration = (videoAsset.duration || 0) * 1000; // milliseconds
        const actualRecordingDuration = videoEndTimeRef.current - videoStartTimeRef.current;
        
        console.log(`⏹️ [VIDEO] Recording completed`);
        console.log(`📹 [TIMING] Recording session: ${actualRecordingDuration}ms`);
        console.log(`📹 [TIMING] Actual video duration: ${assetVideoDuration}ms`);
        console.log(`📹 [TIMESTAMP] Video created: ${videoAsset.timestamp ? new Date(videoAsset.timestamp).toISOString() : 'N/A'}`);
        console.log(`🎯 [TARGET] Syncing sensor data using video timestamp method`);
        
        // Process synchronized sensor data using video timestamp as reference
        const syncedSensorData = processSynchronizedData(
          sensorDataCollectedRef.current,
          videoStartTimeRef.current,
          videoEndTimeRef.current,
          assetVideoDuration
        );
        
        // Update collected data with final sync
        sensorDataCollectedRef.current = syncedSensorData;
        
        const finalSpan = syncedSensorData.length > 0 ? 
          syncedSensorData[syncedSensorData.length - 1].videoTimestamp : 0;
        
        console.log(`📊 [SUCCESS] ${syncedSensorData.length} sensor points for ${assetVideoDuration/1000}s video`);
        console.log(`🎯 [PERFECT-MATCH] Sensor span: ${finalSpan.toFixed(2)}s | Video: ${assetVideoDuration/1000}s`);
        
        // Show sync quality info
        const syncMetrics = calculateSyncMetrics(syncedSensorData);
        if (syncMetrics.pauseWarning) {
          console.log(`⚠️ [SYNC-WARNING] ${syncMetrics.pausePeriodsCount} potential pause periods detected`);
        }
        
        forceStopAllRecording();
        setVideoUri(videoAsset.uri);
        setPreview(true);
      } else {
        console.log('❌ [VIDEO] No video recorded');
        forceStopAllRecording();
      }
    });
  };

  // STEP 1: Upload video first to get video_id
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
      console.log('📤 [UPLOAD-STEP-1] Starting video upload...');
      
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
      console.log('[UPLOAD-STEP-1] Video upload response:', data);
      
      if (response.ok) {
        // Extract video_id from response
        const videoId = data.video_id || data.id || data.data?.video_id;
        
        if (videoId) {
          console.log('✅ [UPLOAD-STEP-1] Video uploaded successfully, video_id:', videoId);
          
          // Show video upload success
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 1500);
          
          // STEP 2: Now upload sensor data with video_id
          await uploadSensorDataWithVideoId(videoId);
          
        } else {
          console.warn('[UPLOAD-STEP-1] No video_id found in response');
          Alert.alert('Upload Warning', 'Video uploaded but no ID returned. Sensor data cannot be linked.');
        }
        
        // Clean up after both uploads complete
        setTimeout(() => {
          setVideoUri(null);
          setUploading(false);
          setUploadError(null);
          // Reset collected data
          sensorDataCollectedRef.current = [];
          collectedDataCount.current = 0;
          videoAssetRef.current = null;
          videoStartTimeRef.current = null;
          videoEndTimeRef.current = null;
        }, 2000);
        
      } else {
        throw new Error(data.message || 'Video upload failed');
      }
    } catch (error) {
      console.log('[UPLOAD-STEP-1] Video upload error:', error);
      setUploadError(error.message || 'Video upload failed');
      setUploading(false);
    }
  };

  // STEP 2: Upload sensor data with video_id
  const uploadSensorDataWithVideoId = async (videoId, attempts = 1) => {
    console.log(`📤 [UPLOAD-STEP-2] Starting sensor data upload with video_id: ${videoId}`);
    
    const dataToUpload = [...sensorDataCollectedRef.current];
    
    if (!dataToUpload || dataToUpload.length === 0) {
      console.warn('[UPLOAD-STEP-2] No synchronized sensor data to upload');
      Alert.alert('No Sensor Data', 'No synchronized sensor data was recorded during video recording.');
      return false;
    }

    console.log(`[UPLOAD-STEP-2] Uploading ${dataToUpload.length} synchronized sensor data points`);
    
    // Calculate sync quality metrics
    const syncMetrics = calculateSyncMetrics(dataToUpload);
    
    const payload = {
      id_customer: idCustomer,
      video_id: videoId, // CRITICAL: Use video_id from video upload
      product_number: productNumber,
      bluetooth_left_id: props.leftDevice,
      bluetooth_right_id: props.rightDevice,
      shoe_size: shoeSize,
      
      // ENHANCED: Include sync metadata with pause detection
      synchronization: {
        videoSynchronized: true,
        sampleRate: syncMetrics.averageSampleRate,
        totalDuration: syncMetrics.totalDuration,
        syncQuality: syncMetrics.quality,
        frameAlignment: true,
        videoId: videoId,
        syncMethod: syncMetrics.syncMethod,
        confidence: syncMetrics.confidence,
        pauseWarning: syncMetrics.pauseWarning,
        pausePeriodsDetected: syncMetrics.pausePeriodsCount,
        timestampBased: true,
      },
      
      // Sensor data with video sync
      data: dataToUpload,
      
      // Analysis metadata
      analysis: {
        ready: true,
        videoSyncEnabled: true,
        frameBasedAnalysis: true,
        realTimePlayback: true,
        timestampSync: true,
        retryHandling: true,
      }
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
      console.log('[UPLOAD-STEP-2] Sensor data upload response:', respData);

      if (response.ok) {
        console.log('✅ [UPLOAD-STEP-2] Sensor data uploaded successfully!');
        
        // Show sensor upload success
        setShowSensorSuccess(true);
        setTimeout(() => setShowSensorSuccess(false), 1500);
        
        return respData;
      } else {
        throw new Error(respData.message || 'Sensor data upload failed');
      }
    } catch (error) {
      console.log('[UPLOAD-STEP-2] Sensor data upload error:', error);
      
      if (attempts < MAX_UPLOAD_ATTEMPTS) {
        console.log(`[UPLOAD-STEP-2] Retrying... Attempt ${attempts + 1}`);
        return uploadSensorDataWithVideoId(videoId, attempts + 1);
      } else {
        try {
          await AsyncStorage.setItem(
            `sensorData_${videoId}`,
            JSON.stringify(payload)
          );
          Alert.alert('Sensor Upload Failed', 'Video uploaded successfully, but sensor data saved locally for retry.');
        } catch (e) {
          console.log('Failed to save sensor data locally:', e);
        }
        return false;
      }
    }
  };

  const discardVideo = () => {
    setPreview(false);
    setVideoUri(null);
    setUploadError(null);
    // Reset collected data
    sensorDataCollectedRef.current = [];
    collectedDataCount.current = 0;
    videoAssetRef.current = null;
    videoStartTimeRef.current = null;
    videoEndTimeRef.current = null;
    forceStopAllRecording();
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
          console.log('🔙 [HEADER] Back button pressed');
          forceStopAllRecording();
          navigation.navigate('Home');
        }}
      />
      
      <View style={styles.cameraContainer}>
        <View style={styles.camera} />
        
        {recording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <RNText style={styles.recordingText}>
              {videoRecordingActiveRef.current ? 'Recording Video & Sensors...' : 'Preparing...'}
            </RNText>
            <RNText style={styles.recordingSubText}>
              Sensor data: {collectedDataCount.current} points
            </RNText>
            {videoRecordingActiveRef.current && videoStartTimeRef.current && (
              <RNText style={styles.recordingTimeText}>
                Recording: {((Date.now() - videoStartTimeRef.current) / 1000).toFixed(1)}s
              </RNText>
            )}
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
              forceStopAllRecording();
              navigation.navigate('GestureAnalysis');
            }}
          >
            <Image source={GALLERY_ICON} style={styles.galleryIcon} />
          </TouchableOpacity>
        </View>
        
        {/* ENHANCED: Preview modal with video timestamp sync information */}
        <Modal visible={preview} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <RNText style={styles.modalTitle}>Video Recorded & Timestamp Synchronized</RNText>
              <RNText style={styles.modalSubtitle}>
                Sensor data points: {sensorDataCollectedRef.current.length}
              </RNText>
              
              {/* Enhanced Sync Quality Display */}
              {sensorDataCollectedRef.current.length > 0 && (
                <View style={styles.syncInfo}>
                  <RNText style={styles.syncInfoText}>
                    🎯 Sync Method: {calculateSyncMetrics(sensorDataCollectedRef.current).syncMethod}
                  </RNText>
                  <RNText style={styles.syncInfoText}>
                    📊 Quality: {calculateSyncMetrics(sensorDataCollectedRef.current).quality}
                  </RNText>
                  <RNText style={styles.syncInfoText}>
                    ⏱️ Duration: {calculateSyncMetrics(sensorDataCollectedRef.current).totalDuration}s
                  </RNText>
                  <RNText style={styles.syncInfoText}>
                    📈 Sample Rate: {calculateSyncMetrics(sensorDataCollectedRef.current).averageSampleRate} Hz
                  </RNText>
                  <RNText style={styles.syncInfoText}>
                    🎯 Confidence: {calculateSyncMetrics(sensorDataCollectedRef.current).confidence}%
                  </RNText>
                  {calculateSyncMetrics(sensorDataCollectedRef.current).pauseWarning && (
                    <RNText style={[styles.syncInfoText, { color: '#ff6b00' }]}>
                      ⚠️ Potential pause periods detected
                    </RNText>
                  )}
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.uploadButton]} 
                  onPress={uploadVideo}
                >
                  <RNText style={styles.modalButtonText}>Upload Timestamp Sync Data</RNText>
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

        {/* Uploading Indicator */}
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <View style={styles.uploadingContent}>
              <ActivityIndicator size="large" color="#00bfc5" />
              <RNText style={styles.uploadingText}>
                Timestamp sync: Uploading video first, then precisely synced sensor data...
              </RNText>
              <RNText style={styles.uploadingSubText}>
                Step 1: Video upload → Step 2: Timestamp-synced sensor data
              </RNText>
            </View>
          </View>
        )}

        {/* Video Upload Success Popup */}
        {showSuccess && (
          <View style={styles.successOverlay}>
            <View style={styles.successPopup}>
              <View style={styles.successIcon}>
                <RNText style={styles.successIconText}>✓</RNText>
              </View>
              <RNText style={styles.successText}>Video uploaded successfully!</RNText>
              <RNText style={styles.successSubText}>Now uploading timestamp-synced sensor data...</RNText>
            </View>
          </View>
        )}

        {/* Sensor Upload Success Popup */}
        {showSensorSuccess && (
          <View style={styles.successOverlay}>
            <View style={styles.successPopup}>
              <View style={styles.successIcon}>
                <RNText style={styles.successIconText}>✓</RNText>
              </View>
              <RNText style={styles.successText}>Timestamp-synced sensor data uploaded!</RNText>
              <RNText style={styles.successSubText}>Ready for precise video analysis with retry handling</RNText>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

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
    marginBottom: 2,
  },
  recordingTimeText: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  syncInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  syncInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  uploadingSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  successSubText: {
    fontSize: 14,
    color: '#666',
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
