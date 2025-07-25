import React, { useState, useEffect, useRef } from 'react'; // Added useRef to imports
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
// import FabChatbot from '../../common/FabChatbot';
const GALLERY_ICON = require('../../../assets/image/gesture_analysis/gallery.png');

const { width, height } = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const MAX_UPLOAD_ATTEMPTS = 3;

const Gesture = (props) => {
  const navigation = props.navigation || useNavigation();
  const dispatch = useDispatch();
  const [videoUri, setVideoUri] = useState(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSensorSuccess, setShowSensorSuccess] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [videoPath, setVideoPath] = useState(null);
  const [shoeSize, setShoeSize] = useState(42);
  const [sensorDataArray, setSensorDataArray] = useState([]);
  const [recording, setRecording] = useState(false);
  const recordingRef = useRef(false); // Use ref to avoid closure issues
  const [bleListener, setBleListener] = useState(null);
  const [recordStartTime, setRecordStartTime] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [backgroundTimerId, setBackgroundTimerId] = useState(null);
  const [appStateListener, setAppStateListener] = useState(null);
  let lastTimestamp = useRef(null);
  const productNumber = useSelector ? useSelector(state => state.productNumber) : null;
  const user = useSelector ? useSelector(state => state.user) : null;
  const [token, setToken] = useState(props.token);
  const [idMember, setIdMember] = useState(props.id_member);
  const idCustomer = user?.id_customer || props.id_member;

  useEffect(() => {
    // Fallback: get token and id_member from AsyncStorage if missing
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

  useEffect(() => {
    requestCameraPermission();
    // Hardware back handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Home');
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clean up all background processes when component unmounts
      console.log('🧹 [CLEANUP] Gesture component unmounting, cleaning up background processes...');
      stopBackgroundSensorRecording();
    };
  }, []);

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
        // For iOS, react-native-image-picker handles permissions automatically
        setHasPermission(true);
      }
    } catch (err) {
      console.warn(err);
      setHasPermission(false);
    }
  };

  const recordVideo = async () => {
    if (!props.leftDevice || !props.rightDevice) {
      Alert.alert('Warning!', 'Please check your Bluetooth connection and add both devices.', [
        {
          text: 'OK',
          onPress: () => {
            if (navigation && navigation.navigate) {
              navigation.navigate('Device', {
                name: props.lang ? LangHome.addDeviceButton.thai : LangHome.addDeviceButton.eng,
              });
            }
          },
        },
      ]);
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (hasPermission === null) {
      Alert.alert('Permission Required', [
        'Camera permission is required to record videos.',
        'Please grant permission in settings.',
      ]);
      return;
    }
    if (hasPermission === false) {
      Alert.alert('Permission Required', 'Camera permission is required to record videos. Please grant permission in settings.');
      return;
    }

    // Pre-connect BLE devices BEFORE opening camera to avoid missing initial sensor data
    console.log('🔌 [PRE-CONNECT] Ensuring BLE connection before camera launch...');
    await ensureBLEConnection();

    // Wait a moment for BLE to stabilize
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

    // Note: We'll start sensor recording when camera opens, but only process data when recording=true
    // This ensures BLE listeners are active but data collection is controlled
    console.log('🔄 [FLOW] About to call startSensorRecording()...');
    startSensorRecording();
    console.log('🔄 [FLOW] startSensorRecording() called successfully');
    const cameraOpenTime = Date.now();
    console.log('🎥 [CAMERA] Camera launched, waiting for user to start recording...');
    // Note: recording state is already set to true in startBackgroundSensorRecording()

    launchCamera(options, (response) => {
      const cameraCloseTime = Date.now();

      if (response.didCancel) {
        // User cancelled - stop recording immediately
        stopSensorRecording();
        return;
      }
      if (response.errorCode) {
        // Error occurred - stop recording
        stopSensorRecording();
        Alert.alert('Error', response.errorMessage);
        return;
      }
      if (response.assets && response.assets[0]) {
        const videoAsset = response.assets[0];
        const videoDuration = videoAsset.duration || 0; // Video duration in seconds
        const videoTimestamp = videoAsset.timestamp || cameraCloseTime;

        // Use camera open/close times for more accurate filtering
        // Video recording happens between camera open and close
        const videoStartTime = cameraOpenTime;
        const videoEndTime = cameraCloseTime;

        console.log(`📅 [TIMING] Camera open: ${new Date(cameraOpenTime).toISOString()}`);
        console.log(`📅 [TIMING] Camera close: ${new Date(cameraCloseTime).toISOString()}`);
        console.log(`📅 [TIMING] Video asset timestamp: ${new Date(videoTimestamp).toISOString()}`);
        console.log(`📅 [TIMING] Video duration: ${videoDuration}s`);

        // Filter sensor data to match video recording timeframe
        const filteredSensorData = filterSensorDataByVideoTiming(
          sensorDataArray,
          videoStartTime,
          videoEndTime
        );

        // Update sensor data array with filtered data
        setSensorDataArray(filteredSensorData);

        // Stop sensor recording after processing
        stopSensorRecording();

        setVideoUri(videoAsset.uri);
        setPreview(true);

        console.log(`Video duration: ${videoDuration}s, Sensor data points: ${filteredSensorData.length}`);
      } else {
        // No video recorded - stop sensor recording
        stopSensorRecording();
      }
    });
  };

  const uploadVideo = async () => {
    if (!videoUri) {
      console.log('[uploadVideo] No videoUri:', videoUri);
      Alert.alert('Error', 'No video to upload');
      return;
    }
    // Use fallback token/id_member if props missing
    console.log('[uploadVideo] props.token:', props.token);
    console.log('[uploadVideo] token (state):', token);
    console.log('[uploadVideo] props.id_member:', props.id_member);
    console.log('[uploadVideo] idMember (state):', idMember);
    console.log('[uploadVideo] user:', user);
    const authToken = props.token || token;
    // Try user.id_member, user.id_customer, then idMember (from AsyncStorage)
    const authIdMember = (user && (user.id_member || user.id_customer)) || idMember;
    console.log('[uploadVideo] authToken:', authToken);
    console.log('[uploadVideo] authIdMember:', authIdMember);
    if (!authToken || !authIdMember) {
      console.log('[uploadVideo] Authentication data missing!');
      Alert.alert('Error', 'Authentication data missing');
      return;
    }
    setUploading(true);
    setUploadError(null);
    setPreview(false); // Close the preview modal
    try {
      const formData = new FormData();
      formData.append('id_member', authIdMember);
      formData.append('video_file', {
        uri: Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri,
        type: 'video/mp4',
        name: 'gesture_video.mp4',
      });
      console.log('[uploadVideo] formData:', formData);
      const response = await fetch('https://api1.suratec.co.th/api/video/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        body: formData,
      });
      console.log('[uploadVideo] response status:', response.status);
      const data = await response.json();
      console.log('[uploadVideo] response data:', data);
      if (response.ok) {
        setShowSuccess(true);
        // Upload sensor data after video upload
        const vid = data.video_id || data.id || data.data?.video_id || null;
        console.log('[uploadVideo] video_id for sensor upload:', vid);
        if (vid) {
          handleAfterVideoUpload(vid);
        } else {
          console.warn('[uploadVideo] No video_id found in response, sensor data not uploaded');
        }
        setTimeout(() => {
          setShowSuccess(false);
          setVideoUri(null);
          setUploading(false);
          setUploadError(null);
        }, 2000);
      } else {
        setUploadError(data.message || 'Upload failed');
        setUploading(false);
      }
    } catch (error) {
      console.log('[uploadVideo] error:', error);
      setUploadError(error.message || 'Upload failed');
      setUploading(false);
    }
  };

  const discardVideo = () => {
    setPreview(false);
    setVideoUri(null);
    setUploadError(null);
  };

  // Enhanced background sensor recording with BackgroundTimer and AppState
  const startBackgroundSensorRecording = async () => {
    console.log('🚀 [START] Starting background sensor recording...');

    // CRITICAL: Stop any existing recording session first
    await stopBackgroundSensorRecording();

    // Reset state and start fresh
    setSensorDataArray([]);
    setRecording(true);
    recordingRef.current = true; // Update ref immediately
    console.log('🔴 [RECORDING] Recording state set to TRUE - sensor data collection active');
    setRecordStartTime(Date.now());
    lastTimestamp.current = Date.now();

    // Check and reconnect BLE devices before starting
    await ensureBLEConnection();

    // Method 1: Standard BLE listener
    const listener = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral }) => {
        // Debug: Log data reception with recording state (reduced frequency)
        if (Math.random() < 0.005) { // 0.5% chance
          console.log(`📡 [BLE] Data from ${peripheral}, recording: ${recordingRef.current}`);
        }
        processSensorData(value, peripheral);
      }
    );
    setBleListener(listener);
    console.log('🎯 [LISTENER] BLE listener set up successfully');

    // Method 2: Background Timer for periodic connection checks (not continuous logging)
    const timerId = BackgroundTimer.setInterval(() => {
      // Keep background process alive and check BLE connection
      if (recording) {
        checkBLEConnection();
      }
    }, 5000); // Check every 5 seconds (reduced frequency)
    setBackgroundTimerId(timerId);

    // Method 3: App State listener to handle background/foreground transitions
    const handleAppStateChange = (nextAppState) => {
      setAppState(nextAppState);
      if (nextAppState === 'background') {
        console.log('App going to background, maintaining sensor recording');
        // Ensure background timer continues
      } else if (nextAppState === 'active') {
        console.log('App returning to foreground, sensor recording active');
        // Re-establish any dropped connections
        if (recording) {
          checkBLEConnection();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    setAppStateListener(subscription);

    dispatch({ type: 'READ_BLUETOOTH_STATE', payload: true });
    console.log('Background sensor recording started with BackgroundTimer');
  };

  const processSensorData = (value, peripheral) => {
    // Only process data if we're actively recording (use ref to avoid closure issues)
    if (!recordingRef.current) {
      return; // Reduced logging - no spam when not recording
    }

    // Debug: Log when we actually process data
    if (Math.random() < 0.02) { // 2% chance
      console.log(`✅ [PROCESS] Processing sensor data from ${peripheral}`);
    }

    const now = Date.now();
    const duration = now - (lastTimestamp.current || now);
    lastTimestamp.current = now;
    let sensorArr = toDecimalArray(value);

    // Debug: Check if sensor data is actually non-zero
    const hasNonZeroData = sensorArr.some(val => val > 0);
    if (!hasNonZeroData && Math.random() < 0.01) { // Log 1% of zero-data cases
      console.log(`⚠️ [DATA] Received all-zero sensor data from ${peripheral}:`, sensorArr);
    }

    let left = null, right = null;

    if (peripheral === props.leftDevice) {
      left = { sensor: sensorArr };
    } else if (peripheral === props.rightDevice) {
      right = { sensor: sensorArr };
    }

    setSensorDataArray(prev => {
      const last = prev[prev.length - 1] || {};
      const newData = {
        duration,
        timestamp: new Date(now).toISOString(),
        left: left ? left : last.left || { sensor: [0, 0, 0, 0, 0] },
        right: right ? right : last.right || { sensor: [0, 0, 0, 0, 0] },
      };
      dispatch({ type: 'ADD_BLUETOOTH_DATA', payload: newData });
      const newArray = [...prev, newData];

      // Debug logging every 100 data points to track collection (only during recording)
      if (newArray.length % 100 === 0) {
        console.log(`📈 [RECORDING] Collected ${newArray.length} sensor data points during video recording`);
      }

      return newArray;
    });
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

      // Final check
      const finalConnectedDevices = await BleManager.getConnectedPeripherals([]);
      const finalLeftConnected = finalConnectedDevices.some(device => device.id === props.leftDevice);
      const finalRightConnected = finalConnectedDevices.some(device => device.id === props.rightDevice);

      if (!finalLeftConnected || !finalRightConnected) {
        console.log('⚠️ [BLE] Warning: Not all devices connected. Sensor data may be incomplete.');
        Alert.alert('BLE Connection Warning', 'Some sensors are not connected. Sensor data may be incomplete.');
      } else {
        console.log('🎉 [BLE] All devices connected and ready for sensor recording!');
      }

    } catch (error) {
      console.log('❌ [BLE] Error ensuring BLE connection:', error);
    }
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

  // Function to filter sensor data to match video recording timeframe
  const filterSensorDataByVideoTiming = (sensorData, videoStartTime, videoEndTime) => {
    console.log(`🔍 [FILTER] Total sensor data points before filtering: ${sensorData.length}`);
    console.log(`🔍 [FILTER] Video start: ${new Date(videoStartTime).toISOString()}`);
    console.log(`🔍 [FILTER] Video end: ${new Date(videoEndTime).toISOString()}`);

    // Debug: Show first and last sensor data timestamps
    if (sensorData.length > 0) {
      const firstDataTime = new Date(sensorData[0].timestamp).getTime();
      const lastDataTime = new Date(sensorData[sensorData.length - 1].timestamp).getTime();
      console.log(`🔍 [FILTER] First sensor data: ${new Date(firstDataTime).toISOString()}`);
      console.log(`🔍 [FILTER] Last sensor data: ${new Date(lastDataTime).toISOString()}`);
      console.log(`🔍 [FILTER] Sensor data timespan: ${(lastDataTime - firstDataTime) / 1000}s`);
    }

    const filteredData = sensorData.filter(dataPoint => {
      const dataTimestamp = new Date(dataPoint.timestamp).getTime();
      const isInRange = dataTimestamp >= videoStartTime && dataTimestamp <= videoEndTime;

      // Debug: Log why data points are being filtered out
      if (!isInRange && sensorData.indexOf(dataPoint) < 5) {
        console.log(`❌ [FILTER] Data point ${sensorData.indexOf(dataPoint)} excluded: ${new Date(dataTimestamp).toISOString()} (${isInRange ? 'in' : 'out of'} range)`);
      }

      return isInRange;
    });

    // Add relative timestamps for easier analysis
    const dataWithRelativeTime = filteredData.map(dataPoint => {
      const dataTimestamp = new Date(dataPoint.timestamp).getTime();
      const relativeTime = (dataTimestamp - videoStartTime) / 1000; // Convert to seconds
      return {
        ...dataPoint,
        relativeTime: relativeTime.toFixed(3), // Relative time in seconds from video start
        videoTimestamp: dataTimestamp
      };
    });

    console.log(`✅ [FILTER] Filtered ${dataWithRelativeTime.length} sensor data points matching video duration`);
    return dataWithRelativeTime;
  };

  const stopBackgroundSensorRecording = () => {
    // Prevent recursive calls
    if (!recording && !bleListener && !backgroundTimerId && !appStateListener) {
      return; // Already stopped
    }

    console.log('⏹️ [STOP] Stopping background sensor recording...');

    // Stop BLE listener
    if (bleListener) {
      bleListener.remove();
      setBleListener(null);
    }

    // Stop background timer
    if (backgroundTimerId) {
      BackgroundTimer.clearInterval(backgroundTimerId);
      setBackgroundTimerId(null);
    }

    // Stop AppState listener
    if (appStateListener) {
      appStateListener.remove();
      setAppStateListener(null);
    }

    setRecording(false);
    recordingRef.current = false; // Update ref immediately
    dispatch({ type: 'READ_BLUETOOTH_STATE', payload: false });
    console.log('✅ [STOP] Background sensor recording stopped');
  };

  // Legacy function name aliases for compatibility (defined after actual functions)
  const startSensorRecording = startBackgroundSensorRecording;
  const stopSensorRecording = stopBackgroundSensorRecording;

  function toDecimalArray(byteArray) {
    // Debug: Log raw BLE data occasionally to check if we're receiving actual sensor values
    if (Math.random() < 0.005) { // Log ~0.5% of raw data
      console.log(`🔍 [RAW] Raw BLE data (${byteArray.length} bytes):`, byteArray);
    }

    // Handle different BLE packet formats
    let dec = [];

    if (byteArray.length >= 17) {
      // 17-byte format: most data is zeros, meaningful data in last few bytes
      // Extract individual meaningful bytes as separate sensor values
      const lastByte = byteArray[byteArray.length - 1]; // Last byte (57, 12, 13, etc.)
      const secondLastByte = byteArray[byteArray.length - 2] || 0;
      const thirdLastByte = byteArray[byteArray.length - 3] || 0;

      // Look for any non-zero bytes in the packet
      const nonZeroBytes = byteArray.filter(byte => byte > 0);

      if (nonZeroBytes.length > 0) {
        // Use the non-zero bytes as sensor values
        dec = nonZeroBytes.slice(0, 5);
      } else {
        // Fallback to last few bytes
        dec = [lastByte, secondLastByte, thirdLastByte, 0, 0];
      }
    } else {
      // Original format: process pairs of bytes
      for (let i = 0; i < byteArray.length - 1; i += 2) {
        dec.push(byteArray[i] * 256 + byteArray[i + 1]);
      }
    }

    const result = dec.slice(0, 5); // Ensure we return exactly 5 values

    // Pad with zeros if needed
    while (result.length < 5) {
      result.push(0);
    }

    // Debug: Log processed data if it contains non-zero values
    const hasNonZero = result.some(val => val > 0);
    if (hasNonZero && Math.random() < 0.01) { // Log 1% of non-zero processed data
      console.log(`✅ [PROCESSED] Non-zero sensor values:`, result);
    }

    return result;
  }

  const uploadSensorData = async ({ video_id, attempts = 1 }) => {
    if (!sensorDataArray || sensorDataArray.length === 0) {
      Alert.alert('No Sensor Data', 'No sensor data was recorded. Please ensure sensors are connected and try again.');
      console.warn('[uploadSensorData] No sensor data to upload for video_id:', video_id);
      return false;
    }

    // Log what sensor data we're sending to backend
    console.log(`[uploadSensorData] Sending ${sensorDataArray.length} sensor data points to backend`);
    console.log('[uploadSensorData] First data point:', sensorDataArray[0]);
    console.log('[uploadSensorData] Last data point:', sensorDataArray[sensorDataArray.length - 1]);

    const payload = {
      id_customer: idCustomer,
      video_id,
      product_number: productNumber,
      bluetooth_left_id: props.leftDevice,
      bluetooth_right_id: props.rightDevice,
      shoe_size: shoeSize,
      data: sensorDataArray, // This should now be the filtered data
    };
    console.log('[uploadSensorData] payload data length:', payload.data.length);
    try {
      const response = await fetch('https://api1.suratec.co.th/surasole-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('[uploadSensorData] response status:', response.status);
      const respData = await response.json();
      console.log('[uploadSensorData] response data:', respData);
      if (response.ok) {
        return respData;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.log('[uploadSensorData] error:', error);
      if (attempts < MAX_UPLOAD_ATTEMPTS) {
        return uploadSensorData({ video_id, attempts: attempts + 1 });
      } else {
        try {
          await AsyncStorage.setItem(
            `sensorData_${video_id}`,
            JSON.stringify(payload)
          );
          Alert.alert('Upload Failed', 'Sensor data could not be uploaded. It has been saved locally. Please retry later.');
        } catch (e) { }
        return false;
      }
    }
  };

  const handleAfterVideoUpload = async (vid) => {
    stopSensorRecording();
    const sensorResult = await uploadSensorData({ video_id: vid });
    if (sensorResult && sensorResult.status === 'success') {
      setShowSensorSuccess(true);
      console.log('[handleAfterVideoUpload] Sensor data uploaded successfully!', sensorResult);
      setTimeout(() => setShowSensorSuccess(false), 2000);
    } else {
      console.log('[handleAfterVideoUpload] Sensor data upload failed.', sensorResult);
    }
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
        onpress_left={() => navigation.navigate('Home')}
      />
      <View style={styles.cameraContainer}>
        {/* Camera preview always visible, stays in place */}
        <View style={styles.camera} />
        {/* Bottom Bar with Record and Gallery buttons in same row */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.recordButton} onPress={recordVideo}>
            <RNText style={styles.recordText}>Record</RNText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={() => navigation && navigation.navigate && navigation.navigate('GestureAnalysis')}>
            <Image source={GALLERY_ICON} style={styles.galleryIcon} />
          </TouchableOpacity>
        </View>
        {/* Clean Upload/Discard Modal */}
        <Modal visible={preview} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <RNText style={styles.modalTitle}>Video Recorded</RNText>
              <RNText style={styles.modalSubtitle}>What would you like to do with this video?</RNText>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.uploadButton]} onPress={uploadVideo}>
                  <RNText style={styles.modalButtonText}>Upload</RNText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.discardButton]} onPress={discardVideo}>
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
              <RNText style={styles.uploadingText}>Uploading video...</RNText>
            </View>
          </View>
        )}
        {/* Success Popup */}
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
        {/* Sensor Success Popup */}
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
      {/* <FabChatbot onPress={() => navigation.navigate('Chatbot')} /> */}
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
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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
