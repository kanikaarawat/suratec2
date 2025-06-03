import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import UI from '../../../config/styles/CommonStyles';

const { width } = Dimensions.get('window');

export default class ExerciseTraining extends Component {
    handleNavigate = route => {
        this.props.navigation.navigate(route);
    };

    render() {
        return (
            <View style={styles.container}>
                <HeaderFix
                    icon_left={'left'}
                    onpress_left={() => {
                        this.props.navigation.goBack();
                    }}
                    title="Exercise Training"
                />
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#d2f6fb' }]}
                        onPress={() => this.handleNavigate('LowRiskExercise')}>
                        <Text style={[styles.cardText, { color: '#007b8a' }]}>
                            Exercise program for people{'\n'}at low risk of falls
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#fef8cb' }]}
                        onPress={() => this.handleNavigate('ModerateRiskExercise')}>
                        <Text style={[styles.cardText, { color: '#027b57' }]}>
                            Exercise program for people{'\n'}with moderate fall risk
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, styles.outlinedCard]}
                        onPress={() => this.handleNavigate('ExerciseWorkOut')}>
                        <Text style={[styles.cardText, { color: '#00a4cc' }]}>
                            Exercise Work out
                        </Text>
                    </TouchableOpacity>


                </ScrollView>
            </View>
        );
    }

}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e6fafd', // subtle gradient like in your image
    },
    scrollContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    card: {
        width: width * 0.9,
        padding: 18,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 3,
    },
    outlinedCard: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#00a4cc',
    },
    cardText: {
        fontSize: 15,
        textAlign: 'center',
        fontWeight: '600',
    },
});
