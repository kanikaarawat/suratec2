import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Dimensions, Text as RNText, Modal, Platform, PermissionsAndroid, NativeModules, NativeEventEmitter, BackHandler } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import HeaderFix from '../../common/HeaderFix';
import { connect } from 'react-redux';
import LangHome from '../../../assets/language/screen/lang_home';
import { useSelector, useDispatch } from 'react-redux';
import BleManager from 'react-native-ble-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
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
  const [hasPermission, setHasPermission] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [videoPath, setVideoPath] = useState(null);
  const [shoeSize, setShoeSize] = useState(42);
  const [sensorDataArray, setSensorDataArray] = useState([]);
  const [recording, setRecording] = useState(false);
  const [bleListener, setBleListener] = useState(null);
  const [recordStartTime, setRecordStartTime] = useState(null);
  let lastTimestamp = React.useRef(null);
  const productNumber = useSelector ? useSelector(state => state.productNumber) : null;
  const user = useSelector ? useSelector(state => state.user) : null;
  const idCustomer = user?.id_customer || props.id_member;

  useEffect(() => {
    requestCameraPermission();
    // Hardware back handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Home');
      return true;
    });
    return () => backHandler.remove();
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
    if (hasPermission === false) {
      Alert.alert('Permission Required', 'Camera permission is required to record videos. Please grant permission in settings.');
      return;
    }

    const options = {
      mediaType: 'video',
      videoQuality: 'high',
      durationLimit: 60,
      saveToPhotos: false,
      cameraType: 'back',
      presentationStyle: 'fullScreen',
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage);
        return;
      }
      if (response.assets && response.assets[0]) {
        setVideoUri(response.assets[0].uri);
        setPreview(true);
      }
    });
  };

  const uploadVideo = async () => {
    if (!videoUri) {
      Alert.alert('Error', 'No video to upload');
      return;
    }
    if (!props.token || !props.id_member) {
      Alert.alert('Error', 'Authentication data missing');
      return;
    }
    setUploading(true);
    setUploadError(null);
    setPreview(false); // Close the preview modal
    try {
      const formData = new FormData();
      formData.append('id_member', props.id_member);
      formData.append('video_file', {
        uri: Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri,
        type: 'video/mp4',
        name: 'gesture_video.mp4',
      });
      const response = await fetch('https://api1.suratec.co.th/api/video/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${props.token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setShowSuccess(true);
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
      setUploadError(error.message || 'Upload failed');
      setUploading(false);
    }
  };

  const discardVideo = () => {
    setPreview(false);
    setVideoUri(null);
    setUploadError(null);
  };

  const startSensorRecording = () => {
    setSensorDataArray([]);
    setRecording(true);
    setRecordStartTime(Date.now());
    lastTimestamp.current = Date.now();
    const listener = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral }) => {
        const now = Date.now();
        const duration = now - (lastTimestamp.current || now);
        lastTimestamp.current = now;
        let sensorArr = toDecimalArray(value);
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
            left: left ? left : last.left || { sensor: [0,0,0,0,0] },
            right: right ? right : last.right || { sensor: [0,0,0,0,0] },
          };
          dispatch({ type: 'ADD_BLUETOOTH_DATA', payload: newData });
          return [...prev, newData];
        });
      }
    );
    setBleListener(listener);
    dispatch({ type: 'READ_BLUETOOTH_STATE', payload: true });
  };

  const stopSensorRecording = () => {
    setRecording(false);
    if (bleListener) {
      bleListener.remove();
      setBleListener(null);
    }
    dispatch({ type: 'READ_BLUETOOTH_STATE', payload: false });
  };

  function toDecimalArray(byteArray) {
    let dec = [];
    for (let i = 0; i < byteArray.length - 1; i += 2) {
      dec.push(byteArray[i] * 255 + byteArray[i + 1]);
    }
    const result = dec.slice(0, 5);
    return result;
  }

  const uploadSensorData = async ({ video_id, attempts = 1 }) => {
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
      if (response.ok) {
        const data = await response.json();
        return true;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      if (attempts < MAX_UPLOAD_ATTEMPTS) {
        return uploadSensorData({ video_id, attempts: attempts + 1 });
      } else {
        try {
          await AsyncStorage.setItem(
            `sensorData_${video_id}`,
            JSON.stringify(payload)
          );
          Alert.alert('Upload Failed', 'Sensor data could not be uploaded. It has been saved locally. Please retry later.');
        } catch (e) {}
        return false;
      }
    }
  };

  const handleAfterVideoUpload = async (vid) => {
    stopSensorRecording();
    await uploadSensorData({ video_id: vid });
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
