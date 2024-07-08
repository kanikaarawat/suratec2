import React, { Component } from 'react';
import { View, Modal, Image, StatusBar, ActivityIndicator } from 'react-native';


import TextFix from '../common/TextFix';

export default class LoadingModal extends Component {

    render() {
        let modalContent = null;
        if (this.props.modalVisible) {
            modalContent = (
                <View style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                }}>
                    <ActivityIndicator size="large" color="#00ff00"/>
                    <View style={{height : '2%'}}></View>
                    <TextFix type={'bold'}>กำลังค้นหาอุปกรณ์</TextFix>
                </View>
            );
        }

        return (
            <Modal
                // supportedOrientations={[
                //     'portrait',
                //     //'landscape'
                // ]}
                transparent={true}
                animationType={'none'}
                onRequestClose={this.props.onModalClosed}
                visible={modalContent !== null}
            >
                <View style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1,
                    backgroundColor: '#00000040'
                }}>
                    {modalContent}
                </View>
            </Modal>
        );
    }
}
