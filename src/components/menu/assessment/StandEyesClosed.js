// src/components/menu/assessment/StandEyesClosed.js

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function StandEyesClosed({ navigation }) {
    const [timer, setTimer] = useState(20);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef(null);

    const handleStart = () => {
        if (isRunning) return;
        setIsRunning(true);
        setTimer(20);
        intervalRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* ===== Custom Header with plain < and > ===== */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.arrowText}>&lt;</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Stand eyes closed</Text>

                <TouchableOpacity onPress={() => navigation.navigate('TenMeterWalkTest')}>
                    <Text style={styles.arrowText}>&gt;</Text>
                </TouchableOpacity>
            </View>

            {/* ===== Vertically Centered Content ===== */}
            <View style={styles.content}>
                <View style={styles.imagePlaceholder}>
                    <View style={styles.personSilhouette} />
                    <View style={styles.faceCircle}>
                        <Text style={styles.faceEmoji}>😌</Text>
                    </View>
                </View>

                <Text style={styles.instructionText}>
                    Stand upright for 20 seconds.
                </Text>

                <Text style={styles.noteText}>
                    NOTE:{'\n'}
                    Stand up straight with your eyes closed and try to keep your balance.
                </Text>

                {isRunning ? (
                    <Text style={styles.timerText}>{timer} s</Text>
                ) : (
                    <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                        <Text style={styles.startText}>Start</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

// ------------- Styles -------------
const CARD_WIDTH = width * 0.8;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFEFE',
    },
    header: {
        flexDirection: 'row',
        height: 56,
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        elevation: 2,
        paddingHorizontal: 16,
    },
    arrowText: {
        fontSize: 24,
        color: '#00A499',
        fontWeight: '700',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00A499',
        textAlign: 'center',
    },

    content: {
        flex: 1,
        justifyContent: 'center',  // Vertical centering
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    imagePlaceholder: {
        width: CARD_WIDTH,
        height: CARD_WIDTH,
        backgroundColor: '#00A499',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    personSilhouette: {
        position: 'absolute',
        width: CARD_WIDTH * 0.5,
        height: CARD_WIDTH * 0.8,
        backgroundColor: '#00A499',
        borderRadius: 12,
    },
    faceCircle: {
        position: 'absolute',
        top: -CARD_WIDTH * 0.12,
        width: CARD_WIDTH * 0.24,
        height: CARD_WIDTH * 0.24,
        borderRadius: (CARD_WIDTH * 0.24) / 2,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#00A499',
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceEmoji: {
        fontSize: 32,
    },

    instructionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#00A499',
        marginBottom: 16,
        textAlign: 'center',
    },
    noteText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#00A499',
        marginHorizontal: 16,
        marginBottom: 32,
        textAlign: 'center',
    },

    timerText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#00A499',
    },
    startButton: {
        backgroundColor: '#00A499',
        borderRadius: 25,
        paddingHorizontal: 32,
        paddingVertical: 12,
    },
    startText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
