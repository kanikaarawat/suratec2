// src/components/menu/assessment/AssessmentHome.js

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Alert,
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function AssessmentHome({ navigation }) {
    // ------------- State -------------
    const [hasFallRisk, setHasFallRisk] = useState(null); // 'yes' / 'no' / null
    const [injury, setInjury] = useState(false);
    const [twoFalls, setTwoFalls] = useState(false);
    const [frailty, setFrailty] = useState(false);
    const [lyingFloor, setLyingFloor] = useState(false);
    const [lossConscious, setLossConscious] = useState(false);

    // ------------- Handlers -------------
    const handleSubmit = async () => {
        if (hasFallRisk === null) {
            Alert.alert('Please select YES or NO for 12-month fall risk.');
            return;
        }

        const payload = {
            fallRisk12Months: hasFallRisk === 'yes',
            screeningQuestions: {
                injury,
                twoFalls,
                frailty,
                lyingOnFloor: lyingFloor,
                lossOfConsciousness: lossConscious,
            },
        };

        try {
            // TODO: replace with your real backend endpoint
            await axios.post('https://your-backend.com/api/fallrisk', payload);
            navigation.navigate('StandOpenEyes');
        } catch (err) {
            console.error(err);
            Alert.alert('Submission Failed', 'Please try again later.');
        }
    };

    return (
        <View style={styles.container}>
            {/* ===== Custom Header ===== */}
            <View style={styles.header}>
                {/* Back arrow as plain "<" */}
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.arrowText}>&lt;</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Fall Risk Screening</Text>

                {/* Forward arrow as plain ">" (always visible) */}
                <TouchableOpacity onPress={() => navigation.navigate('StandOpenEyes')}>
                    <Text style={styles.arrowText}>&gt;</Text>
                </TouchableOpacity>
            </View>

            {/* ===== Scrollable Content ===== */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Title */}
                <Text style={styles.screenTitle}>FALL RISK 12 MONTH</Text>

                {/* YES/NO Row */}
                <View style={styles.yesNoRow}>
                    <TouchableOpacity
                        style={[
                            styles.yesNoButton,
                            hasFallRisk === 'yes' && styles.selectedButton,
                        ]}
                        onPress={() => setHasFallRisk('yes')}
                    >
                        <Text
                            style={[
                                styles.yesNoText,
                                hasFallRisk === 'yes' && styles.selectedText,
                            ]}
                        >
                            YES
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.yesNoButton,
                            hasFallRisk === 'no' && styles.selectedButton,
                        ]}
                        onPress={() => setHasFallRisk('no')}
                    >
                        <Text
                            style={[
                                styles.yesNoText,
                                hasFallRisk === 'no' && styles.selectedText,
                            ]}
                        >
                            NO
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Checkboxes */}
                <View style={styles.checkboxGroup}>
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setInjury(!injury)}
                    >
                        <View style={[styles.checkbox, injury && styles.checkboxChecked]} />
                        <Text style={styles.checkboxLabel}>Injury</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setTwoFalls(!twoFalls)}
                    >
                        <View style={[styles.checkbox, twoFalls && styles.checkboxChecked]} />
                        <Text style={styles.checkboxLabel}>
                            ≥ 2 falls last year
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setFrailty(!frailty)}
                    >
                        <View style={[styles.checkbox, frailty && styles.checkboxChecked]} />
                        <Text style={styles.checkboxLabel}>Frailty</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setLyingFloor(!lyingFloor)}
                    >
                        <View style={[styles.checkbox, lyingFloor && styles.checkboxChecked]} />
                        <Text style={styles.checkboxLabel}>
                            Lying on the floor / unable to get up
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setLossConscious(!lossConscious)}
                    >
                        <View style={[styles.checkbox, lossConscious && styles.checkboxChecked]} />
                        <Text style={styles.checkboxLabel}>
                            Loss of consciousness / suspected syncope
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

// ------------- Styles -------------
const CARD_WIDTH = width * 0.9;
const YESNO_WIDTH = (CARD_WIDTH - 24) / 2;

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

    scrollContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 32,
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00A499',
        textAlign: 'center',
        marginBottom: 24,
    },

    // YES / NO Row
    yesNoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: CARD_WIDTH,
        marginBottom: 24,
    },
    yesNoButton: {
        width: YESNO_WIDTH,
        borderWidth: 1.5,
        borderColor: '#00A499',
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: '#00A499',
    },
    yesNoText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#00A499',
    },
    selectedText: {
        color: '#FFFFFF',
    },

    // Checkboxes
    checkboxGroup: {
        width: CARD_WIDTH,
        marginBottom: 32,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 1.5,
        borderColor: '#00A499',
        borderRadius: 4,
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#00A499',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#00A499',
        flexShrink: 1,
    },

    // Submit
    submitButton: {
        width: CARD_WIDTH * 0.5,
        backgroundColor: '#00A499',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
