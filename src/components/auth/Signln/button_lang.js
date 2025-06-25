import React, { Component } from 'react'
import { TouchableOpacity, View, Image } from 'react-native';

import Text from '../../common/TextFix';
import UI from '../../../config/styles/CommonStyles'


export default class button_lang extends Component {
    render() {
        return (

            <View>

                <TouchableOpacity style={{ alignItems: 'center' }} onPress={this.props.onLang} >
                    <Image
                        style={{ width: 50, height: 50 }}
                        source={require('../../../assets/image/icons/change.png')}
                    />
                    <View style={{ padding: 5 }}><Text style={{ fontSize: 10 }}>{this.props.labelLang}</Text></View>
                </TouchableOpacity>

            </View>

        )
    }
}
