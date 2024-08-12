import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import {
  Container,
  Header,
  Left,
  Body,
  Right,
  Icon,
  Button,
  Title,
} from 'native-base';
import UI from '../../config/styles/CommonStyles';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default class HeaderFix extends Component {
  render() {
    return (
      <View>
        <Header  style={{ backgroundColor: UI.color_Gradient[1] }}>
          <TouchableOpacity
            onPress={this.props.onpress_left}
            style={{ flex: 10, flexDirection: 'row' }}>


            <Left style={{ flex: 2 }}>
              {this.props.icon_left ? (
              //  <Icon type="AntDesign" name={this.props.icon_left} style={{ color: '#ffffff' }} />
               
               <Image source={require('../../assets/image/leftback.png')} tintColor={"#fff"} style={{ width: 18, height: 18, marginLeft: 10 }} />

              ) : null}
            </Left>
            <Body
              style={{ flex: 8, alignItems: 'center' }}>
              <Title style={{color:"#fff"}} >{this.props.title}</Title>
            </Body>
          </TouchableOpacity>

          <Right style={{ flex: 2, marginRight: 10 }}>
            {this.props.icon_rigth ? (
              <TouchableOpacity onPress={this.props.onpress_rigth}>
                {this.props.iconType ? (
                  // <Icon type={this.props.iconType} name={this.props.icon_rigth} style={{ color: '#ffffff' }} />
                  <Image source={require('../../assets/image/more.png')} tintColor={"#fff"} style={{ width: 18, height: 18, marginLeft: 10 }} />
                ) : (
                  <Icon name={this.props.icon_rigth} style={{ color: '#ffffff' }} />
                )
                }

              </TouchableOpacity>
            ) : null}
          </Right>
        </Header>
      </View>
    );
  }
}
