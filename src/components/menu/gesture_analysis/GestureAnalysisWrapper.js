import React from 'react';
import GestureAnalysis from './GestureAnalysis';
import { useNavigation } from '@react-navigation/native';

const GestureAnalysisWrapper = (props) => {
  // Prefer navigation from props, fallback to useNavigation
  const navigation = props.navigation || useNavigation();
  const route = props.route;
  const token = props.token;
  const id_member = props.id_member;
  // Prefer token/id_member from props, fallback to route.params
  const _token = token || (route && route.params && route.params.token);
  const _id_member = id_member || (route && route.params && route.params.id_member);

  console.log('GestureAnalysisWrapper - token from props:', !!token);
  console.log('GestureAnalysisWrapper - id_member from props:', id_member);
  console.log('GestureAnalysisWrapper - final token:', !!_token);
  console.log('GestureAnalysisWrapper - final id_member:', _id_member);

  const onSelectVideo = (videoUrl) => {
    navigation.navigate('VideoAnalysis', { videoUri: videoUrl });
  };

  return <GestureAnalysis token={_token} id_member={_id_member} onSelectVideo={onSelectVideo} navigation={navigation} />;
};

export default GestureAnalysisWrapper;