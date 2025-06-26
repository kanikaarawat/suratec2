// src/components/menu/assessment/StandEyes.js

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import HeaderFix from '../../common/HeaderFix';

const StandEyes = ({ navigation, type }) => {
    const [seconds, setSeconds] = useState(10);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let timer = null;

        if (isActive && seconds > 0) {
            timer = setInterval(() => {
                setSeconds(prev => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            clearInterval(timer);
            setIsActive(false);
            setTimeout(() => {
                navigation.replace(type === 'open' ? 'StandEyesClosed' : 'TenMeterWalkTest');
            }, 500);
        }

        return () => clearInterval(timer);
    }, [isActive, seconds]);

    const handleStart = () => {
        setIsActive(true);
    };

    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => navigation.goBack()}
                title={type === 'open' ? 'Stand Open Eyes' : 'Stand Eyes Closed'}
            />

            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
            >
            {isActive && (
                <Text style={styles.timerText}>{seconds}</Text>
            )}

            <View style={styles.content}>
                <Image
                    source={
                        type === 'open'
                            ? require('../../../assets/image/static/open.png')
                            : require('../../../assets/image/static/close.png')
                    }
                    style={styles.image}
                    resizeMode="contain"
                />

                <Text style={[styles.text, { marginTop: '5%' }]}>
                    Stand upright for 10 seconds.
                </Text>

                <Text style={[styles.text, { marginTop: '8%' }]}>NOTE :</Text>
                <Text style={styles.text}>
                    Stand up straight with your eyes {type === 'open' ? 'open' : 'closed'} and try to keep your balance.
                </Text>

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: isActive ? '#ccc' : '#00A2A2' },
                    ]}
                    disabled={isActive}
                    onPress={handleStart}
                >
                    <Text style={styles.buttonText}>{'Start'}</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </View>
    );
};

export default StandEyes;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    timerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF0000',
        textAlign: 'right',
        padding: 16,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    image: {
        width: 180,
        height: 180,
    },
    text: {
        width: '90%',
        fontSize: 18,
        color: '#00A2A2',
        fontWeight: '600',
        textAlign: 'center',
    },
    button: {
        width: '60%',
        paddingVertical: 12,
        borderRadius: 20,
        marginVertical: 40,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
    },
});
