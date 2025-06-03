// src/components/menu/assessment/TenMeterWalkTest.js

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function TenMeterWalkTest({ navigation }) {
    const [timer, setTimer] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef(null);

    const handleStart = () => {
        if (isRunning) return;
        setIsRunning(true);
        setTimer(0);
        intervalRef.current = setInterval(() => {
            setTimer((prev) => prev + 1);
        }, 1000);
    };

    const handleFinish = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setIsRunning(false);
        // TODO: send `timer` result to backend if needed
        navigation.popToTop();
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* ===== Custom Header with plain < on left and “Finish” on right ===== */}
            <View style={styles.header}>
                {/* Back arrow as plain "<" */}
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.arrowText}>&lt;</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>10-meter walk test</Text>

                {/* If running, show "Finish"; otherwise placeholder */}
                {isRunning ? (
                    <TouchableOpacity onPress={handleFinish}>
                        <Text style={styles.finishText}>Finish</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 60 }} />
                )}
            </View>

            {/* ===== Vertically Centered Content ===== */}
            <View style={styles.content}>
                {/* Illustration Placeholder */}
                <View style={styles.imagePlaceholder}>
                    <View style={styles.pathLine} />
                    <View style={styles.personSilhouetteStart} />
                    <View style={styles.personSilhouetteMid} />
                    <View style={styles.personSilhouetteEnd} />
                    <Text style={styles.distanceLabel}>10 METERS</Text>
                </View>

                <Text style={styles.subtitle}>Walking</Text>
                <Text style={styles.instructionText}>Walk straight for 10 meters.</Text>

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
    finishText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#00A499',
        width: 60,              // ensures same width as placeholder
        textAlign: 'right',
    },

    content: {
        flex: 1,
        justifyContent: 'center',   // vertical centering
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    imagePlaceholder: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 0.6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    pathLine: {
        position: 'absolute',
        bottom: CARD_WIDTH * 0.15,
        width: CARD_WIDTH * 0.8,
        height: 8,
        backgroundColor: '#00A499',
        borderRadius: 4,
    },
    personSilhouetteStart: {
        position: 'absolute',
        left: CARD_WIDTH * 0.05,
        width: CARD_WIDTH * 0.08,
        height: CARD_WIDTH * 0.3,
        backgroundColor: '#00A499',
        borderRadius: 4,
    },
    personSilhouetteMid: {
        position: 'absolute',
        left: CARD_WIDTH * 0.45,
        width: CARD_WIDTH * 0.08,
        height: CARD_WIDTH * 0.3,
        backgroundColor: '#00A49988',
        borderRadius: 4,
    },
    personSilhouetteEnd: {
        position: 'absolute',
        left: CARD_WIDTH * 0.85,
        width: CARD_WIDTH * 0.08,
        height: CARD_WIDTH * 0.3,
        backgroundColor: '#00A49944',
        borderRadius: 4,
    },
    distanceLabel: {
        position: 'absolute',
        bottom: CARD_WIDTH * 0.08,
        fontSize: 14,
        fontWeight: '600',
        color: '#00A499',
    },

    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#00A499',
        marginBottom: 8,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#00A499',
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
