import React, { Component } from 'react';
import { View, Modal, Image, Dimensions } from 'react-native';

import Header from '../../common/HeaderFix';
import ButtonFix from '../../common/ButtonFix';

export default class LangModal extends Component {

    render() {
        let modalContent = null;
        if (this.props.modalVisible) {
            modalContent = (
                <View style={{ flex: 1 }}>
                    <Header
                        icon_left={"close"}
                        onpress_left={this.props.onModalClosed}
                        title={this.props.title}
                    />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Image
                            style={{ width: '50%', resizeMode: 'contain' }}
                            source={require('../../../assets/image/icons/change.png')}
                        />
                    </View>
                    <View style={{ height : '15%' }}></View>
                    <View style={{ flex: 1,flexDirection:"column",alignItems:'center',justifyContent:'center' }}>
                        <View style={{ height : '15%' }}></View>
                        <ButtonFix rounded={true} title={this.props.labelBtn} onPress={this.props.onLang} />
                    </View>
                </View>
            );
        }

        return (
            <Modal
                supportedOrientations={[
                    'portrait',
                    //'landscape'
                ]}
                onRequestClose={this.props.onModalClosed}
                visible={modalContent !== null}
                animationType="slide">
                <View style={{
                    flex: 1,
                    backgroundColor: 'white',
                }}>
                    {modalContent}
                </View>
            </Modal>
        );
    }
}
