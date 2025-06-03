import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import HeaderFix from '../../common/HeaderFix';
import UI from '../../../config/styles/CommonStyles';

const { width } = Dimensions.get('window');

const exercises = [
    { title: "Seated Dead Bug", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Seated Side Bends", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Seated Forward Roll-Ups", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Wood Chops", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Planks", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Single Limb Stance", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Rock the Boat", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Seated Dead Bug", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Back Leg Raises", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Side Leg Raise", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Toe Lifts", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
    { title: "Wall Pushups", video: "https://www.youtube.com/embed/2I8Y8YY0Etw" },
];


export default function ExerciseWorkOut({ navigation }) {
    const [selectedExercise, setSelectedExercise] = React.useState(null);

    if (selectedExercise) {
        return (
            <View style={{ flex: 1 }}>
                <HeaderFix
                    icon_left={'left'}
                    onpress_left={() => setSelectedExercise(null)}
                    title={selectedExercise.title}
                />
                <WebView
                    source={{ uri: `${selectedExercise.video}?autoplay=1&controls=1` }}
                    style={{ flex: 1 }}
                    allowsFullscreenVideo
                />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => navigation.goBack()}
                title="Exercise Work Out"
            />
            <ScrollView style={{ backgroundColor: '#E0F7FA' }} contentContainerStyle={styles.container}>
                {exercises.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.button}
                        onPress={() => setSelectedExercise(item)}>
                        <Text style={styles.buttonText}>{item.title}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 16,
        paddingBottom: 60,
    },
    button: {
        borderColor: '#00BCD4',
        borderWidth: 2,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginVertical: 6,
        width: width * 0.9,
        backgroundColor: '#fff',
    },
    buttonText: {
        color: '#00BCD4',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
