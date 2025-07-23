import React from 'react';
import GestureAnalysis from './GestureAnalysis';

const GestureAnalysisWrapper = ({ navigation, route, token, id_member }) => {
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

  return <GestureAnalysis navigation={navigation} token={_token} id_member={_id_member} onSelectVideo={onSelectVideo} />;
};

export default GestureAnalysisWrapper; 