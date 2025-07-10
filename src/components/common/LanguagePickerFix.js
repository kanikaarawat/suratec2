import React, { Component } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import { getLocalizedText } from '../../assets/language/langUtils';

class LanguagePickerFix extends Component {
    state = {
        langPickerVisible: false,
    };

    getLanguageOptions = () => {
        const { langSwitch } = this.props;
        if (!langSwitch) return [];

        const langKeys = Object.keys(langSwitch);
        return langKeys.map((key, index) => ({
            label: langSwitch[key],
            value: index,
            key: key
        }));
    };

    // Get current language display text dynamically
    getCurrentLanguageText = () => {
        const { lang, langSwitch } = this.props;
        if (!langSwitch) return 'Language';

        const langKeys = Object.keys(langSwitch);
        const currentLangKey = langKeys[lang];
        return langSwitch[currentLangKey] || langSwitch[langKeys[0]]; // fallback to first language
    };

    // Handle language selection
    selectLanguage = (langIndex) => {
        // Call the parent's language change function if provided
        if (this.props.onLanguageChange) {
            this.props.onLanguageChange(langIndex);
        }

        // Update Redux state
        this.props.edit_Lang(langIndex);

        // Close modal
        this.setState({ langPickerVisible: false });
    };

    // Open modal
    openModal = () => {
        this.setState({ langPickerVisible: true });
    };

    // Close modal
    closeModal = () => {
        this.setState({ langPickerVisible: false });
    };

    render() {
        const { lang, style, buttonStyle, textStyle, modalTitle } = this.props;
        const { langPickerVisible } = this.state;

        // Get language options dynamically
        const languageOptions = this.getLanguageOptions();

        if (languageOptions.length === 0) {
            return null; // Don't render if no language options available
        }

        return (
            <View style={[styles.container, style]}>
                {/* Language Trigger Button */}
                <TouchableOpacity
                    style={[styles.languageButton, buttonStyle]}
                    onPress={this.openModal}
                >
                    <Text style={[styles.languageButtonText, textStyle]}>
                        {this.getCurrentLanguageText()} ▼
                    </Text>
                </TouchableOpacity>

                {/* Language Selection Modal */}
                <Modal
                    visible={langPickerVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={this.closeModal}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={this.closeModal}
                    >
                        <View style={styles.modalContent}>
                            {/* Modal Title */}
                            <Text style={styles.modalTitle}>
                                {modalTitle || getLocalizedText(lang, {
                                    eng: 'Select Language',
                                    thai: 'เลือกภาษา',
                                    japanese: '言語を選択'
                                })}
                            </Text>

                            {/* Language Options */}
                            {languageOptions.map(option => (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => this.selectLanguage(option.value)}
                                    style={[
                                        styles.languageOption,
                                        lang === option.value && styles.languageOptionSelected
                                    ]}
                                >
                                    <Text style={[
                                        styles.languageOptionText,
                                        lang === option.value && styles.languageOptionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {/* Close Button */}
                            <TouchableOpacity
                                onPress={this.closeModal}
                                style={styles.modalCloseButton}
                            >
                                <Text style={styles.modalCloseText}>
                                    {getLocalizedText(lang, {
                                        eng: 'Close',
                                        thai: 'ปิด',
                                        japanese: '閉じる'
                                    })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },

    // Button Styles
    languageButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#e0f7fa',
        borderWidth: 1,
        borderColor: '#00c3cc',
    },
    languageButtonText: {
        fontSize: 16,
        color: '#00c3cc',
        fontWeight: 'bold',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        width: 250,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00c3cc',
        textAlign: 'center',
        marginBottom: 15,
    },

    // Language Option Styles
    languageOption: {
        paddingVertical: 12,
        borderRadius: 6,
        marginVertical: 2,
        backgroundColor: '#fff',
    },
    languageOptionSelected: {
        backgroundColor: '#00c3cc',
    },
    languageOptionText: {
        fontSize: 18,
        fontWeight: 'normal',
        textAlign: 'center',
        color: '#00c3cc',
    },
    languageOptionTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },

    // Close Button Styles
    modalCloseButton: {
        marginTop: 10,
    },
    modalCloseText: {
        color: '#00c3cc',
        textAlign: 'center',
        fontSize: 16,
    },
});

// Redux connection
const mapStateToProps = state => ({
    lang: state.lang,
});

const mapDispatchToProps = dispatch => ({
    edit_Lang: data => dispatch({ type: 'EDIT_LANG', payload: data }),
});

export default connect(mapStateToProps, mapDispatchToProps)(LanguagePickerFix);