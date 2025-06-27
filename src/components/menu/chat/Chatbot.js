import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, Dimensions, Platform, KeyboardAvoidingView,
    Image, PermissionsAndroid, BackHandler, ActivityIndicator
} from 'react-native';
import { connect } from 'react-redux';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import HeaderFix from '../../common/HeaderFix';
import Toast from 'react-native-simple-toast';
import chatbotLang from '../../../assets/language/menu/lang_chatbot';

const { width } = Dimensions.get('window');
// 💡 Place this at the top level (outside the component)
const globalRecorderInstance = new AudioRecorderPlayer();

function ChatbotScreen({ navigation, user, token: tokenProp, lang }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [inputDisabled, setInputDisabled] = useState(false);
    const scrollRef = useRef();
    const soundRef = useRef(null);
    const langKey = lang === 1 ? 'thai' : 'eng';

    const audioRecorderPlayerRef = useRef(globalRecorderInstance);

    useEffect(() => {
        console.log('📦 Initializing AudioRecorderPlayer...');
        audioRecorderPlayerRef.current = new AudioRecorderPlayer();
        console.log('✅ Initialized:', audioRecorderPlayerRef.current);

        return () => {
            console.log('♻️ Cleaning up recorder...');
            if (audioRecorderPlayerRef.current) {
                audioRecorderPlayerRef.current.stopRecorder();
                audioRecorderPlayerRef.current.removeRecordBackListener();
            }
        };
    }, []);



    const scrollToEnd = () => scrollRef.current?.scrollToEnd({ animated: true });

    const addMessage = (type, text, audio = null) => {
        setMessages(prev => {
            const updated = [...prev, { type, text, audio }];
            setTimeout(scrollToEnd, 100);
            return updated;
        });
    };

    const getAuthFormData = () => {
        if (!tokenProp || !user?.id_customer) {
            Toast.show(chatbotLang.missingAuth[langKey]);
            return null;
        }
        return {
            token: tokenProp,
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
            console.log('🧠 Chatbot API response:', data);

            if (data?.text_response) {
                addMessage('bot', data.text_response, data.voice_url);
            } else {
                Toast.show(chatbotLang.noResponse[langKey]);
            }
        } catch (err) {
            console.error('❌ Chatbot API Error:', err);
            Toast.show(chatbotLang.apiFailed[langKey]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendText = async () => {
        if (!input.trim() || inputDisabled) return;

        const message = input.trim().replace(/\s+/g, ' ');
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
        if (!audioRecorderPlayerRef.current) {
            console.warn('Recorder not initialized');
            Toast.show('Recorder not ready');
            return;
        }

        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Toast.show(chatbotLang.micPermissionDenied[langKey]);
                return;
            }
        }

        try {
            await audioRecorderPlayerRef.current.removeRecordBackListener();
            const result = await audioRecorderPlayerRef.current.startRecorder(
                Platform.OS === 'ios' ? 'hello.m4a' : undefined
            );
            console.log('📂 Recorder started at:', result);
            setIsRecording(true);
        } catch (err) {
            console.error('Recording error:', err);
            Toast.show('Recording failed to start');
        }
    };


    const stopRecording = async () => {
        try {
            const filePath = await audioRecorderPlayerRef.current?.stopRecorder();
            await audioRecorderPlayerRef.current?.removeRecordBackListener();
            setIsRecording(false);
            if (!filePath) {
                Toast.show(chatbotLang.recordingFailed[langKey]);
                return;
            }
            addMessage('user', chatbotLang.voiceSent[langKey]);

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
            if (error) return console.error('Sound load error:', error);
            soundRef.current = sound;
            sound.play(success => {
                if (!success) Toast.show(chatbotLang.playbackFailed[langKey]);
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

    useEffect(() => {
        const onBackPress = () => {
            if (navigation.canGoBack()) {
                navigation.goBack();
                return true;
            } else {
                navigation.navigate('Home');
                return true;
            }
        };

        BackHandler.addEventListener('hardwareBackPress', onBackPress);

        return () => {
            BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        };
    }, [navigation]);


    return (
        <View style={styles.container}>
            <HeaderFix icon_left="left" onpress_left={() => navigation.goBack()} title={chatbotLang.title[langKey]} />

            <ScrollView
                ref={scrollRef}
                style={styles.chatContainer}
                contentContainerStyle={{ padding: 12 }}
                onContentSizeChange={scrollToEnd}
            >
                {messages.map((msg, i) => (
                    <View
                        key={i}
                        style={[
                            styles.messageBubble,
                            msg.type === 'user' ? styles.userBubble : styles.botBubble,
                        ]}
                    >
                        <Text style={msg.type === 'user' ? styles.userText : styles.botText}>{msg.text}</Text>
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
                        placeholder={chatbotLang.askAnything[langKey]}
                        placeholderTextColor="#A0A0A0"
                        value={input}
                        onChangeText={setInput}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.5 }]}
                        onPress={handleSendText}
                        disabled={!input.trim() || inputDisabled}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{chatbotLang.send[langKey]}</Text>
                    </TouchableOpacity>
                    {/*<TouchableOpacity*/}
                    {/*    style={[styles.audioButton, { backgroundColor: isRecording ? 'red' : '#007D75' }]}*/}
                    {/*    onPress={isRecording ? stopRecording : startRecording}*/}
                    {/*>*/}
                    {/*    <Text style={{ color: '#fff', fontWeight: 'bold' }}>*/}
                    {/*        {isRecording ? chatbotLang.stop[langKey] : '🎤'}*/}
                    {/*    </Text>*/}
                    {/*</TouchableOpacity>*/}
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
        backgroundColor: '#fff',
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
    userText: { color: '#333', fontSize: 15 },
    botText: { color: '#fff', fontSize: 15 },
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
        color: '#333',
        backgroundColor: '#fff',
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
    typingDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 10,
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
        opacity: 0.8,
    },
});

const mapStateToProps = (state) => ({
    user: state.user,
    token: state.token,
    lang: state.lang,
});

export default connect(mapStateToProps)(ChatbotScreen);