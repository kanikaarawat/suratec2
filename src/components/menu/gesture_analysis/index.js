import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Image, StyleSheet, BackHandler } from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import Text from '../../common/TextFix';
import axios from 'axios';
// import FabChatbot from '../../common/FabChatbot';
import LangHome from '../../../assets/language/screen/lang_home';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';

const GALLERY_ICON = require('../../../assets/image/gesture_analysis/gallery.png');
const DELETE_ICON = require('../../../assets/image/gesture_analysis/delete.png');


function formatUpdatedDate(dateString) {
  if (!dateString) return '';
  // Convert to DD/MM/YYYY (strip time if present)
  const datePart = dateString.split('T')[0] || dateString.split(' ')[0];
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
}

const GestureAnalysis = (props) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = props.navigation;

  useEffect(() => {
    console.log('[GESTURE_ANALYSIS] useEffect (fetchVideos) triggered');
    const fetchVideos = async () => {
      if (!props.token || !props.id_member) {
        console.log('[GESTURE_ANALYSIS] Missing token or id_member:', { token: !!props.token, id_member: props.id_member });
        setError('Missing authentication data');
        setLoading(false);
        return;
      }
      try {
        const url = `https://api1.suratec.co.th/api/video/list/${props.id_member}`;
        console.log('[GESTURE_ANALYSIS] Fetching videos from API URL:', url);
        const res = await axios.get(url, {
          headers: { 
            Authorization: `Bearer ${props.token}`,
            'Content-Type': 'application/json'
          },
        });
        console.log('[GESTURE_ANALYSIS] API Response:', res.data);
        let videoData = [];
        if (res.data && Array.isArray(res.data)) {
          videoData = res.data;
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
          videoData = res.data.data;
        } else if (res.data && res.data.videos && Array.isArray(res.data.videos)) {
          videoData = res.data.videos;
        }
        console.log('[GESTURE_ANALYSIS] Processed video data:', videoData);
        setVideos(videoData);
        setError(null);
      } catch (e) {
        console.error('[GESTURE_ANALYSIS] Error fetching videos:', e);
        console.error('[GESTURE_ANALYSIS] Error response:', e.response?.data);
        setError(e.response?.data?.message || e.message || 'Failed to fetch videos');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [props.id_member, props.token]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[NAVIGATION] Back button pressed in Gesture Analysis, navigating to Home');
      navigation.navigate('Home');
      return true;
    });
    return () => backHandler.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f6fcff' }}>
      <HeaderFix
        title="Gesture Analysis"
        lang={props.lang}
        icon_left={true}
        onpress_left={() => navigation.navigate('Home')}
      />
      <View style={{ flex: 1, padding: 12 }}>
        {(!loading && videos.length === 0) ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text styles={{ fontSize: 20, color: '#888', textAlign: 'center' }}>
              No gesture analysis videos have been uploaded yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id?.toString() || item.video_id?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              console.log('[GESTURE_ANALYSIS] Rendering video item:', item),
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  console.log('[NAVIGATION] Gesture Analysis video selected:', item);
                  if (item && item.video_url) {
                    console.log('[GestureAnalysis] onSelectVideo called with:', item.video_url);
                    navigation.navigate('VideoAnalysis', {
                      videoId: item.id || item.video_id,
                      videoUri: item.video_url,
                    });
                  } else {
                    console.warn('[GESTURE_ANALYSIS] Missing video_url in item:', item);
                  }
                }}
              >
                <Image source={GALLERY_ICON} style={styles.icon} resizeMode="contain" />
                <Text styles={styles.dateText}>{formatUpdatedDate(item.created_at)}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}
      </View>
      {/* <FabChatbot onPress={() => navigation.navigate('Chatbot')} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00bfc5',
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#00bfc5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    width: 36,
    height: 36,
    marginRight: 18,
  },
  dateText: {
    flex: 1,
    fontSize: 22,
    color: '#00bfc5',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteBtn: {
    marginLeft: 18,
    padding: 6,
  },
  deleteIcon: {
    width: 28,
    height: 28,
  },
});

const mapStateToProps = state => ({
  lang: state.lang,
  token: state.token,
  id_member: state.user?.id_member || state.user?.id_customer,
});

export default withNavigation(connect(mapStateToProps)(GestureAnalysis)); 