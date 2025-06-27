// src/components/menu/chat/Chatbot.js

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
    Image,
} from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import Sound from 'react-native-sound';
import { connect } from 'react-redux';
import langChatbot from '../../../assets/language/menu/lang_chatbot';


const { width } = Dimensions.get('window');

function Chatbot({ navigation, user, lang }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const scrollRef = useRef();
    const [isTyping, setIsTyping] = useState(false);
    const soundRef = useRef(null);
    const langKey = lang === 1 ? 'thai' : 'eng';
    const titleText = langChatbot.title[langKey];
    const sendText = langChatbot.send[langKey];

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { type: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const formData = new FormData();
            formData.append('security_token', user.security_token);
            formData.append('user_id', user.id_customer);
            formData.append('text', input.trim());

            const res = await fetch(`https://www.surasole.com/api/voice-chat/`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.text_response) {
                const botMessage = {
                    type: 'bot',
                    text: data.text_response,
                    audio: data.voice_url,
                };
                setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error('Chatbot API error:', error);
        } finally {
            setIsTyping(false);
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
                console.log('Failed to load sound', error);
                return;
            }
            soundRef.current = sound;
            sound.play((success) => {
                if (!success) console.log('Playback failed');
                sound.release();
                soundRef.current = null;
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
                onContentSizeChange={() =>
                    scrollRef.current?.scrollToEnd({ animated: true })
                }
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
                            <TouchableOpacity
                                style={styles.volumeIcon}
                                onPress={() => playAudio(msg.audio)}
                            >
                                <Image
                                    source={require('../../../assets/image/Chat/mediumVolume.png')}
                                    style={{ width: 18, height: 18, tintColor: '#fff' }}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {/* 👇 Typing indicator */}
                {isTyping && (
                    <View style={[styles.messageBubble, styles.botBubble]}>
                        <View style={styles.typingDots}>
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                        </View>
                    </View>
                )}
            </ScrollView>


            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.inputBox}
                        placeholder="Ask anything"
                        placeholderTextColor="#A0A0A0"
                        value={input}
                        onChangeText={setInput}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{sendText}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E6FCFB',
    },
    chatContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginTop: 20,
        borderWidth: 1.5,
        borderColor: '#00A499',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
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
    userText: {
        color: '#333333',
        fontSize: 15,
    },
    botText: {
        color: '#ffffff',
        fontSize: 15,
    },
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
        backgroundColor: '#ffffff',
        opacity: 0.8,
    },

});

const mapStateToProps = state => ({
    user: state.user,
    lang: state.lang,
});

export default connect(mapStateToProps)(Chatbot);

