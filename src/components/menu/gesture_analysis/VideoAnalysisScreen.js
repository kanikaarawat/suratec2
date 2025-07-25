import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, PanResponder, Animated, Dimensions } from 'react-native';
import Video from 'react-native-video';
import HeaderFix from '../../common/HeaderFix';
import Slider from '@react-native-community/slider';
import SvgContourBasicSmall from '../../contourlib/screens/SvgD3ContourBasicSmall'; // ✅ Use Small version
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

const initialAngles = [];

// EXACT constants from pressure map module
const left_x = [
  3, 7, 3, 3, 5, 7, 5, 7, 3, 5, 7, 5, 7, 5, 7, 7, 3, 5, 7, 5, 7, 3, 5, 7,
];
const axis_y = [
  3, 3, 5, 7, 7, 7, 11, 11, 13, 13, 13, 15, 15, 17, 17, 19, 21, 21, 21, 23, 23,
  24, 24, 24,
];
const right_x = [
  1.5, 5.5, 5.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5,
  1.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5, 5.5,
];

const n = 8, m = 24;

const getAngle = (A, B, C) => {
  const ab = { x: A.x - B.x, y: A.y - B.y };
  const cb = { x: C.x - B.x, y: C.y - B.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  const angle = Math.atan2(Math.abs(cross), dot);
  return (angle * 180) / Math.PI;
};

const initialAngleVertices = [
  { x: SCREEN_WIDTH * 0.2, y: SCREEN_HEIGHT * 0.3 },
  { x: SCREEN_WIDTH * 0.3, y: SCREEN_HEIGHT * 0.4 },
  { x: SCREEN_WIDTH * 0.4, y: SCREEN_HEIGHT * 0.3 },
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

// Add simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// EXACT pressure map functions from pressure map module
const findLeftContourArray = (lsensor) => {
  const dataleft = [
    1,
    lsensor[0],
    0,
    lsensor[1],
    0,
    lsensor[2],
    0,
    0,
    lsensor[3],
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    lsensor[4],
    0,
    0,
    0,
    0,
    0,
    0,
  ];
  var variogram = kriging.train(
    dataleft,
    left_x,
    axis_y,
    'exponential',
    0,
    100,
  );
  var lvalues = new Array(8 * 24);
  for (let j = 0.5, k = 0; j < m; ++j) {
    for (let i = 0.5; i < n; ++i, ++k) {
      lvalues[k] = kriging.predict(i, j, variogram);
      lvalues[k] = lvalues[k] > 0 ? lvalues[k] : 0;
    }
  }
  return lvalues;
};

const findRightContourArray = (rsensor) => {
  const dataright = [
    rsensor[0],
    0,
    0,
    rsensor[1],
    0,
    rsensor[2],
    0,
    0,
    0,
    0,
    rsensor[3],
    0,
    0,
    0,
    0,
    0,
    0,
    rsensor[4],
    0,
    0,
    0,
    0,
    0,
    1,
  ];
  var variogram = kriging.train(
    dataright,
    right_x,
    axis_y,
    'exponential',
    0,
    100,
  );
  var rvalues = new Array(8 * 24);
  for (let j = 0.5, k = 0; j < m; ++j) {
    for (let i = 0.5; i < n; ++i, ++k) {
      rvalues[k] = kriging.predict(i, j, variogram);
      rvalues[k] = rvalues[k] > 0 ? rvalues[k] : 0;
    }
  }
  return rvalues;
};

// Convert API sensor data to match pressure map format (5 sensors)
const convertSensorData = (apiData) => {
  if (!apiData || apiData.length === 0) return [];
  
  const sortedData = [...apiData].sort((a, b) => new Date(a.action).getTime() - new Date(b.action).getTime());
  const firstTimestamp = new Date(sortedData[0].action).getTime();
  
  return sortedData.map((frame, index) => {
    const leftSensor = [
      parseInt(frame.left_sensor1 || '0'),
      parseInt(frame.left_sensor2 || '0'),
      parseInt(frame.left_sensor3 || '0'),
      parseInt(frame.left_sensor4 || '0'),
      parseInt(frame.left_sensor5 || '0'),
    ];
    
    const rightSensor = [
      parseInt(frame.right_sensor1 || '0'),
      parseInt(frame.right_sensor2 || '0'),
      parseInt(frame.right_sensor3 || '0'),
      parseInt(frame.right_sensor4 || '0'),
      parseInt(frame.right_sensor5 || '0'),
    ];
    
    const frameTimestamp = new Date(frame.action).getTime();
    const videoRelativeTime = (frameTimestamp - firstTimestamp) / 1000;
    
    return {
      ...frame,
      timestamp: frame.action,
      videoRelativeTime,
      left: { sensor: leftSensor },
      right: { sensor: rightSensor },
      leftData: findLeftContourArray(leftSensor),
      rightData: findRightContourArray(rightSensor),
      debug: {
        leftSum: leftSensor.reduce((a, b) => a + b, 0),
        rightSum: rightSensor.reduce((a, b) => a + b, 0),
        leftMax: Math.max(...leftSensor),
        rightMax: Math.max(...rightSensor),
        videoTime: videoRelativeTime.toFixed(3) + 's'
      }
    };
  });
};

const VideoAnalysisScreen = (props) => {
  const videoUri = props.route?.params?.videoUri || props.navigation?.state?.params?.videoUri;
  const isValidVideoUri = typeof videoUri === 'string' && videoUri.length > 0;
  const lang = useSelector(state => state.lang);
  const videoId = props.route?.params?.videoId || props.route?.params?.video_id || props.navigation?.state?.params?.videoId || props.navigation?.state?.params?.video_id;
  
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false);
  const [showAngles] = useState(false);
  const [angles, setAngles] = useState(initialAngles);
  const [draggingAngleId, setDraggingAngleId] = useState(null);
  const [anglePositions, setAnglePositions] = useState({});
  const [sensorData, setSensorData] = useState([]);
  const [processedSensorData, setProcessedSensorData] = useState([]);
  const [noSensorData, setNoSensorData] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const videoRef = useRef(null);

  // For drag-and-drop (angles) - PRESERVED
  const pan = useRef(new Animated.ValueXY()).current;

  // State for floating overlay position - PRESERVED
  const [panOverlay] = useState(new Animated.ValueXY({ x: SCREEN_WIDTH * 0.25, y: SCREEN_HEIGHT * 0.095 }));

  // PanResponder for dragging the overlay - PRESERVED
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

  // PanResponder for dragging angles - PRESERVED
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !!draggingAngleId,
    onPanResponderMove: (e, gestureState) => {
      if (draggingAngleId) {
        pan.setValue({ x: gestureState.moveX, y: gestureState.moveY });
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      if (draggingAngleId) {
        const { moveX, moveY } = gestureState;
        if (moveX > SCREEN_WIDTH - 80 && moveY > SCREEN_HEIGHT - 120) {
          setAngles(angles.filter(a => a.id !== draggingAngleId));
        }
        setDraggingAngleId(null);
        pan.setValue({ x: 0, y: 0 });
      }
    },
  });

  // Fetch and convert sensor data
  useEffect(() => {
    const fetchSensorData = async () => {
      setNoSensorData(false);
      setSensorData([]);
      setProcessedSensorData([]);
      
      if (!videoId) return;
      
      try {
        console.log('[VideoAnalysisScreen] Fetching sensor data for videoId:', videoId);
        
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
          const rawSensorData = data.data;
          console.log('[VideoAnalysisScreen] Raw sensor data count:', rawSensorData.length);
          
          const converted = convertSensorData(rawSensorData);
          console.log('[VideoAnalysisScreen] Converted sensor data:', converted);
          
          if (converted.length > 0) {
            console.log('[VideoAnalysisScreen] First frame debug:', converted[0].debug);
            console.log('[VideoAnalysisScreen] Time mapping - First: 0s, Last:', converted[converted.length - 1].debug.videoTime);
          }
          
          setSensorData(rawSensorData);
          setProcessedSensorData(converted);
        } else {
          setNoSensorData(true);
          console.log('[VideoAnalysisScreen] No sensor data found for video_id:', videoId);
        }
      } catch (error) {
        setNoSensorData(true);
        console.log('[VideoAnalysisScreen] Failed to fetch sensor data:', error);
      }
    };
    
    fetchSensorData();
  }, [videoId]);

  // Reset overlay position to original when screen is opened or videoId changes
  useEffect(() => {
    panOverlay.setValue({ x: SCREEN_WIDTH * 0.25, y: SCREEN_HEIGHT * 0.61 });
  }, [videoId]);

  // Find closest sensor frame based on video playback time
  const findClosestSensorFrame = useCallback((videoCurrentTime) => {
    if (!Array.isArray(processedSensorData) || processedSensorData.length === 0) {
      return null;
    }
    
    let closest = processedSensorData[0];
    let minDiff = Math.abs(closest.videoRelativeTime - videoCurrentTime);
    
    for (let frame of processedSensorData) {
      const diff = Math.abs(frame.videoRelativeTime - videoCurrentTime);
      if (diff < minDiff) {
        closest = frame;
        minDiff = diff;
      }
    }
    
    return closest;
  }, [processedSensorData]);

  // Debounced seek update to prevent glitching
  const debouncedSeekUpdate = useCallback(
    debounce((value) => {
      setCurrentTime(value);
      const sensorFrame = findClosestSensorFrame(value);
      if (sensorFrame) {
        setCurrentFrame(sensorFrame);
      }
    }, 50), // 50ms debounce
    [findClosestSensorFrame]
  );

  // Handle video progress with debouncing to prevent glitches
  const handleVideoProgress = useCallback((progress) => {
    const newTime = progress.currentTime;
    
    // Only update if significant time difference (prevents micro-updates)
    if (Math.abs(currentTime - newTime) > 0.1) {
      setCurrentTime(newTime);
      
      // Find corresponding sensor frame
      const sensorFrame = findClosestSensorFrame(newTime);
      if (sensorFrame) {
        setCurrentFrame(sensorFrame);
      }
    }
  }, [currentTime, findClosestSensorFrame]);

  // Generate pressure map data using the pressure map module format
  const getPressureMapData = () => {
    if (!currentFrame) {
      return { left: [], right: [] };
    }
    
    const leftContour = currentFrame.leftData || [];
    const rightContour = currentFrame.rightData || [];
    
    return { 
      left: leftContour, 
      right: rightContour 
    };
  };

  // ✅ UPDATED: Render pressure map using SvgContourBasicSmall
  const renderFootMap = () => {
    const { left, right } = getPressureMapData();
    
    const debugInfo = currentFrame ? {
      leftMax: currentFrame.debug?.leftMax || 0,
      rightMax: currentFrame.debug?.rightMax || 0,
      videoTime: currentFrame.debug?.videoTime || '0s',
      timestamp: currentFrame.timestamp,
    } : null;
    
    return (
      <Animated.View
        {...panResponderOverlay.panHandlers}
        style={{
          position: 'absolute',
          left: panOverlay.x,
          top: panOverlay.y,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {/* Debug overlay */}
        {debugInfo && (
          <View style={{
            position: 'absolute',
            top: -25,
            left: 0,
            right: 0,
            zIndex: 15,
          }}>
            <Text style={{ 
              color: '#fff', 
              fontSize: 10, 
              textAlign: 'center', 
              backgroundColor: 'rgba(0,0,0,0.7)', 
              padding: 2,
              borderRadius: 4,
            }}>
              L:{debugInfo.leftMax} R:{debugInfo.rightMax} | {debugInfo.videoTime}
            </Text>
          </View>
        )}
        
        {(noSensorData || !Array.isArray(processedSensorData) || processedSensorData.length === 0) && (
          <Text style={{
            color: '#fff',
            fontSize: 12,
            position: 'absolute',
            bottom: -30,
            left: 0,
            right: 0,
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 4,
            borderRadius: 4,
            zIndex: 2,
          }}>
            Sensor data not available
          </Text>
        )}
        
        {/* ✅ Use SvgContourBasicSmall - Perfect for video overlay */}
        <View>
          <SvgContourBasicSmall
            leftsensor={Array.isArray(left) ? left : []}
            rightsensor={Array.isArray(right) ? right : []}
          />
        </View>
      </Animated.View>
    );
  };

  // [All other preserved functions remain the same]
  const handleVideoPress = () => {};
  const startDragAngle = () => {};
  const renderAngles = () => { /* Same as before */ };
  
  const [angleMode, setAngleMode] = useState(false);
  const [angleVertices, setAngleVertices] = useState(initialAngleVertices);
  const [draggingVertex, setDraggingVertex] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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

  function getAngleLabelPosition(A, B, C, distance = 42) {
    const v1 = { x: A.x - B.x, y: A.y - B.y };
    const v2 = { x: C.x - B.x, y: C.y - B.y };
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    const u1 = { x: v1.x / len1, y: v1.y / len1 };
    const u2 = { x: v2.x / len2, y: v2.y / len2 };
    const bis = { x: u1.x + u2.x, y: u1.y + u2.y };
    const bisLen = Math.sqrt(bis.x * bis.x + bis.y * bis.y);
    const bisector = { x: bis.x / bisLen, y: bis.y / bisLen };
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

  const handlePlayPause = () => {
    setIsPlaying(p => !p);
  };

  const handleLoad = (meta) => {
    setDuration(meta.duration);
    console.log('[VideoAnalysisScreen] Video loaded, duration:', meta.duration);
  };

  const handleSeek = useCallback((value) => {
    if (Math.abs(currentTime - value) > 0.1) {
      videoRef.current?.seek(value);
      debouncedSeekUpdate(value);
    }
  }, [currentTime, debouncedSeekUpdate]);

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
                onProgress={handleVideoProgress}
                onLoad={handleLoad}
              />
            ) : (
              <View style={[styles.fullScreenVideo, { justifyContent: 'center', alignItems: 'center' }]}> 
                <Text style={{ color: 'red', fontSize: 18 }}>No video source provided</Text>
              </View>
            )}
            
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
            
            {renderAngles()}
            
            {/* ✅ Now using SvgContourBasicSmall with proper sizing */}
            {renderFootMap()}
            
            {renderAngleOverlay()}
          </View>
        </TouchableOpacity>
        
        <View style={[styles.rightBottomControls, { bottom: SCREEN_HEIGHT * 0.13 }]}>
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
          
          <View style={styles.dustbinContainerRB}>
            <TouchableOpacity onPress={() => {
              setAngleMode(m => !m);
              setAngleVertices(initialAngleVertices);
            }}>
              <Image source={ANGLE_ICON} style={styles.iconSmall} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.dustbinContainerRB}
            onPress={() => setShowPlaybackOptions(prev => !prev)}
          >
            <Image source={PLAYBACK_ICON} style={styles.iconSmall} />
          </TouchableOpacity>
        </View>
        
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
    </View>
  );
};

