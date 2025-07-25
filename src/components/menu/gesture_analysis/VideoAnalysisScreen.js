import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, PanResponder, Animated, Dimensions } from 'react-native';
import Video from 'react-native-video';
import HeaderFix from '../../common/HeaderFix';
import Slider from '@react-native-community/slider';
import SvgContourBasicSmall from '../../contourlib/screens/SvgD3ContourBasicSmall';
// import FabChatbot from '../../common/FabChatbot';
import Svg from 'react-native-svg';
import { Line, Circle } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LangHome from '../../../assets/language/screen/lang_home';
import { useSelector } from 'react-redux';

const PLAYBACK_ICON = require('../../../assets/image/gesture_analysis/playback.png');
const ANGLE_ICON = require('../../../assets/image/gesture_analysis/angle.png');
const DUSTBIN_ICON = require('../../../assets/image/gesture_analysis/dustbin.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLAYBACK_SPEEDS = [
  { label: '0.2X', value: 0.2 },
  { label: '0.5X', value: 0.5 },
  { label: 'Normal', value: 1.0 },
];

const initialAngles = [
  // Example: { x: 100, y: 200, id: 1, value: 110 }
];

const getAngle = (A, B, C) => {
  // Returns angle ABC in degrees
  const ab = { x: A.x - B.x, y: A.y - B.y };
  const cb = { x: C.x - B.x, y: C.y - B.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  const angle = Math.atan2(Math.abs(cross), dot);
  return (angle * 180) / Math.PI;
};

const initialAngleVertices = [
  { x: SCREEN_WIDTH * 0.2, y: SCREEN_HEIGHT * 0.3 }, // A
  { x: SCREEN_WIDTH * 0.3, y: SCREEN_HEIGHT * 0.4 }, // B (vertex)
  { x: SCREEN_WIDTH * 0.4, y: SCREEN_HEIGHT * 0.3 }, // C
];

const DUSTBIN_WIDTH = 80;
const DUSTBIN_HEIGHT = 120;
const DUSTBIN_AREA = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};
const isInDustbin = (x, y) =>
  x > DUSTBIN_AREA.x && x < DUSTBIN_AREA.x + DUSTBIN_AREA.width &&
  y > DUSTBIN_AREA.y && y < DUSTBIN_AREA.y + DUSTBIN_AREA.height;

