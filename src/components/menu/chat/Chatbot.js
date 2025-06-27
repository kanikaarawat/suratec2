// src/components/menu/chat/Chatbot.js

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, Dimensions, Platform, KeyboardAvoidingView,
    Image, PermissionsAndroid, ActivityIndicator
} from 'react-native';
import { connect } from 'react-redux';
import Sound from 'react-native-sound';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import HeaderFix from '../../common/HeaderFix';
import Toast from 'react-native-simple-toast';
import langChatbot from '../../../assets/language/menu/lang_chatbot';

const { width } = Dimensions.get('window');
const audioRecorderPlayer = new AudioRecorderPlayer();

function Chatbot({ navigation, user, token, lang }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [inputDisabled, setInputDisabled] = useState(false);
    const scrollRef = useRef();
    const soundRef = useRef(null);

    const langKey = lang === 1 ? 'thai' : 'eng';
    const titleText = langChatbot.title[langKey];
    const sendText = langChatbot.send[langKey];

    const scrollToEnd = () => {
        scrollRef.current?.scrollToEnd({ animated: true });
    };

    const addMessage = (type, text, audio = null) => {
        setMessages(prev => {
            const updated = [...prev, { type, text, audio }];
            setTimeout(scrollToEnd, 100);
            return updated;
        });
    };

    const getAuthFormData = () => {
        if (!token || !user?.id_customer) {
            Toast.show('Missing user/token');
            return null;
        }
        return {
            token: token,
            userId: user.id_customer,
        };
    };

    const sendMessageToAPI = async (formData) => {
        setIsTyping(true);
        try {
            const res = await fetch('https://www.surasole.com/api/voice-chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data' },
                body: formData,
            });

            const data = await res.json();
            if (data?.text_response) {
                addMessage('bot', data.text_response, data.voice_url);
            } else {
                Toast.show('No response from server');
            }
        } catch (error) {
            console.error('Chatbot API error:', error);
            Toast.show('Chatbot API failed');
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendText = async () => {
        if (!input.trim() || inputDisabled) return;

        const message = input.trim();
        setInput('');
        setInputDisabled(true);
        addMessage('user', message);

        const auth = getAuthFormData();
        if (!auth) return;

        const formData = new FormData();
        formData.append('text', message);
        formData.append('security_token', auth.token);
        formData.append('user_id', auth.userId);

        await sendMessageToAPI(formData);
        setTimeout(() => setInputDisabled(false), 1000);
    };

    const startRecording = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Toast.show('Microphone permission denied');
                return;
            }
        }

        try {
            await audioRecorderPlayer.removeRecordBackListener();
            await audioRecorderPlayer.startRecorder();
            setIsRecording(true);
        } catch (err) {
            console.error('Recording error:', err);
        }
    };

    const stopRecording = async () => {
        try {
            const filePath = await audioRecorderPlayer.stopRecorder();
            await audioRecorderPlayer.removeRecordBackListener();
            setIsRecording(false);

            if (!filePath) {
                Toast.show('Recording failed');
                return;
            }

            addMessage('user', '🎤 Voice message sent');

            const auth = getAuthFormData();
            if (!auth) return;

            const formData = new FormData();
            formData.append('audio_file', {
                uri: Platform.OS === 'android' ? 'file://' + filePath : filePath,
                name: 'voice.mp4',
                type: 'audio/mp4',
            });
            formData.append('security_token', auth.token);
            formData.append('user_id', auth.userId);

            await sendMessageToAPI(formData);
        } catch (err) {
            console.error('Stop recording error:', err);
        }
    };

    const playAudio = (url) => {
        if (soundRef.current) {
            soundRef.current.stop(() => {
                soundRef.current.release();
                soundRef.current = null;
            });
        }

        const sound = new Sound(url, null, (error) => {
            if (error) {
                console.log('Sound load error:', error);
                return;
            }
            soundRef.current = sound;
            sound.play(success => {
                if (!success) {
                    Toast.show('Playback failed');
                }
                sound.release();
            });
        });
    };

    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.stop(() => {
                    soundRef.current.release();
                    soundRef.current = null;
                });
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => navigation.goBack()}
                title={titleText}
            />

            <ScrollView
                ref={scrollRef}
                style={styles.chatContainer}
                contentContainerStyle={{ padding: 12 }}
                onContentSizeChange={scrollToEnd}
            >
                {messages.map((msg, index) => (
                    <View
                        key={index}
                        style={[
                            styles.messageBubble,
                            msg.type === 'user' ? styles.userBubble : styles.botBubble,
                        ]}
                    >
                        <Text style={msg.type === 'user' ? styles.userText : styles.botText}>
                            {msg.text}
                        </Text>
                        {msg.type === 'bot' && msg.audio && (
                            <TouchableOpacity style={styles.volumeIcon} onPress={() => playAudio(msg.audio)}>
                                <Image
                                    source={require('../../../assets/image/Chat/mediumVolume.png')}
                                    style={{ width: 18, height: 18, tintColor: '#fff' }}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {isTyping && (
                    <View style={[styles.messageBubble, styles.botBubble]}>
                        <ActivityIndicator color="#fff" size="small" />
                    </View>
                )}
            </ScrollView>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.inputBox}
                        placeholder="Ask anything"
                        placeholderTextColor="#A0A0A0"
                        value={input}
                        onChangeText={setInput}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.5 }]}
                        onPress={handleSendText}
                        disabled={!input.trim() || inputDisabled}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{sendText}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.audioButton, { backgroundColor: isRecording ? 'red' : '#007D75' }]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                            {isRecording ? '■' : '🎤'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E6FCFB' },
    chatContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginTop: 20,
        borderWidth: 1.5,
        borderColor: '#00A499',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    messageBubble: {
        maxWidth: '85%',
        marginBottom: 12,
        padding: 10,
        borderRadius: 12,
        position: 'relative',
    },
    userBubble: {
        backgroundColor: '#F0F0F0',
        alignSelf: 'flex-end',
        borderTopRightRadius: 0,
    },
    botBubble: {
        backgroundColor: '#00A499',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 0,
    },
    userText: { color: '#333333', fontSize: 15 },
    botText: { color: '#ffffff', fontSize: 15 },
    volumeIcon: {
        position: 'absolute',
        bottom: 6,
        right: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 12,
    },
    inputBox: {
        flex: 1,
        height: 48,
        borderWidth: 1.5,
        borderColor: '#00A499',
        borderRadius: 25,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333333',
        backgroundColor: '#FFFFFF',
    },
    sendButton: {
        backgroundColor: '#00A499',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginLeft: 8,
        borderRadius: 24,
    },
    audioButton: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginLeft: 6,
        borderRadius: 24,
    },
});

const mapStateToProps = state => ({
    user: state.user,
    token: state.token,
    lang: state.lang,
});

export default connect(mapStateToProps)(Chatbot);