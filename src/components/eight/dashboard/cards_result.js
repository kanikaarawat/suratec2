import React, {Component} from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import Text from '../../common/TextFix';
import UI from '../../../config/styles/CommonStyles';

export default class cards_result extends Component {
  render() {
    const header = this.props.header.map((el, index) => (
      <View key={index}>
        <Text styles={{color: '#ffffff'}}>{el}</Text>
      </View>
    ));

    const body = this.props.data.map((el, index) => (
      <View key={index} style={styles.rowClick}>
        <Text styles={{flex: 2}}>{el.nameZone}</Text>
        <Text styles={{flex: 1}}>{el.valueWalk}</Text>
        <View style={styles.rowIcon}>
          <Text numberOfLines={1}>{''}</Text>
          <Text>{el.valueRun}</Text>
        </View>
      </View>
    ));

    return (
      <View>
        <View style={{flexDirection: 'row'}}>
          <View style={{marginLeft: 20, flex: 1, alignSelf: 'center'}}></View>
          <Text styles={{alignSelf: 'center', paddingHorizontal: 5}}>
            Analysis of Peak Pressure (kPa)
          </Text>
          <View style={{marginRight: 20, flex: 1, alignSelf: 'center'}}></View>
        </View>
        <View style={{padding: 15}}>
          <View style={styles.card}>
            <View style={[styles.header]}>{header}</View>
            <ScrollView>
              <View>{body}</View>
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: UI.color_Gradient[1],
    padding: 10,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dddddd',
    marginTop: 0,
    borderRadius: 4,
    marginBottom: 5,
  },
  rowClick: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rowIcon: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
    // paddingLeft: 5
  },
});
