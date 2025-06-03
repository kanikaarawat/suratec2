import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    Modal,
} from 'react-native';
import UI from '../../../config/styles/CommonStyles';
import HeaderFix from '../../common/HeaderFix';

export default function CartScreen({ navigation }) {
    const selectedShoes = navigation.getParam('selectedShoes', []);

    const [cartItems, setCartItems] = useState(
        selectedShoes.map((item) => ({
            ...item,
            quantity: 1,
            size: '',
        }))
    );

    const [showPopup, setShowPopup] = useState(false);

    const removeItem = (id) => {
        setCartItems(cartItems.filter((item) => item.id !== id));
    };

    const handleConfirm = () => {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
    };

    const renderItem = ({ item }) => (
        <View style={styles.row}>
            <View style={styles.productCol}>
                <Image source={item.image} style={styles.shoeImage} />
                <View style={styles.details}>
                    <Text style={styles.shoeLabel}>{item.label}</Text>
                    <Text style={styles.shoeSub}>Company: {item.company}</Text>
                    <TextInput
                        style={styles.sizeInput}
                        placeholder="Size: Select"
                        placeholderTextColor="#aaa"
                        value={item.size}
                        onChangeText={(text) =>
                            setCartItems((prev) =>
                                prev.map((shoe) =>
                                    shoe.id === item.id ? { ...shoe, size: text } : shoe
                                )
                            )
                        }
                    />
                </View>
            </View>
            <Text style={styles.colText}>{item.price} THB</Text>
            <Text style={styles.colText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Text style={styles.remove}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => navigation.goBack()}
                title={'Cart'}
            />

            {/* Table Header */}
            <View style={styles.headerRow}>
                <Text style={[styles.headerText, { flex: 2 }]}>PRODUCT</Text>
                <Text style={styles.headerText}>Price</Text>
                <Text style={styles.headerText}>Quantity</Text>
                <Text style={styles.headerText}>Remove</Text>
            </View>

            <FlatList
                data={cartItems}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

            {/* Confirm Button */}
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>

            {/* Popup */}
            <Modal transparent={true} visible={showPopup} animationType="fade">
                <View style={styles.popupContainer}>
                    <View style={styles.popupBox}>
                        <Text style={styles.popupText}>Order Confirmed</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F8F9' },
    headerRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: UI.color_Gradient[1],
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    productCol: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    shoeImage: { width: 40, height: 40, marginRight: 8 },
    details: { flexShrink: 1 },
    shoeLabel: { color: '#5a5a5a', fontWeight: 'bold', fontSize: 12 },
    shoeSub: { color: '#5a5a5a', fontSize: 11 },
    sizeInput: {
        borderBottomWidth: 1,
        borderColor: '#ccc',
        fontSize: 11,
        paddingVertical: 2,
        color: '#5a5a5a',
    },
    colText: {
        flex: 1,
        color: '#5a5a5a',
        fontSize: 12,
        textAlign: 'center',
    },
    remove: {
        fontSize: 18,
        textAlign: 'center',
    },
    confirmBtn: {
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
    confirmText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    popupContainer: {
        flex: 1,
        backgroundColor: '#00000080',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupBox: {
        backgroundColor: UI.color_Gradient[1],
        padding: 30,
        borderRadius: 16,
    },
    popupText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
