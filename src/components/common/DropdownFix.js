import React, {Component} from 'react';
import {View, Platform} from 'react-native';
import Text from './TextFix';
// import Dropdown from 'react-native-picker-select';

export default class DropdownFix extends Component {
  render() {
    return (
      <View style={{padding: 10}}>
        <Text styles={{fontSize: 15, paddingBottom: 5}}>
          {this.props.title}
        </Text>
        <View
          style={{
            borderColor: '#ddd',
            borderWidth: 1,
            borderRadius: 10,
            shadowOffset: {width: 0, height: 2},
            padding: Platform.OS === 'ios' ? 10 : null,
          }}>
          {/* <Dropdown
            placeholder={this.props.placeholder}
            onValueChange={this.props.onValueChange}
            items={this.props.items}
            ref={this.props.ref}
            onUpArrow={this.props.onUpArrow}
            onDownArrow={this.props.onDownArrow}
          /> */}
        </View>
      </View>
    );
  }
}
