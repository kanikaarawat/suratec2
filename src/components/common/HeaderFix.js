import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  BackHandler,
} from 'react-native';
import {
  Header,
  Left,
  Body,
  Right,
  Icon,
  Title,
} from 'native-base';
import UI from '../../config/styles/CommonStyles';


export default class HeaderFix extends Component {
  componentDidMount() {
    this.backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        this.handleBackButtonPress
    );
  }

  componentWillUnmount() {
    if (this.backHandler) {
      this.backHandler.remove();
    }
  }

  handleBackButtonPress = () => {
    if (this.props.onpress_left) {
      this.props.onpress_left();
      return true; // Prevent default behavior (exit app)
    }
    return false; // Allow default behavior if no custom handler
  };

  render() {
    return (
        <View>
          <Header style={{ backgroundColor: UI.color_Gradient[1] }}>
            <TouchableOpacity
                onPress={this.props.onpress_left}
                style={{ flex: 10, flexDirection: 'row' }}
            >
              <Left style={{ flex: 2 }}>
                {this.props.icon_left ? (
                    <Image
                        source={require('../../assets/image/leftback.png')}
                        tintColor={"#fff"}
                        style={{ width: 18, height: 18, marginLeft: 10 }}
                    />
                ) : null}
              </Left>
              <Body style={{ flex: 8, alignItems: 'center' }}>
                <Title style={{ color: "#fff" }}>{this.props.title}</Title>
              </Body>
            </TouchableOpacity>

            <Right style={{ flex: 2, marginRight: 10 }}>
              {this.props.icon_rigth ? (
                  <TouchableOpacity onPress={this.props.onpress_rigth}>
                    {this.props.iconType ? (
                        <Image
                            source={require('../../assets/image/more.png')}
                            tintColor={"#fff"}
                            style={{ width: 18, height: 18, marginLeft: 10 }}
                        />
                    ) : (
                        <Icon name={this.props.icon_rigth} style={{ color: '#ffffff' }} />
                    )}
                  </TouchableOpacity>
              ) : null}
            </Right>
          </Header>
        </View>
    );
  }
}
