import React, { Component } from 'react';
import { View, Modal, Image, ScrollView } from 'react-native';

import Header from '../../common/HeaderFix';
import ButtonFix from '../../common/ButtonFix';

export default class LangModal extends Component {
    render() {
        return (
            <Modal
                supportedOrientations={['portrait', 'landscape']}
                onRequestClose={this.props.onModalClosed}
                visible={this.props.modalVisible}
                animationType="slide"
            >
                <View style={{ flex: 1, backgroundColor: 'white' }}>
                    <ScrollView
                        contentContainerStyle={{
                            justifyContent: 'space-between',
                            flexGrow: 1,
                        }}
                    >
                        <Header
                            icon_left="close"
                            onpress_left={this.props.onModalClosed}
                            title={this.props.title}
                        />

                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Image
                                style={{ width: '50%', height: 150, resizeMode: 'contain' }}
                                source={require('../../../assets/image/icons/change.png')}
                            />
                        </View>

                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <ButtonFix
                                rounded={true}
                                title={this.props.labelBtn}
                                onPress={this.props.onLang}
                            />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    }
}
