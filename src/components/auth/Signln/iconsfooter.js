import React, { Component } from 'react'
import { TouchableOpacity, Image, Text, View } from 'react-native';
import { Col, Row, Grid } from "react-native-easy-grid";

export default class iconsfooter extends Component {
    render() {
        return (
            <View style={{ flex: 1 }} >
                <Grid>
                    <Col>
                        {/* <TouchableOpacity style={{ alignItems: 'center' }} onPress={this.props.onFacebook} >
                            <Image
                                style={{ width: 50, height: 50 }}
                                source={require('../../../assets/social/facebook.png')}
                            />
                        </TouchableOpacity> */}
                    </Col>
                    <Col >
                        {/* Facebook login removed */}

                        {/* <TouchableOpacity style={{ alignItems: 'center' }} onPress={this.props.onTwitter} >
                            <Image
                                style={{ width: 50, height: 50 }}
                                source={require('../../../assets/social/twitter.png')}
                            />
                        </TouchableOpacity> */}
                    </Col>
                    <Col >
                        {/* <TouchableOpacity style={{ alignItems: 'center' }} onPress={this.props.onGoogle} >
                            <Image
                                style={{ width: 50, height: 50 }}
                                source={require('../../../assets/social/google-plus.png')}
                            />
                        </TouchableOpacity> */}
                    </Col>
                </Grid>
            </View>
        )
    }
}
