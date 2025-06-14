import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const Checkbox = ({ label, checked, onChange }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onChange}>
            <View style={[styles.checkbox, checked && styles.checked]}>
                {checked && <View style={styles.innerCheckbox} />}
            </View>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width:"90%",
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
        marginTop:10,
        alignSelf:'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 4,
        borderColor: '#00A2A2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checked: {
        backgroundColor: '#00A2A2',
    },
    innerCheckbox: {
        width: 12,
        height: 12,
        backgroundColor: '#00A2A2',
    },
    label: {
        fontSize: 23,
        fontWeight:"600",
        color:'#00A2A2'
    },
});

export default Checkbox;