const VideoAnalysisScreen = (props) => {
  // Support both v4 and v5 navigation prop shapes
  const videoUri =
    props.route?.params?.videoUri ||
    props.navigation?.state?.params?.videoUri;
  // Removed excessive logging to prevent video stutter
  const isValidVideoUri = typeof videoUri === 'string' && videoUri.length > 0;
  const lang = useSelector(state => state.lang);
  const videoId =
    props.route?.params?.videoId ||
    props.route?.params?.video_id ||
    props.navigation?.state?.params?.videoId ||
    props.navigation?.state?.params?.video_id;
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false);
  const [showAngles] = useState(false);
  const [angles, setAngles] = useState(initialAngles);
  const [draggingAngleId, setDraggingAngleId] = useState(null);
  const [anglePositions, setAnglePositions] = useState({});
  const [sensorData, setSensorData] = useState([]);
  const [noSensorData, setNoSensorData] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const videoRef = useRef(null);

  // Debug: log sensor data whenever it changes
  useEffect(() => {
    if (sensorData && sensorData.length > 0) {
      console.log('[VideoAnalysisScreen] Sensor data loaded:', sensorData);
    } else {
      console.log('[VideoAnalysisScreen] No sensor data for videoId:', videoId);
    }
  }, [sensorData, videoId]);

  // For drag-and-drop (angles)
  const pan = useRef(new Animated.ValueXY()).current;

  // State for floating overlay position
  const [panOverlay] = useState(new Animated.ValueXY({ x: SCREEN_WIDTH * 0.25, y: SCREEN_HEIGHT * 0.095 }));

  // PanResponder for dragging the overlay
  const panResponderOverlay = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([
      null,
      { dx: panOverlay.x, dy: panOverlay.y }
    ], { useNativeDriver: false }),
    onPanResponderGrant: () => {
      panOverlay.setOffset({ x: panOverlay.x._value, y: panOverlay.y._value });
      panOverlay.setValue({ x: 0, y: 0 });
    },
    onPanResponderRelease: () => {
      panOverlay.flattenOffset();
    },
  });

  // PanResponder for dragging angles
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !!draggingAngleId,
    onPanResponderMove: (e, gestureState) => {
      if (draggingAngleId) {
        pan.setValue({ x: gestureState.moveX, y: gestureState.moveY });
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      if (draggingAngleId) {
        // Check if dropped over dustbin
        const { moveX, moveY } = gestureState;
        if (
          moveX > SCREEN_WIDTH - 80 &&
          moveY > SCREEN_HEIGHT - 120
        ) {
          // Remove angle
          setAngles(angles.filter(a => a.id !== draggingAngleId));
        }
        setDraggingAngleId(null);
        pan.setValue({ x: 0, y: 0 });
      }
    },
  });

  // Fetch sensor data on mount/video change
  useEffect(() => {
    const fetchSensorData = async () => {
      setNoSensorData(false);
      setSensorData([]);
      if (!videoId) return;
      try {
        const response = await fetch('https://api1.suratec.co.th/surasole-record/get-by-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ video_id: videoId }),
        });
        console.log('[VideoAnalysisScreen] Sensor fetch response status:', response.status);
        const data = await response.json();
        console.log('[VideoAnalysisScreen] Sensor fetch response data:', data);
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setSensorData(data.data);
        } else {
          setNoSensorData(true);
          setSensorData([]);
          alert('No sensor data found for this video.');
          console.log('[VideoAnalysisScreen] No sensor data found for video_id:', videoId);
        }
      } catch (error) {
        setNoSensorData(true);
        setSensorData([]);
        alert('Failed to fetch sensor data.');
        console.log('[VideoAnalysisScreen] Failed to fetch sensor data:', error);
      }
    };
    fetchSensorData();
  }, [videoId]);

  // Reset overlay position to original when screen is opened or videoId changes
  useEffect(() => {
    panOverlay.setValue({ x: SCREEN_WIDTH * 0.25, y: SCREEN_HEIGHT * 0.61 });
  }, [videoId]);

  // Find the closest sensor frame for the current video time
  const handleVideoProgress = (progress) => {
    if (!Array.isArray(sensorData) || sensorData.length === 0) {
      setCurrentFrame(null);
      return;
    }
    const currentTime = progress.currentTime;
    let closest = sensorData[0];
    let minDiff = Math.abs(new Date(closest.timestamp).getTime() / 1000 - currentTime);
    for (let frame of sensorData) {
      const diff = Math.abs(new Date(frame.timestamp).getTime() / 1000 - currentTime);
      if (diff < minDiff) {
        closest = frame;
        minDiff = diff;
      }
    }
    setCurrentFrame(closest);
  };

  // Generate pressure map data dynamically for 5 or 8 sensors
  const getPressureMapData = () => {
    if (!currentFrame) return { left: [], right: [] };
    const leftSensor = currentFrame.left?.sensor;
    const rightSensor = currentFrame.right?.sensor;
    let leftContour = [];
    let rightContour = [];
    if (leftSensor) {
      if (leftSensor.length === 8 && typeof findLeftContourArray8 === 'function') {
        leftContour = findLeftContourArray8(leftSensor);
      } else if (leftSensor.length === 5 && typeof findLeftContourArray === 'function') {
        leftContour = findLeftContourArray(leftSensor);
      } else {
        leftContour = [];
      }
    }
    if (rightSensor) {
      if (rightSensor.length === 8 && typeof findRightContourArray8 === 'function') {
        rightContour = findRightContourArray8(rightSensor);
      } else if (rightSensor.length === 5 && typeof findRightContourArray === 'function') {
        rightContour = findRightContourArray(rightSensor);
      } else {
        rightContour = [];
      }
    }
    return { left: leftContour, right: rightContour };
  };

  // Render pressure map overlay
  const renderFootMap = () => {
    const { left, right } = getPressureMapData();
    return (
      <Animated.View
        {...panResponderOverlay.panHandlers}
        style={{
          position: 'absolute',
          left: panOverlay.x,
          top: panOverlay.y,
          width: SCREEN_WIDTH * 0.56,
          height: SCREEN_WIDTH * 0.46,
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        {(noSensorData || !Array.isArray(sensorData) || sensorData.length === 0) && (
          <Text style={{
            color: '#fff',
            fontSize: 14,
            position: 'absolute',
            bottom: 10,
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 2,
          }}>
            Sensor data not available
          </Text>
        )}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <SvgContourBasicSmall
            leftsensor={Array.isArray(left) ? left : []}
            rightsensor={Array.isArray(right) ? right : []}
          />
        </View>
      </Animated.View>
    );
  };

  // Add angle on tap (disabled)
  const handleVideoPress = () => {};

  // Start dragging an angle (disabled)
  const startDragAngle = () => {};

  // Render angles
  const renderAngles = () => {
    if (!showAngles) return null;
    return angles.map(angle => {
      if (draggingAngleId === angle.id) {
        // Render as animated while dragging
        return (
          <Animated.View
            key={angle.id}
            style={[
              styles.anglePoint,
              {
                position: 'absolute',
                left: pan.x,
                top: pan.y,
                zIndex: 10,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.angleCircle}>
              <Text style={styles.angleText}>{angle.value}</Text>
            </View>
          </Animated.View>
        );
      }
      return (
        <TouchableOpacity
          key={angle.id}
          style={[
            styles.anglePoint,
            { left: angle.x, top: angle.y, position: 'absolute' },
          ]}
          onLongPress={() => startDragAngle(angle.id)}
          disabled={!showAngles}
        >
          <View style={styles.angleCircle}>
            <Text style={styles.angleText}>{angle.value}</Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const [angleMode, setAngleMode] = useState(false);
  const [angleVertices, setAngleVertices] = useState(initialAngleVertices);
  const [draggingVertex, setDraggingVertex] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Group drag state
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  const [groupDragStart, setGroupDragStart] = useState(null);

  const handleVertexPanResponder = idx => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e, gestureState) => {
      setDraggingVertex(idx);
      setDragOffset({ x: 0, y: 0 });
    },
    onPanResponderMove: (e, gestureState) => {
      const { dx, dy } = gestureState;
      setDragOffset({ x: dx, y: dy });
      setAngleVertices(angleVertices.map((v, i) =>
        i === idx ? { x: v.x + dx, y: v.y + dy } : v
      ));
    },
    onPanResponderRelease: () => {
      setDraggingVertex(null);
      setDragOffset({ x: 0, y: 0 });
    },
  });

  // Utility to check if two rectangles overlap
  function rectsOverlap(r1, r2) {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

  const groupPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: (e, gestureState) => {
      return !draggingVertex;
    },
    onPanResponderGrant: (e, gestureState) => {
      setIsGroupDragging(true);
      setGroupDragStart({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    },
    onPanResponderMove: (e, gestureState) => {
      if (!isGroupDragging) return;
      const dx = e.nativeEvent.pageX - groupDragStart.x;
      const dy = e.nativeEvent.pageY - groupDragStart.y;
      setAngleVertices(angleVertices.map(v => ({ x: v.x + dx, y: v.y + dy })));
      setGroupDragStart({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    },
    onPanResponderRelease: () => {
      setIsGroupDragging(false);
      setGroupDragStart(null);
      // Compute bounding box of all three vertices
      const xs = angleVertices.map(v => v.x);
      const ys = angleVertices.map(v => v.y);
      const minX = Math.min(...xs) - 14;
      const maxX = Math.max(...xs) + 14;
      const minY = Math.min(...ys) - 14;
      const maxY = Math.max(...ys) + 14;
      const angleBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
      if (rectsOverlap(angleBox, DUSTBIN_AREA)) {
        setAngleMode(false);
      }
    },
  });

  // Helper to compute bisector point for label
  function getAngleLabelPosition(A, B, C, distance = 42) {
    // Vectors BA and BC
    const v1 = { x: A.x - B.x, y: A.y - B.y };
    const v2 = { x: C.x - B.x, y: C.y - B.y };
    // Normalize
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    const u1 = { x: v1.x / len1, y: v1.y / len1 };
    const u2 = { x: v2.x / len2, y: v2.y / len2 };
    // Bisector direction
    const bis = { x: u1.x + u2.x, y: u1.y + u2.y };
    const bisLen = Math.sqrt(bis.x * bis.x + bis.y * bis.y);
    const bisector = { x: bis.x / bisLen, y: bis.y / bisLen };
    // Point along bisector
    return {
      x: B.x + bisector.x * distance,
      y: B.y + bisector.y * distance,
    };
  }

  const renderAngleOverlay = () => {
    if (!angleMode) return null;
    const [A, B, C] = angleVertices;
    const angle = getAngle(A, B, C).toFixed(1);
    const labelPos = getAngleLabelPosition(A, B, C, 42);
    return (
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          zIndex: 20,
        }}
        {...groupPanResponder.panHandlers}
        pointerEvents="box-none"
      >
        <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#111" strokeWidth="3" />
          <Line x1={C.x} y1={C.y} x2={B.x} y2={B.y} stroke="#111" strokeWidth="3" />
          {[A, B, C].map((v, idx) => (
            <Circle
              key={idx}
              cx={v.x}
              cy={v.y}
              r={14}
              fill="#FFD600"
              stroke="#111"
              strokeWidth={1.5}
              {...handleVertexPanResponder(idx).panHandlers}
            />
          ))}
        </Svg>
        {/* Angle label as white circle with bold black text, between the lines */}
        <View style={{
          position: 'absolute',
          left: labelPos.x - 18,
          top: labelPos.y - 18,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#fff',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 0,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ color: '#111', fontWeight: 'bold', fontSize: 15 }}>{angle}°</Text>
        </View>
      </View>
    );
  };

  const dustbinRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const handlePlayPause = () => {
    setIsPlaying(p => !p);
  };
  const handleProgress = (progress) => {
    // Only update if time actually changed and not seeking
    setCurrentTime(prevTime => {
      if (Math.abs(prevTime - progress.currentTime) > 0.25) {
        return progress.currentTime;
      }
      return prevTime;
    });
  };
  const handleLoad = (meta) => {
    setDuration(meta.duration);
  };
  const handleSeek = (value) => {
    if (Math.abs(currentTime - value) > 0.25) {
      videoRef.current?.seek(value);
      setCurrentTime(value);
    }
  };

  // Optionally, display sensor type info:
  const sensorTypeLabel = currentFrame && currentFrame.left?.sensor
    ? (currentFrame.left.sensor.length === 8 ? '8-sensor' : '5-sensor')
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <HeaderFix
        title="Gesture Analysis"
        lang={lang}
        icon_left={true}
        onpress_left={() => props.navigation && props.navigation.goBack && props.navigation.goBack()}
      />
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={handleVideoPress}
        >
          {/* Fullscreen black video area */}
          <View style={styles.fullScreenVideo}>
            {isValidVideoUri ? (
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.fullScreenVideo}
                controls={false}
                paused={!isPlaying}
                rate={playbackRate}
                resizeMode="contain"
                onProgress={handleProgress}
                onLoad={handleLoad}
              />
            ) : (
              <View style={[styles.fullScreenVideo, { justifyContent: 'center', alignItems: 'center' }]}> 
                <Text style={{ color: 'red', fontSize: 18 }}>No video source provided</Text>
              </View>
            )}
            {/* Custom playback controls */}
            <View style={styles.customControlsContainer}>
              <Slider
                style={styles.customSlider}
                minimumValue={0}
                maximumValue={duration}
                value={currentTime}
                onValueChange={handleSeek}
                minimumTrackTintColor="#fff"
                maximumTrackTintColor="#bbb"
                thumbTintColor="#fff"
              />
              <View style={styles.customControlsRow}>
                <TouchableOpacity>
                  <MaterialIcons name="skip-previous" size={36} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePlayPause}>
                  <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={44} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <MaterialIcons name="skip-next" size={36} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            {/* Angles Overlay */}
            {renderAngles()}
            {/* Pressure Map Overlay */}
            {renderFootMap()}
            {renderAngleOverlay()}
          </View>
        </TouchableOpacity>
        {/* Controls Overlay: right bottom, vertical */}
        <View style={[styles.rightBottomControls, { bottom: SCREEN_HEIGHT * 0.13 }]}>
          {/* Dustbin first (top) */}
          <View
            ref={dustbinRef}
            style={styles.dustbinContainerRB}
            onLayout={() => {
              if (dustbinRef.current && dustbinRef.current.measureInWindow) {
                dustbinRef.current.measureInWindow((x, y, width, height) => {
                  DUSTBIN_AREA.x = x;
                  DUSTBIN_AREA.y = y;
                  DUSTBIN_AREA.width = width;
                  DUSTBIN_AREA.height = height;
                });
              }
            }}
          >
            <Image source={DUSTBIN_ICON} style={styles.iconSmall} />
          </View>
          {/* Angle icon */}
          <View style={styles.dustbinContainerRB}>
            <TouchableOpacity onPress={() => {
              setAngleMode(m => !m);
              setAngleVertices(initialAngleVertices);
            }}>
              <Image source={ANGLE_ICON} style={styles.iconSmall} />
            </TouchableOpacity>
          </View>
          {/* Playback icon */}
          <TouchableOpacity
            style={styles.dustbinContainerRB}
            onPress={() => setShowPlaybackOptions(prev => !prev)}
          >
            <Image source={PLAYBACK_ICON} style={styles.iconSmall} />
          </TouchableOpacity>
        </View>
        {/* Playback Speed Options: styled as screenshot */}
        {showPlaybackOptions && (
          <View style={styles.playbackOptionsRB}>
            {PLAYBACK_SPEEDS.map(opt => (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.playbackOptionBtnRB,
                  playbackRate === opt.value && styles.playbackOptionBtnActiveRB,
                ]}
                onPress={() => {
                  setPlaybackRate(opt.value);
                  setShowPlaybackOptions(false);
                }}
              >
                <Text style={[
                  styles.playbackOptionTextRB,
                  playbackRate === opt.value && styles.playbackOptionTextActiveRB,
                ]}>{opt.label.replace('0.2X', '.2X').replace('0.5X', '.5X')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {/* <FabChatbot onPress={() => navigation.navigate('Chatbot')} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: '#000',
  },
  overlayControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  controlBtn: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    elevation: 2,
  },
  controlIcon: {
    width: 40,
    height: 40,
  },
  dustbinContainer: {
    position: 'absolute',
    right: 24,
    bottom: -40,
    zIndex: 20,
  },
  dustbinIcon: {
    width: 48,
    height: 48,
  },
  playbackOptions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
  },
  playbackOptionBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#00bfc5',
  },
  playbackOptionBtnActive: {
    backgroundColor: '#00bfc5',
  },
  playbackOptionText: {
    fontSize: 18,
    color: '#00bfc5',
    fontWeight: 'bold',
  },
  anglePoint: {
    zIndex: 10,
  },
  angleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD600',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  angleText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  footMapContainer: {
    position: 'absolute',
    bottom: 80,
    left: '25%',
    width: '50%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  footMap: {
    width: '100%',
    height: '100%',
  },
  fullScreenVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBottomControls: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 20,
    gap: 12,
  },
  controlBtnRB: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 8,
    marginBottom: 12,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconRB: {
    width: 48,
    height: 48,
  },
  dustbinContainerRB: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    marginBottom: 8,
  },
  
  iconSmall: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  playbackOptionsRB: {
    position: 'absolute',
    right: 40,
    bottom: 85,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 24,
    minWidth: 300,
    zIndex: 30,
  },
  playbackOptionBtnRB: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    backgroundColor: 'transparent',
  },
  playbackOptionBtnActiveRB: {
    backgroundColor: '#fff',
  },
  playbackOptionTextRB: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  playbackOptionTextActiveRB: {
    color: '#00bfc5',
  },
  customControlsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 8,
  },
  customSlider: {
    width: '92%',
    height: 24,
    marginBottom: 0,
    alignSelf: 'center',
    marginTop:8,
  },
  customControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
  },
});

export default VideoAnalysisScreen;