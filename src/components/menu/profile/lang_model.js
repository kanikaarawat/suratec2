import React, { Component } from 'react';
import { View, Modal, Image, ScrollView, Text, TouchableOpacity } from 'react-native';

import Header from '../../common/HeaderFix';
import ButtonFix from '../../common/ButtonFix';
import { getLangKeysSize, getLocalizedText, langKeys } from '../../../assets/language/langUtils';
import { connect } from 'react-redux';

class LangModal extends Component {
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
                            {/* Loop through langKeys and display them as options */}
                            {langKeys.map((lang, index) => (
                                <TouchableOpacity
                                    key={lang}
                                    style={{
                                        paddingVertical: 10,
                                        paddingHorizontal: 20,
                                        backgroundColor: this.props.lang === index ? '#d1d1d1' : '#f5f5f5',
                                        borderRadius: 20,
                                        marginBottom: 10,
                                    }}
                                    onPress={() => this.props.onSelectLang(index)} // Pass the index to select the language
                                >
                                    <Text style={{ fontSize: 18, color: 'black' }}>
                                        {getLocalizedText(index, { 'eng': lang === 'eng' ? 'English' : '', 'thai': lang === 'thai' ? 'ภาษาไทย' : '', 'japanese': lang === 'japanese' ? '日本語' : '' })}
                                    </Text>
                                </TouchableOpacity>
                            ))}
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

const mapStateToProps = state => ({
    lang: state.lang,
});

export default connect(mapStateToProps)(LangModal);