// [All the same styles as before]
const styles = StyleSheet.create({
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
    marginTop: 8,
  },
  customControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
  },
});


// KRIGING LIBRARY - Complete implementation from pressure map module
// Extend the Array class
Array.prototype.max = function () {
  return Math.max.apply(null, this);
};
Array.prototype.min = function () {
  return Math.min.apply(null, this);
};
Array.prototype.mean = function () {
  var i, sum;
  for (i = 0, sum = 0; i < this.length; i++) sum += this[i];
  return sum / this.length;
};
Array.prototype.rep = function (n) {
  return Array.apply(null, new Array(n)).map(Number.prototype.valueOf, this[0]);
};
Array.prototype.pip = function (x, y) {
  var i,
    j,
    c = false;
  for (i = 0, j = this.length - 1; i < this.length; j = i++) {
    if (
      this[i][1] > y != this[j][1] > y &&
      x <
      ((this[j][0] - this[i][0]) * (y - this[i][1])) /
      (this[j][1] - this[i][1]) +
      this[i][0]
    ) {
      c = !c;
    }
  }
  return c;
};

var kriging = (function () {
  var kriging = {};

  // Matrix algebra
  kriging_matrix_diag = function (c, n) {
    var i,
      Z = [0].rep(n * n);
    for (i = 0; i < n; i++) Z[i * n + i] = c;
    return Z;
  };
  kriging_matrix_transpose = function (X, n, m) {
    var i,
      j,
      Z = Array(m * n);
    for (i = 0; i < n; i++) for (j = 0; j < m; j++) Z[j * n + i] = X[i * m + j];
    return Z;
  };
  kriging_matrix_scale = function (X, c, n, m) {
    var i, j;
    for (i = 0; i < n; i++) for (j = 0; j < m; j++) X[i * m + j] *= c;
  };
  kriging_matrix_add = function (X, Y, n, m) {
    var i,
      j,
      Z = Array(n * m);
    for (i = 0; i < n; i++)
      for (j = 0; j < m; j++) Z[i * m + j] = X[i * m + j] + Y[i * m + j];
    return Z;
  };
  // Naive matrix multiplication
  kriging_matrix_multiply = function (X, Y, n, m, p) {
    var i,
      j,
      k,
      Z = Array(n * p);
    for (i = 0; i < n; i++) {
      for (j = 0; j < p; j++) {
        Z[i * p + j] = 0;
        for (k = 0; k < m; k++) Z[i * p + j] += X[i * m + k] * Y[k * p + j];
      }
    }
    return Z;
  };
  // Cholesky decomposition
  kriging_matrix_chol = function (X, n) {
    var i,
      j,
      k,
      sum,
      p = Array(n);
    for (i = 0; i < n; i++) p[i] = X[i * n + i];
    for (i = 0; i < n; i++) {
      for (j = 0; j < i; j++) p[i] -= X[i * n + j] * X[i * n + j];
      if (p[i] <= 0) return false;
      p[i] = Math.sqrt(p[i]);
      for (j = i + 1; j < n; j++) {
        for (k = 0; k < i; k++) X[j * n + i] -= X[j * n + k] * X[i * n + k];
        X[j * n + i] /= p[i];
      }
    }
    for (i = 0; i < n; i++) X[i * n + i] = p[i];
    return true;
  };
  // Inversion of cholesky decomposition
  kriging_matrix_chol2inv = function (X, n) {
    var i, j, k, sum;
    for (i = 0; i < n; i++) {
      X[i * n + i] = 1 / X[i * n + i];
      for (j = i + 1; j < n; j++) {
        sum = 0;
        for (k = i; k < j; k++) sum -= X[j * n + k] * X[k * n + i];
        X[j * n + i] = sum / X[j * n + j];
      }
    }
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) X[i * n + j] = 0;
    for (i = 0; i < n; i++) {
      X[i * n + i] *= X[i * n + i];
      for (k = i + 1; k < n; k++) X[i * n + i] += X[k * n + i] * X[k * n + i];
      for (j = i + 1; j < n; j++)
        for (k = j; k < n; k++) X[i * n + j] += X[k * n + i] * X[k * n + j];
    }
    for (i = 0; i < n; i++) for (j = 0; j < i; j++) X[i * n + j] = X[j * n + i];
  };
  // Inversion via gauss-jordan elimination
  kriging_matrix_solve = function (X, n) {
    var m = n;
    var b = Array(n * n);
    var indxc = Array(n);
    var indxr = Array(n);
    var ipiv = Array(n);
    var i, icol, irow, j, k, l, ll;
    var big, dum, pivinv, temp;

    for (i = 0; i < n; i++)
      for (j = 0; j < n; j++) {
        if (i == j) b[i * n + j] = 1;
        else b[i * n + j] = 0;
      }
    for (j = 0; j < n; j++) ipiv[j] = 0;
    for (i = 0; i < n; i++) {
      big = 0;
      for (j = 0; j < n; j++) {
        if (ipiv[j] != 1) {
          for (k = 0; k < n; k++) {
            if (ipiv[k] == 0) {
              if (Math.abs(X[j * n + k]) >= big) {
                big = Math.abs(X[j * n + k]);
                irow = j;
                icol = k;
              }
            }
          }
        }
      }
      ++ipiv[icol];

      if (irow != icol) {
        for (l = 0; l < n; l++) {
          temp = X[irow * n + l];
          X[irow * n + l] = X[icol * n + l];
          X[icol * n + l] = temp;
        }
        for (l = 0; l < m; l++) {
          temp = b[irow * n + l];
          b[irow * n + l] = b[icol * n + l];
          b[icol * n + l] = temp;
        }
      }
      indxr[i] = irow;
      indxc[i] = icol;

      if (X[icol * n + icol] == 0) return false; // Singular

      pivinv = 1 / X[icol * n + icol];
      X[icol * n + icol] = 1;
      for (l = 0; l < n; l++) X[icol * n + l] *= pivinv;
      for (l = 0; l < m; l++) b[icol * n + l] *= pivinv;

      for (ll = 0; ll < n; ll++) {
        if (ll != icol) {
          dum = X[ll * n + icol];
          X[ll * n + icol] = 0;
          for (l = 0; l < n; l++) X[ll * n + l] -= X[icol * n + l] * dum;
          for (l = 0; l < m; l++) b[ll * n + l] -= b[icol * n + l] * dum;
        }
      }
    }
    for (l = n - 1; l >= 0; l--)
      if (indxr[l] != indxc[l]) {
        for (k = 0; k < n; k++) {
          temp = X[k * n + indxr[l]];
          X[k * n + indxr[l]] = X[k * n + indxc[l]];
          X[k * n + indxc[l]] = temp;
        }
      }

    return true;
  };

  // Variogram models
  kriging_variogram_gaussian = function (h, nugget, range, sill, A) {
    return (
      nugget +
      ((sill - nugget) / range) *
      (1.0 - Math.exp(-(1.0 / A) * Math.pow(h / range, 2)))
    );
  };
  kriging_variogram_exponential = function (h, nugget, range, sill, A) {
    return (
      nugget +
      ((sill - nugget) / range) * (1.0 - Math.exp(-(1.0 / A) * (h / range)))
    );
  };
  kriging_variogram_spherical = function (h, nugget, range, sill, A) {
    if (h > range) return nugget + (sill - nugget) / range;
    return (
      nugget +
      ((sill - nugget) / range) *
      (1.5 * (h / range) - 0.5 * Math.pow(h / range, 3))
    );
  };

  // Train using gaussian processes with bayesian priors
  kriging.train = function (t, x, y, model, sigma2, alpha) {
    var variogram = {
      t: t,
      x: x,
      y: y,
      nugget: 0.0,
      range: 0.0,
      sill: 0.0,
      A: 1 / 3,
      n: 0,
    };
    switch (model) {
      case 'gaussian':
        variogram.model = kriging_variogram_gaussian;
        break;
      case 'exponential':
        variogram.model = kriging_variogram_exponential;
        break;
      case 'spherical':
        variogram.model = kriging_variogram_spherical;
        break;
    }

    // Lag distance/semivariance
    var i,
      j,
      k,
      l,
      n = t.length;
    var distance = Array((n * n - n) / 2);
    for (i = 0, k = 0; i < n; i++)
      for (j = 0; j < i; j++, k++) {
        distance[k] = Array(2);
        distance[k][0] = Math.pow(
          Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2),
          0.5,
        );
        distance[k][1] = Math.abs(t[i] - t[j]);
      }
    distance.sort(function (a, b) {
      return a[0] - b[0];
    });
    variogram.range = distance[(n * n - n) / 2 - 1][0];

    // Bin lag distance
    var lags = (n * n - n) / 2 > 30 ? 30 : (n * n - n) / 2;
    var tolerance = variogram.range / lags;
    var lag = [0].rep(lags);
    var semi = [0].rep(lags);
    if (lags < 30) {
      for (l = 0; l < lags; l++) {
        lag[l] = distance[l][0];
        semi[l] = distance[l][1];
      }
    } else {
      for (
        i = 0, j = 0, k = 0, l = 0;
        i < lags && j < (n * n - n) / 2;
        i++, k = 0
      ) {
        while (distance[j][0] <= (i + 1) * tolerance) {
          lag[l] += distance[j][0];
          semi[l] += distance[j][1];
          j++;
          k++;
          if (j >= (n * n - n) / 2) break;
        }
        if (k > 0) {
          lag[l] /= k;
          semi[l] /= k;
          l++;
        }
      }
      if (l < 2) return variogram; // Error: Not enough points
    }

    // Feature transformation
    n = l;
    variogram.range = lag[n - 1] - lag[0];
    var X = [1].rep(2 * n);
    var Y = Array(n);
    var A = variogram.A;
    for (i = 0; i < n; i++) {
      switch (model) {
        case 'gaussian':
          X[i * 2 + 1] =
            1.0 - Math.exp(-(1.0 / A) * Math.pow(lag[i] / variogram.range, 2));
          break;
        case 'exponential':
          X[i * 2 + 1] =
            1.0 - Math.exp((-(1.0 / A) * lag[i]) / variogram.range);
          break;
        case 'spherical':
          X[i * 2 + 1] =
            1.5 * (lag[i] / variogram.range) -
            0.5 * Math.pow(lag[i] / variogram.range, 3);
          break;
      }
      Y[i] = semi[i];
    }

    // Least squares
    var Xt = kriging_matrix_transpose(X, n, 2);
    var Z = kriging_matrix_multiply(Xt, X, 2, n, 2);
    Z = kriging_matrix_add(Z, kriging_matrix_diag(1 / alpha, 2), 2, 2);
    var cloneZ = Z.slice(0);
    if (kriging_matrix_chol(Z, 2)) kriging_matrix_chol2inv(Z, 2);
    else {
      kriging_matrix_solve(cloneZ, 2);
      Z = cloneZ;
    }
    var W = kriging_matrix_multiply(
      kriging_matrix_multiply(Z, Xt, 2, 2, n),
      Y,
      2,
      n,
      1,
    );

    // Variogram parameters
    variogram.nugget = W[0];
    variogram.sill = W[1] * variogram.range + variogram.nugget;
    variogram.n = x.length;

    // Gram matrix with prior
    n = x.length;
    var K = Array(n * n);
    for (i = 0; i < n; i++) {
      for (j = 0; j < i; j++) {
        K[i * n + j] = variogram.model(
          Math.pow(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2), 0.5),
          variogram.nugget,
          variogram.range,
          variogram.sill,
          variogram.A,
        );
        K[j * n + i] = K[i * n + j];
      }
      K[i * n + i] = variogram.model(
        0,
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      );
    }

    // Inverse penalized Gram matrix projected to target vector
    var C = kriging_matrix_add(K, kriging_matrix_diag(sigma2, n), n, n);
    var cloneC = C.slice(0);
    if (kriging_matrix_chol(C, n)) kriging_matrix_chol2inv(C, n);
    else {
      kriging_matrix_solve(cloneC, n);
      C = cloneC;
    }

    // Copy unprojected inverted matrix as K
    var K = C.slice(0);
    var M = kriging_matrix_multiply(C, t, n, n, 1);
    variogram.K = K;
    variogram.M = M;

    return variogram;
  };

  // Model prediction
  kriging.predict = function (x, y, variogram) {
    var i,
      k = Array(variogram.n);
    for (i = 0; i < variogram.n; i++)
      k[i] = variogram.model(
        Math.pow(
          Math.pow(x - variogram.x[i], 2) + Math.pow(y - variogram.y[i], 2),
          0.5,
        ),
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      );
    return kriging_matrix_multiply(k, variogram.M, 1, variogram.n, 1)[0];
  };
  kriging.variance = function (x, y, variogram) {
    var i,
      k = Array(variogram.n);
    for (i = 0; i < variogram.n; i++)
      k[i] = variogram.model(
        Math.pow(
          Math.pow(x - variogram.x[i], 2) + Math.pow(y - variogram.y[i], 2),
          0.5,
        ),
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      );
    return (
      variogram.model(
        0,
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      ) +
      kriging_matrix_multiply(
        kriging_matrix_multiply(k, variogram.K, 1, variogram.n, variogram.n),
        k,
        1,
        variogram.n,
        1,
      )[0]
    );
  };

  // Gridded matrices or contour paths
  kriging.grid = function (polygons, variogram, width) {
    var i,
      j,
      k,
      n = polygons.length;
    if (n == 0) return;

    // Boundaries of polygons space
    var xlim = [polygons[0][0][0], polygons[0][0][0]];
    var ylim = [polygons[0][0][1], polygons[0][0][1]];
    for (
      i = 0;
      i < n;
      i++ // Polygons
    )
      for (j = 0; j < polygons[i].length; j++) {
        // Vertices
        if (polygons[i][j][0] < xlim[0]) xlim[0] = polygons[i][j][0];
        if (polygons[i][j][0] > xlim[1]) xlim[1] = polygons[i][j][0];
        if (polygons[i][j][1] < ylim[0]) ylim[0] = polygons[i][j][1];
        if (polygons[i][j][1] > ylim[1]) ylim[1] = polygons[i][j][1];
      }

    // Alloc for O(n^2) space
    var xtarget, ytarget;
    var a = Array(2),
      b = Array(2);
    var lxlim = Array(2); // Local dimensions
    var lylim = Array(2); // Local dimensions
    var x = Math.ceil((xlim[1] - xlim[0]) / width);
    var y = Math.ceil((ylim[1] - ylim[0]) / width);

    var A = Array(x + 1);
    for (i = 0; i <= x; i++) A[i] = Array(y + 1);
    for (i = 0; i < n; i++) {
      // Range for polygons[i]
      lxlim[0] = polygons[i][0][0];
      lxlim[1] = lxlim[0];
      lylim[0] = polygons[i][0][1];
      lylim[1] = lylim[0];
      for (j = 1; j < polygons[i].length; j++) {
        // Vertices
        if (polygons[i][j][0] < lxlim[0]) lxlim[0] = polygons[i][j][0];
        if (polygons[i][j][0] > lxlim[1]) lxlim[1] = polygons[i][j][0];
        if (polygons[i][j][1] < lylim[0]) lylim[0] = polygons[i][j][1];
        if (polygons[i][j][1] > lylim[1]) lylim[1] = polygons[i][j][1];
      }

      // Loop through polygon subspace
      a[0] = Math.floor(
        (lxlim[0] - ((lxlim[0] - xlim[0]) % width) - xlim[0]) / width,
      );
      a[1] = Math.ceil(
        (lxlim[1] - ((lxlim[1] - xlim[1]) % width) - xlim[0]) / width,
      );
      b[0] = Math.floor(
        (lylim[0] - ((lylim[0] - ylim[0]) % width) - ylim[0]) / width,
      );
      b[1] = Math.ceil(
        (lylim[1] - ((lylim[1] - ylim[1]) % width) - ylim[0]) / width,
      );
      for (j = a[0]; j <= a[1]; j++)
        for (k = b[0]; k <= b[1]; k++) {
          xtarget = xlim[0] + j * width;
          ytarget = ylim[0] + k * width;
          if (polygons[i].pip(xtarget, ytarget))
            A[j][k] = kriging.predict(xtarget, ytarget, variogram);
        }
    }
    A.xlim = xlim;
    A.ylim = ylim;
    A.zlim = [variogram.t.min(), variogram.t.max()];
    A.width = width;
    return A;
  };
  kriging.contour = function (value, polygons, variogram) { };

  // Plotting on the DOM
  kriging.plot = function (canvas, grid, xlim, ylim, colors) {
    // Clear screen
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Starting boundaries
    var range = [
      xlim[1] - xlim[0],
      ylim[1] - ylim[0],
      grid.zlim[1] - grid.zlim[0],
    ];
    var i, j, x, y, z;
    var n = grid.length;
    var m = grid[0].length;
    var wx = Math.ceil((grid.width * canvas.width) / (xlim[1] - xlim[0]));
    var wy = Math.ceil((grid.width * canvas.height) / (ylim[1] - ylim[0]));
    for (i = 0; i < n; i++)
      for (j = 0; j < m; j++) {
        if (grid[i][j] == undefined) continue;
        x =
          (canvas.width * (i * grid.width + grid.xlim[0] - xlim[0])) / range[0];
        y =
          canvas.height *
          (1 - (j * grid.width + grid.ylim[0] - ylim[0]) / range[1]);
        z = (grid[i][j] - grid.zlim[0]) / range[2];
        if (z < 0.0) z = 0.0;
        if (z > 1.0) z = 1.0;

        ctx.fillStyle = colors[Math.floor((colors.length - 1) * z)];
        ctx.fillRect(Math.round(x - wx / 2), Math.round(y - wy / 2), wx, wy);
      }
  };

  return kriging;
})();

export default VideoAnalysisScreen;
