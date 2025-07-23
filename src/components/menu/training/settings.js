import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, Button, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { connect } from 'react-redux';
import * as Svg from 'react-native-svg';
import API from '../../../config/Api';
import HeaderFix from '../../common/HeaderFix';

function WalkTrainingSettings({ user, navigation }) {
  const [values, setValues] = useState({
    left_toe_touch: '',
    right_toe_touch: '',
    left_forefoot: '',
    right_forefoot: '',
    left_midfoot: '',
    right_midfoot: '',
    left_heel: '',
    right_heel: '',
    left_full_weight: '',
    right_full_weight: '',
  });
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const snackbarAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user && user.id_customer) {
      fetchWalkTrainingData();
    }
  }, [user]);

  const fetchWalkTrainingData = async () => {
    try {
      const response = await fetch(`https://api1.suratec.co.th/walktrainingdata/view/${user.id_customer}`);
      const data = await response.json();
      if (data.message) {
        setValues({
          left_toe_touch: data.message.left_toe_touch?.toString() || '',
          right_toe_touch: data.message.right_toe_touch?.toString() || '',
          left_forefoot: data.message.left_forefoot?.toString() || '',
          right_forefoot: data.message.right_forefoot?.toString() || '',
          left_midfoot: data.message.left_midfoot?.toString() || '',
          right_midfoot: data.message.right_midfoot?.toString() || '',
          left_heel: data.message.left_heel?.toString() || '',
          right_heel: data.message.right_heel?.toString() || '',
          left_full_weight: data.message.left_full_weight?.toString() || '',
          right_full_weight: data.message.right_full_weight?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error fetching walk training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value.replace(/[^0-9.]/g, '') }));
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setSuccessMsg('');
    try {
      const payload = {
        id_customer: user.id_customer,
        left_toe_touch: Number(values.left_toe_touch),
        right_toe_touch: Number(values.right_toe_touch),
        left_forefoot: Number(values.left_forefoot),
        right_forefoot: Number(values.right_forefoot),
        left_midfoot: Number(values.left_midfoot),
        right_midfoot: Number(values.right_midfoot),
        left_heel: Number(values.left_heel),
        right_heel: Number(values.right_heel),
        left_full_weight: Number(values.left_full_weight),
        right_full_weight: Number(values.right_full_weight),
      };
      const response = await fetch('https://api1.suratec.co.th/walktrainingdata/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSuccessMsg('Successfully changed the walking training settings');
        setShowSnackbar(true);
        Animated.timing(snackbarAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        setTimeout(() => {
          Animated.timing(snackbarAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowSnackbar(false));
        }, 2500);
      } else {
        setSuccessMsg('Failed to update settings');
      }
    } catch (e) {
      setSuccessMsg('Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <HeaderFix
        icon_left={'left'}
        onpress_left={() => navigation.goBack()}
        title={'Walk Training Settings'}
      />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.labelTitle, { color: '#00a2a2', marginTop: 12, marginBottom: 4 }]}>Set ground force reaction zone (% BW)</Text>
          <View style={[styles.feetRow, { marginBottom: 2, marginTop: 2 }]}>
            <View style={styles.footContainer}>
              <Svg.Svg width={45} height={120} viewBox="0 0 382.38 1010.54">
                <Svg.Path
                  fill="#00a2a2"
                  d="M211,1010.19a153.23,153.23,0,0,0,15.74-.84H195.63A151.93,151.93,0,0,0,211,1010.19Z"
                  transform="translate(0 0)"
                />
                <Svg.Path
                  fill="#00a2a2"
                  d="M364.26,759.82c-5-26.36-12.86-52-20.44-76.88-4.93-16.16-10-32.87-14.28-49.56-1.93-7.57-4.5-15-5.89-22.46H56.34c4,39.25,2.11,79.19.14,120.42-1,22-2.12,44.69-2.22,67.16-.27,63.6,8,152.89,82.84,194a152.1,152.1,0,0,0,58.07,18h31a152.82,152.82,0,0,0,86.65-38.4C377.7,913.7,376.6,824.49,364.26,759.82Z"
                  transform="translate(0 0)"
                />
                <Svg.Path
                  fill="#00a2a2"
                  d="M1.93,308.16c-2.66,34-2.59,66.19.35,96,4.26,43.28,17.86,80.77,35.19,125.29,4,13.81,8.45,28.25,12.48,41.09a342.5,342.5,0,0,1,6.51,40.79H324c-7.8-41.4-7.21-80.4,1.86-118.55,6.46-27.25,15.88-54.21,25-80.29,6.88-19.7,14-40.07,19.85-60.54a333.92,333.92,0,0,0,9.39-43.79Z"
                  transform="translate(0 0)"
                />
                <Svg.Path
                  fill="#00a2a2"
                  d="M380.15,308.16a292.35,292.35,0,0,0-2.82-90.07c-16.46-88-42.54-174.16-120.56-208.76-.21-.09-.42-.18-.64-.25s-.52-.25-.81-.37C200.46-12.56,133.87,6.08,93.33,54,36.52,121.28,14.43,212.3,5.87,276.83c-1.23,9.3-2.2,18.46-3,27.52l-.37,3.81Z"
                  transform="translate(0 0)"
                />
              </Svg.Svg>
              <Text style={styles.footLabel}>Left Foot</Text>
            </View>
            <View style={styles.footContainer}>
              <Svg.Svg width={45} height={120} viewBox="0 0 387.21 1023.36">
                <Svg.Path
                  fill="#00a2a2"
                  d="M173.54,1023.05a154.31,154.31,0,0,1-15.94-.86h31.51A152.79,152.79,0,0,1,173.54,1023.05Z"
                  transform="translate(-0.05 0)"
                />
                <Svg.Path
                  fill="#00a2a2"
                  d="M70,984.47a154.76,154.76,0,0,0,87.76,38.89h31.49A154,154,0,0,0,248,1005.14c75.77-41.63,84.17-132,83.9-196.44-.1-22.76-1.2-45.77-2.25-68-2-41.78-3.88-82.18.14-121.94H59.09c-1.41,7.5-4,15-6,22.75-4.3,16.89-9.47,33.82-14.46,50.17C31,716.82,23,742.79,17.92,769.53,5.45,834.94,4.34,925.38,70,984.47Z"
                  transform="translate(-0.05 0)"
                />
                <Svg.Path
                  fill="#00a2a2"
                  d="M385.3,312.08c2.7,34.42,2.62,67-.36,97.27-4.31,43.79-18.08,81.76-35.63,126.84-4.07,14-8.56,28.61-12.65,41.62a349.17,349.17,0,0,0-6.58,41.29H59.1c7.9-42,7.3-81.45-1.84-120-6.54-27.6-16.09-54.91-25.32-81.32-7-19.95-14.18-40.58-20.1-61.31A338.25,338.25,0,0,1,2.3,312.08Z"
                  transform="translate(-0.05 0)"
                />
                <Svg.Path
                  fill="#00a2a2"
                  d="M2.3,312.08a296,296,0,0,1,2.85-91.21C21.82,131.74,48.19,44.44,127.2,9.45c.21-.09.42-.18.64-.25a8.58,8.58,0,0,1,.82-.37c55.56-21.54,123-2.67,164.06,45.9C350.3,122.82,372.62,215,381.3,280.36c1.24,9.43,2.23,18.69,3.08,27.88l.37,3.85Z"
                  transform="translate(-0.05 0)"
                />
              </Svg.Svg>
              <Text style={styles.footLabel}>Right Foot</Text>
            </View>
          </View>

          <Text style={[styles.labelTitleSmall, { marginTop: 6, marginBottom: 4 }]}>Toe touch</Text>
          <View style={[styles.combinedBox, { marginBottom: 6, paddingVertical: 6, paddingHorizontal: 12 }]}>
            <TextInput
              style={styles.combinedText}
              value={values.left_toe_touch}
              onChangeText={(v) => handleInputChange('left_toe_touch', v)}
              keyboardType="numeric"
              editable={!updating}
            />
            <TextInput
              style={styles.combinedText}
              value={values.right_toe_touch}
              onChangeText={(v) => handleInputChange('right_toe_touch', v)}
              keyboardType="numeric"
              editable={!updating}
            />
          </View>

          <Text style={[styles.labelTitleSmall, { marginTop: 6, marginBottom: 4 }]}>Partial weight</Text>
          <View style={[styles.partialWeightBox, { marginBottom: 6, paddingVertical: 4, paddingHorizontal: 6 }]}>
            <View style={styles.partialRow}>
              <TextInput
                style={styles.partialValue}
                value={values.left_forefoot}
                onChangeText={(v) => handleInputChange('left_forefoot', v)}
                keyboardType="numeric"
                editable={!updating}
              />
              <Text style={styles.partialLabel}>Forefoot</Text>
              <TextInput
                style={styles.partialValue}
                value={values.right_forefoot}
                onChangeText={(v) => handleInputChange('right_forefoot', v)}
                keyboardType="numeric"
                editable={!updating}
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.partialRow}>
              <TextInput
                style={styles.partialValue}
                value={values.left_midfoot}
                onChangeText={(v) => handleInputChange('left_midfoot', v)}
                keyboardType="numeric"
                editable={!updating}
              />
              <Text style={styles.partialLabel}>Midfoot</Text>
              <TextInput
                style={styles.partialValue}
                value={values.right_midfoot}
                onChangeText={(v) => handleInputChange('right_midfoot', v)}
                keyboardType="numeric"
                editable={!updating}
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.partialRow}>
              <TextInput
                style={styles.partialValue}
                value={values.left_heel}
                onChangeText={(v) => handleInputChange('left_heel', v)}
                keyboardType="numeric"
                editable={!updating}
              />
              <Text style={styles.partialLabel}>Heel</Text>
              <TextInput
                style={styles.partialValue}
                value={values.right_heel}
                onChangeText={(v) => handleInputChange('right_heel', v)}
                keyboardType="numeric"
                editable={!updating}
              />
            </View>
          </View>

          <Text style={[styles.labelTitleSmall, { marginTop: 6, marginBottom: 4 }]}>Full weight</Text>
          <View style={[styles.combinedBox, { marginBottom: 6, paddingVertical: 6, paddingHorizontal: 12 }]}>
            <TextInput
              style={styles.combinedText}
              value={values.left_full_weight}
              onChangeText={(v) => handleInputChange('left_full_weight', v)}
              keyboardType="numeric"
              editable={!updating}
            />
            <TextInput
              style={styles.combinedText}
              value={values.right_full_weight}
              onChangeText={(v) => handleInputChange('right_full_weight', v)}
              keyboardType="numeric"
              editable={!updating}
            />
          </View>
          <View style={{ height: 10 }} />
          <TouchableOpacity
  style={{
    backgroundColor: updating ? '#aadcd8' : '#007f7f',
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
    width: '85%',
    alignSelf: 'center',
    opacity: updating ? 0.6 : 1,
    shadowColor: '#004d4d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }}
  onPress={handleUpdate}
  disabled={updating}
>
  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 18, letterSpacing: 0.5 }}>
    {updating ? 'Updating...' : 'Update Settings'}
  </Text>
</TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
        {showSnackbar && (
          <Animated.View style={{
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 30,
  paddingHorizontal: 20,
  opacity: snackbarAnim,
  transform: [{ translateY: snackbarAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
  zIndex: 999,
}}>
  <View style={{
    backgroundColor: '#e6f4f1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#b5ded7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  }}>
    <Text style={{
      color: '#005e5e',
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 20,
      textAlign: 'center',
    }}>
      Successfully updated the settings
    </Text>
  </View>
</Animated.View>

        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(WalkTrainingSettings);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#00a2a2',
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 0,
    backgroundColor: '#fff',
  },
  feetRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    marginBottom: 6,
    marginTop: 6,
  },
  footContainer: {
    alignItems: 'center',
    flex: 1,
  },
  footLabel: {
    color: '#00a2a2',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 4,
    marginBottom: 6,
    textAlign: 'center',
  },
  labelTitle: {
    color: '#00a2a2',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  labelTitleSmall: {
    color: '#00a2a2',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  partialWeightBox: {
    width: '70%',
    borderWidth: 1.5,
    borderColor: '#00a2a2',
    borderRadius: 18,
    paddingVertical: 6,
    marginBottom: 12,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  partialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  partialValue: {
    fontSize: 20,
    color: '#00a2a2',
    fontWeight: 'bold',
    width: 50,
    textAlign: 'center',
  },
  partialLabel: {
    color: '#00a2a2',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#00a2a2',
    opacity: 0.5,
    marginVertical: 2,
    marginHorizontal: 8,
  },
  combinedBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '70%',
    borderWidth: 1.5,
    borderColor: '#00a2a2',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    marginBottom: 12,
    alignSelf: 'center',
  },
  combinedText: {
    fontSize: 20,
    color: '#00a2a2',
    fontWeight: 'bold',
  },
});
