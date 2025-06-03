import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import UI from '../../../config/styles/CommonStyles';
import HeaderFix from '../../common/HeaderFix';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3 - 24;

const shoeData = [
    { id: '1', label: 'SCT-2010', company: 'Jumantic', price: 3900, image: require('../../../assets/image/Front.png') },
    { id: '2', label: 'SC-23-2019', company: 'Jumantic', price: 3900, image: require('../../../assets/image/Back.png') },
    { id: '3', label: 'SP56-230', company: 'FlexWear', price: 4200, image: require('../../../assets/image/dashboard.png') },
    { id: '4', label: 'SPX-001', company: 'MaxStep', price: 3600, image: require('../../../assets/image/camimg.png') },
    { id: '5', label: 'HLS-421', company: 'StepLite', price: 3500, image: require('../../../assets/image/FootPainLocation.png') },
    { id: '6', label: 'TR-500', company: 'FlexWear', price: 4100, image: require('../../../assets/image/leftback.png') },
    { id: '7', label: 'MK-990', company: 'BounceX', price: 4300, image: require('../../../assets/image/left_leg_up.png') },
    { id: '8', label: 'STB-822', company: 'Jumantic', price: 3950, image: require('../../../assets/image/legs.png') },
    { id: '9', label: 'GTR-340', company: 'Jumantic', price: 3850, image: require('../../../assets/image/Monofilament.png') },
    { id: '10', label: 'QRE-110', company: 'FlexWear', price: 3700, image: require('../../../assets/image/more.png') },
    { id: '11', label: 'FLS-120', company: 'Stride', price: 3600, image: require('../../../assets/image/right_leg_up.png') },
    { id: '12', label: 'SP-XX2025', company: 'MaxStep', price: 4000, image: require('../../../assets/image/start.png') },
    { id: '13', label: 'TZX-900', company: 'Stride', price: 3900, image: require('../../../assets/image/walk.png') },
    { id: '14', label: 'GTF-882', company: 'BounceX', price: 4100, image: require('../../../assets/image/foot_dashboard.png') },
    { id: '15', label: 'LUX-320', company: 'Jumantic', price: 3650, image: require('../../../assets/image/checked.png') },
];



export default function ShoeRecommendScreen({ navigation }) {
    const [selectedShoes, setSelectedShoes] = useState([]);
    const [filter1, setFilter1] = useState('All');
    const [filter2, setFilter2] = useState('Group');

    const toggleSelection = (id) => {
        setSelectedShoes((prev) =>
            prev.includes(id) ? prev.filter((shoeId) => shoeId !== id) : [...prev, id]
        );
    };

    const renderShoe = ({ item }) => {
        const isSelected = selectedShoes.includes(item.id);
        return (
            <TouchableOpacity
                style={[styles.shoeContainer, isSelected && styles.selectedShoe]}
                onPress={() => toggleSelection(item.id)}>
                <Image source={item.image} style={styles.shoeImage} resizeMode="contain" />
                {isSelected && (
                    <View style={styles.tickOverlay}>
                        <Text style={styles.tick}>✓</Text>
                    </View>
                )}
                <Text style={styles.shoeLabel}>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => navigation.goBack()}
                title={'Shoe Recommend'}
            />
            <View style={styles.filterRow}>
                {['All', 'Filter 1', 'Filter 2'].map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[styles.filterButton, filter1 === item && styles.selectedFilter]}
                        onPress={() => setFilter1(item)}>
                        <Text style={styles.filterText}>{item}</Text>
                    </TouchableOpacity>
                ))}
                {['Group', 'Filter 1', 'Filter 2'].map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[styles.filterButton, filter2 === item && styles.selectedFilter]}
                        onPress={() => setFilter2(item)}>
                        <Text style={styles.filterText}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={shoeData}
                keyExtractor={(item) => item.id}
                numColumns={3}
                renderItem={renderShoe}
                contentContainerStyle={styles.grid}
            />

            <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                    navigation.navigate('CartScreen', {
                        selectedShoes: selectedShoes.map((id) => {
                            const shoe = shoeData.find((s) => s.id === id);
                            return { ...shoe, size: '', quantity: 1, company: 'Jumantic' }; // Default values
                        }),
                    })
                }>
                <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F8F9',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: UI.color_Gradient[1],
        padding: 16,
        textAlign: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        padding: 12,
        backgroundColor: '#FFFFFF',
    },
    filterButton: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        margin: 4,
    },
    selectedFilter: {
        backgroundColor: UI.color_Gradient[1],
    },
    filterText: {
        color: 'black',
        fontWeight: '500',
    },
    grid: {
        paddingHorizontal: 12,
        paddingBottom: 80,
    },
    shoeContainer: {
        width: ITEM_SIZE,
        margin: 6,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        position: 'relative',
        paddingVertical: 8,
    },
    selectedShoe: {
        backgroundColor: '#C8FACC',
    },
    shoeImage: {
        width: 60,
        height: 60,
    },
    shoeLabel: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        color: '#5a5a5a',
    },
    tickOverlay: {
        position: 'absolute',
        top: 5,
        left: 5,
        backgroundColor: '#00C853',
        borderRadius: 12,
        padding: 2,
        zIndex: 2,
    },
    tick: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    addButton: {
        position: 'absolute',
        bottom: 16,
        left: 20,
        right: 20,
        backgroundColor: UI.color_Gradient[1],
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        elevation: 3,
    },
    addButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
