// src/components/MultiSelectCheckbox.js

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Checkbox from './Checkbox'; // Ensure Checkbox is correctly implemented

const MultiSelectCheckbox = ({ options, selectedOptions, onChange }) => {
    return (
        <View style={styles.container}>
            {options.map(option => (
                <Checkbox
                    key={option}
                    label={option}
                    checked={selectedOptions.includes(option)}
                    onChange={() => onChange(option)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '90%',
        alignSelf: 'center',
        marginTop: 20,
    },
});

export default MultiSelectCheckbox;
