import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    Modal,
    BackHandler,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import shoeLang from '../../../assets/language/menu/lang_shoe';
import {getLocalizedText} from "../../../assets/language/langUtils";
import { connect } from 'react-redux';

const UK_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12'];

const CartScreen = ({ route, navigation, lang }) => {
    const selectedShoes = navigation.getParam('selectedShoes', []);

    const [cartItems, setCartItems] = useState(
        selectedShoes.map((item) => ({
            ...item,
            quantity: 1,
            size: '',
        }))
    );

    const [sizeModal, setSizeModal] = useState({ visible: false, index: null });
    const [note, setNote] = useState('');
    const [showPopup, setShowPopup] = useState(false);

    const updateSize = (size) => {
        const updated = [...cartItems];
        if (sizeModal.index !== null) {
            updated[sizeModal.index].size = size;
            setCartItems(updated);
        }
        setSizeModal({ visible: false, index: null });
    };

    const updateQuantity = (index, delta) => {
        const updated = [...cartItems];
        const newQty = updated[index].quantity + delta;
        updated[index].quantity = newQty < 1 ? 1 : newQty;
        setCartItems(updated);
    };

    const removeItem = (index) => {
        const updated = [...cartItems];
        updated.splice(index, 1);
        setCartItems(updated);
    };

    const calculateTotal = () =>
        cartItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * item.quantity), 0);

    const handleConfirm = () => {
        const missingSize = cartItems.some((item) => !item.size);
        if (missingSize) {
            Alert.alert(
                getLocalizedText(lang, shoeLang.missingSize),
                getLocalizedText(lang, shoeLang.pleaseSelectSize)
            );
            return;
        }
        setShowPopup(true);
        setTimeout(() => {
            setShowPopup(false);
            navigation.navigate('Home');
        }, 2000);
    };


    const renderItem = ({ item, index }) => (
        <View style={styles.rowCard}>
            {/* PRODUCT section */}
            <View style={[styles.column, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                <Image source={{ uri: item.image_url }} style={styles.image} />
                <View style={styles.itemDetails}>
                    <Text style={styles.name}>{item.product_name}</Text>
                    <TouchableOpacity
                        onPress={() => setSizeModal({ visible: true, index })}
                        style={styles.sizeBox}
                    >
                        <Text style={{ fontSize: 13, color: item.size ? '#000' : '#888' }}>
                            {item.size ? `${getLocalizedText(lang, shoeLang.uk)} ${item.size}` : getLocalizedText(lang, shoeLang.selectSize)}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* PRICE section */}
            <View style={styles.column}>
                <Text style={styles.price}>{item.price} THB</Text>
            </View>

            {/* QTY section */}
            <View style={[styles.column, styles.qtyControls]}>
                <TouchableOpacity onPress={() => updateQuantity(index, -1)} style={styles.qtyBtn}>
                    <Text style={styles.qtySymbol}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(index, 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtySymbol}>+</Text>
                </TouchableOpacity>
            </View>

            {/* REMOVE section */}
            <View style={styles.column}>
                <TouchableOpacity onPress={() => removeItem(index)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );



    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            style={styles.container}
        >
            <HeaderFix icon_left="left" onpress_left={() => navigation.goBack()} title={getLocalizedText(lang, shoeLang.cart)} />

            <View style={styles.tableHeader}>
                <Text style={[styles.headerText, { flex: 2 }]}>{getLocalizedText(lang, shoeLang.product)}</Text>
                <Text style={styles.headerText}>{getLocalizedText(lang, shoeLang.price)}</Text>
                <Text style={styles.headerText}>{getLocalizedText(lang, shoeLang.qty)}</Text>
                <Text style={styles.headerText}>{getLocalizedText(lang, shoeLang.remove)}</Text>
            </View>

            <FlatList
                data={cartItems}
                keyExtractor={(item, i) => item.product_name + i}
                renderItem={renderItem}
                ListFooterComponent={
                    cartItems.length > 0 ? (
                        <View style={styles.noteSection}>
                            <Text style={styles.noteLabel}>{getLocalizedText(lang, shoeLang.addNote)}</Text>
                            <TextInput
                                style={styles.noteInput}
                                placeholder={getLocalizedText(lang, shoeLang.notePlaceholder)}
                                placeholderTextColor="#aaa"
                                value={note}
                                onChangeText={setNote}
                            />
                            <Text style={styles.total}>{getLocalizedText(lang, shoeLang.total)}: ฿{calculateTotal().toFixed(2)}</Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={{ paddingBottom: 140 }}
            />

            {cartItems.length > 0 && (
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                    <Text style={styles.confirmText}>{getLocalizedText(lang, shoeLang.confirm)}</Text>
                </TouchableOpacity>
            )}

            {/* Size Modal */}
            <Modal transparent visible={sizeModal.visible} animationType="slide" onRequestClose={() => setSizeModal({ visible: false, index: null })}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        {UK_SIZES.map((size) => (
                            <TouchableOpacity key={size} onPress={() => updateSize(size)} style={styles.modalItem}>
                                <Text style={styles.modalItemText}>{getLocalizedText(lang, shoeLang.uk)} {size}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setSizeModal({ visible: false, index: null })}>
                            <Text style={[styles.modalItemText, { color: 'red', marginTop: 10 }]}>{getLocalizedText(lang, shoeLang.cancel)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Confirmation Popup */}
            <Modal transparent visible={showPopup} animationType="fade">
                <View style={styles.popupOverlay}>
                    <View style={styles.popupBox}>
                        <Text style={styles.popupText}>{getLocalizedText(lang, shoeLang.orderConfirmed)}</Text>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eafcff' },

    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        backgroundColor: '#00c3cc',
        paddingHorizontal: 10,
    },
    headerText: {
        flex: 1,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 13,
    },

    card: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginTop: 10,
        borderRadius: 12,
        padding: 12,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 6,
        marginRight: 10,
    },
    details: {
        flex: 2,
    },
    name: { fontSize: 14, fontWeight: 'bold', color: '#222' },
    group: { fontSize: 12, color: '#555', marginVertical: 4 },
    sizeBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        paddingVertical: 5,
        paddingHorizontal: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
        backgroundColor: '#f9f9f9',
    },

    actions: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    price: {
        fontSize: 13,
        color: '#00a0a8',
        fontWeight: '600',
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    qtyBtn: {
        backgroundColor: '#00c3cc',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    qtySymbol: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
    },
    qtyText: {
        marginHorizontal: 8,
        fontSize: 14,
        color: '#333',
    },
    deleteBtn: { marginTop: 2 },
    deleteText: { fontSize: 18, color: '#cc0000' },

    noteSection: {
        marginHorizontal: 16,
        marginTop: 20,
    },
    noteLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#444',
        marginBottom: 6,
    },
    noteInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
    },
    total: {
        textAlign: 'right',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007B7F',
        marginTop: 12,
    },

    confirmBtn: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#00c3cc',
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
    },
    confirmText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000080',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '80%',
    },
    modalItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    modalItemText: {
        fontSize: 17,
        textAlign: 'center',
        color: '#333',
    },

    popupOverlay: {
        flex: 1,
        backgroundColor: '#00000088',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupBox: {
        backgroundColor: '#00c3cc',
        padding: 30,
        borderRadius: 20,
    },
    popupText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'center',
        zIndex:10,
        marginEnd:-10
    },

    rightSection: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: 10,
    },

    price: {
        fontSize: 13,
        color: '#00a0a8',
        fontWeight: '600',
        marginStart:10,
        marginEnd:-15
    },

    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
        marginStart:30
    },

    qtyBtn: {
        backgroundColor: '#00c3cc',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },

    qtySymbol: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
    },

    qtyText: {
        marginHorizontal: 3,
        fontSize: 14,
        color: '#333',
    },

    deleteBtn: {
        marginTop: 4,
        marginEnd:-20
    },

    deleteText: {
        fontSize: 18,
        color: '#cc0000',
    },
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginTop: 10,
        borderRadius: 12,
        padding: 10,
        elevation: 2,
    },

    column: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    image: {
        width: 50,
        height: 50,
        borderRadius: 6,
        marginRight: 8,
    },

});

export default connect(state => ({ lang: state.lang }))(CartScreen);