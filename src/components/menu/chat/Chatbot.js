// src/components/menu/chat/Chatbot.js

import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';
import HeaderFix from '../../common/HeaderFix';

const { width, height } = Dimensions.get('window');

export default function Chatbot({ navigation }) {
    return (
        <View style={styles.container}>
            {/* ===== Header Area ===== */}
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => navigation.goBack()}
                title={navigation.getParam('name', 'Chatbot')}
            />

            {/* ===== Chat Display Area ===== */}
            <View style={styles.chatContainer}>
                {/* Empty for now (pure frontend) */}
            </View>

            {/* ===== Input Field ===== */}
            <TextInput
                style={styles.inputBox}
                placeholder="Ask anything"
                placeholderTextColor="#A0A0A0"
                // Since we don’t need functionality now, we leave onChangeText unused
            />
        </View>
    );
}

const HEADER_HEIGHT = 56;
const INPUT_HEIGHT = 48;
const HORIZONTAL_PADDING = 16;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E6FCFB', // light teal background
    },

    // Header
    header: {
        flexDirection: 'row',
        height: HEADER_HEIGHT,
        alignItems: 'center',
        backgroundColor: '#00A499', // teal
        paddingHorizontal: HORIZONTAL_PADDING,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    backButton: {
        width: 24,
    },
    arrowText: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    rightPlaceholder: {
        width: 24,
    },

    // Chat display area (empty card)
    chatContainer: {
        flex: 1,
        marginHorizontal: HORIZONTAL_PADDING,
        marginTop: 20,
        borderWidth: 1.5,
        borderColor: '#00A499',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        // Give it a bit of shadow on iOS
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },

    // Bottom text input
    inputBox: {
        height: INPUT_HEIGHT,
        marginHorizontal: HORIZONTAL_PADDING,
        marginVertical: 12,
        borderWidth: 1.5,
        borderColor: '#00A499',
        borderRadius: 25,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333333',
        backgroundColor: '#FFFFFF',
    },
});
