// src/components/menu/training/ModerateRiskEcercise.js

import React, { useState } from 'react';
import { StyleSheet, Dimensions, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import { useSelector } from 'react-redux';
import langTraining from '../../../assets/language/menu/lang_training';

const { width } = Dimensions.get('window');

export default function ModerateRiskExercise({ navigation }) {
    const [selectedMonth, setSelectedMonth] = React.useState('1');
    const [selectedWeek, setSelectedWeek] = React.useState('1');
    const lang = useSelector(state => state.lang);
    const langKey = lang === 1 ? 'thai' : 'eng';
    const localizedTitle = langTraining.moderateRiskProgram?.[langKey] || 'Moderate Risk Program';


    return (
        <View style={styles.container}>
            {/* Header */}
            <HeaderFix
                icon_left="left"
                onpress_left={() => navigation.goBack()}
                title={localizedTitle}
            />

            {/* Month / Week “Pills” */}
            <View style={styles.dropdownRow}>
                <TouchableOpacity style={styles.dropdown}>
                    <Text style={styles.dropdownText}>Month: {selectedMonth} ▾</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdown}>
                    <Text style={styles.dropdownText}>Week: {selectedWeek} ▾</Text>
                </TouchableOpacity>
            </View>

            {/* Scrollable Cards */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Monday Card */}
                <View style={styles.card}>
                    <Text style={styles.dayTitle}>Monday</Text>
                    <Text style={styles.lineItem}>• 5 minute warm-up</Text>
                    <Text style={styles.lineItem}>• 20 minute walk</Text>
                    <Text style={styles.lineItem}>• Stretch for 5 minutes</Text>
                </View>

                {/* Tuesday Card */}
                <View style={styles.card}>
                    <Text style={styles.dayTitle}>Tuesday</Text>
                    <Text style={styles.lineItem}>• Rest</Text>
                </View>

                {/* Wednesday Card */}
                <View style={styles.card}>
                    <Text style={styles.dayTitle}>Wednesday</Text>
                    <Text style={styles.lineItem}>• 5 minute warm-up</Text>
                    <Text style={styles.lineItem}>• Strength training:</Text>
                    <Text style={styles.subItem}>– Seated Dead Bug (15 × 3)</Text>
                    <Text style={styles.subItem}>– Seated Side Bends (15 × 3)</Text>
                    <Text style={styles.subItem}>– Seated Forward Roll-Ups (15 × 3)</Text>
                    <Text style={styles.subItem}>– Wood Chops (15 × 3)</Text>
                    <Text style={styles.subItem}>– Planks (15s × 3)</Text>
                    <Text style={styles.lineItem}>• Stretch for 5 minutes</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const CARD_MARGIN = 12;
const CARD_PADDING = 16;
const DROPDOWN_WIDTH = (width - 48) / 2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },

    /* Month / Week Pills */
    dropdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 12,
    },
    dropdown: {
        width: DROPDOWN_WIDTH,
        backgroundColor: '#00A499',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    dropdownText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },

    /* ScrollView container padding */
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },

    /* Card container styling */
    card: {
        borderWidth: 1,
        borderColor: '#00A499',
        borderRadius: 12,
        padding: CARD_PADDING,
        marginBottom: CARD_MARGIN,
        backgroundColor: '#FAFAFA',
        // subtle shadow/elevation
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    dayTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#00A499',
        marginBottom: 8,
    },

    /* Each main bullet line (e.g. “• 5 minute warm-up”) */
    lineItem: {
        fontSize: 16,
        fontWeight: '500',
        color: '#00A499',
        marginVertical: 4,
    },

    /* Sub-items (indented, e.g. “– Seated Dead Bug (15×3)”) */
    subItem: {
        fontSize: 16,
        fontWeight: '500',
        color: '#00A499',
        marginLeft: 16,
        marginVertical: 2,
    },
});
