// src/components/menu/assessment/FallRiskScreen.js

import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import MultiSelectCheckbox from '../../MultiSelectCheckbox';
import { useSelector } from 'react-redux';

const FallRiskScreen = ({ navigation }) => {
    const [select, setSelect] = useState('yes');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const user = useSelector(state => state?.user);

    const options = [
        'Injury',
        '≥ 2 fall last year',
        'Frailty',
        'Lying on the floor/\nunable to get up',
        'Loss of consciousness/suspected syncope',
    ];

    const handleCheckboxChange = option => {
        if (selectedOptions.includes(option)) {
            setSelectedOptions(prev => prev.filter(item => item !== option));
        } else {
            setSelectedOptions(prev => [...prev, option]);
        }
    };

    const onSubmit = () => {
        const payload = {
            user_id: user?.id_customer,
            q1: select === 'yes' ? '1' : '0',
            q1_1: selectedOptions.includes('Injury') ? '1' : '0',
            q1_2: selectedOptions.includes('≥ 2 fall last year') ? '1' : '0',
            q1_3: selectedOptions.includes('Frailty') ? '1' : '0',
            q1_4: selectedOptions.includes('Lying on the floor/\nunable to get up') ? '1' : '0',
            q1_5: selectedOptions.includes('Loss of consciousness/suspected syncope') ? '1' : '0',
        };

        fetch('https://api1.suratec.co.th/member/get_add_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(result => {
                console.log('result-', result?.status);
                if (result?.status === 200) {
                    Alert.alert('Success', 'Form Submitted Successfully', [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation.navigate('StandOpenEyes');
                            },
                        },
                    ]);
                } else {
                    Alert.alert('Failed', 'Something went wrong.');
                }
            })
            .catch(error => {
                console.log('error', error);
                Alert.alert('Error', 'Submission Failed');
            });
    };


    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left="left"
                onpress_left={() => navigation.goBack()}
                title="Fall Risk Screening"
            />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, padding: 20 }}
                showsVerticalScrollIndicator={false}
            >
            <Text style={[styles.text, { marginTop: '10%', textAlign: 'center' }]}>
                FALL PAST 12 MONTHS?
            </Text>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.optionBtn, select === 'yes' && styles.optionSelected]}
                    onPress={() => setSelect('yes')}
                >
                    <Text
                        style={[styles.optionText, select === 'yes' && styles.textSelected]}
                    >
                        YES
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.optionBtn, select === 'no' && styles.optionSelected]}
                    onPress={() => setSelect('no')}
                >
                    <Text
                        style={[styles.optionText, select === 'no' && styles.textSelected]}
                    >
                        NO
                    </Text>
                </TouchableOpacity>
            </View>

            {select === 'yes' && (
                <>
                    <Text style={[styles.text, { marginTop: '10%', textAlign: 'center' }]}>
                        Assess Fall Severity :
                    </Text>
                    <MultiSelectCheckbox
                        options={options}
                        selectedOptions={selectedOptions}
                        onChange={handleCheckboxChange}
                    />
                </>
            )}

            <View style={styles.submitWrapper}>
                <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={() => {
                        if (select === 'no') setSelectedOptions([]);
                        onSubmit();
                    }}
                >
                    <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </View>
    );
};

export default FallRiskScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    text: {
        width: '90%',
        fontSize: 20,
        color: '#00A2A2',
        fontWeight: '700',
        alignSelf: 'center',
    },
    buttonRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: '5%',
    },
    optionBtn: {
        width: 130,
        height: 55,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#00A2A2',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    optionSelected: {
        backgroundColor: '#00A2A2',
    },
    optionText: {
        fontSize: 32,
        color: '#00A2A2',
        fontWeight: '600',
    },
    textSelected: {
        color: '#fff',
    },
    submitWrapper: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 5,
    },
    submitBtn: {
        width: '60%',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#00A2A2',
        borderRadius: 20,
        marginVertical: 40,
        alignItems: 'center',
    },
    submitText: {
        fontSize: 18,
        color: '#fff',
    },
});
