<>
<View style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    width: '70%',
    alignSelf: 'center',
    // width: '50%',
}}>

    <TouchableOpacity style={{}}
    onPress={() => {
        openCamera("BACK");
    } }
    >
        <Ionicons 
                style={{
                    }} name="camera" 
                    size={30} 
                    color="#000"
                    />
    </TouchableOpacity>
    
    <TouchableOpacity style={{
        
    }}
    onPress={() => {
        chooseImage("BACK");
    } }
    >            
        <AntDesign 
                style={{
                    }} name="picture" 
                    size={30} 
                    color="#000"
                    />
    </TouchableOpacity>


</View>















// ----------------------











<View style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '70%',
    alignSelf: 'center',
    marginTop: 2,
}}>

    <TouchableOpacity style={{}}
    onPress={() => {
        openCamera("FRONT");
    } }
    >
        <Ionicons 
                style={{
                    }} name="camera" 
                    size={30} 
                    color="#000"
                    />
    </TouchableOpacity>
    
    <TouchableOpacity style={{}}
    onPress={() => {
        chooseImage("FRONT");
    }}
    >            
        <AntDesign 
                style={{
                    }} name="picture" 
                    size={30} 
                    color="#000"
                    />
    </TouchableOpacity>


</View>




<Draggable
//  x={75} y={100}
left={0}
renderSize={56} renderColor='black' renderText='A' isCircle shouldReverse onShortPressRelease={()=>alert('touched!!')}/> 


<Draggable x={50} y={50}>
<Text>okkkkkk</Text>
</Draggable>






<Modal 
                        backdropColor='white'
                        backdropOpacity={1}
                        isVisible={isModalVisible} 
                        onBackdropPress={toggleModal}
                        onBackButtonPress={toggleModal}
                        style={{
                            // justifyContent: 'center',
                            backgroundColor: 'pink',
                            height: 900,
                            justifyContent: 'center',
                            // alignItems: 'flex-end',
                        }}
                        >
                        <View style={{
                            backgroundColor: 'white',
                            height:windowHeight/2,
                        }}>
                            <View style={{
                                // height: 200,

                                backgroundColor: 'white',
                                flexDirection: 'row',
                                justifyContent: 'space-between', 
                                // alignItems: '',
                                alignItems: 'center',
                                width: '100%',
                                // alignSelf: 'center',
                                marginTop: 2,
                                }}>
                            {
                                visible && 
                                <View
                                onPress={()=>{
                                    setActive('FRONT');
                                    toggleModal();
                                }}
                                style={{
                                    // justifyContent: 'center',
                                    // alignItems: 'center',
                                    // borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: 'black',
                                    borderStyle: 'dashed',
                                    padding: 5,
                                    alignSelf: 'center',
                                    width: 200,
                                    height: 200,
                                    marginTop: 2,
                                    borderRadius: 1,
                                }}>
                            <ImageBackground
                                source={frontimage === 'https://api1.suratec.co.th/legphoto/user.png' ? require('../../../assets/image/Front.png') : { uri: frontimage }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                }}
                                resizeMode="stretch"
                            >
                            </ImageBackground>
                                 </View>
    
                            }

                            
                                <View>
                                    <TouchableOpacity style={{}}
                                    onPress={() => {
                                        openCamera(active);
                                    } }
                                    >
                                        <Text>Capture Photo</Text>
                                    </TouchableOpacity>
                        
                                    <TouchableOpacity style={{}}
                                    onPress={() => {
                                        chooseImage(active);
                                    } }
                                    >            
                                        <Text>Choose Photo</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                    onPress={() => {
                                        toggleModal();
                                    } }
                                    >
                                        <Text>Cancel</Text>
                                    </TouchableOpacity>
                                </View>

                            </View>
                            
{visible &&
                            <View>

                                <Draggable>
                                <TextInput
                                autoCapitalize="none"
                                style={{
                                    
                                    fontSize: 16,
                                    fontWeight: '400',
                                    color: 'red',
                                    borderRadius: 5,
                                    marginBottom: 24,
                                }}
                                // onChangeText={e => setemail(e)}
                                value={'test'}
                                keyboardType="email-address"
                                placeholder="Phone number, username or email id"
                                // placeholderTextColor={colors.phtextcolor}
                            />

                                </Draggable>

                            </View>

                            }

{visible && 
                            <View style={{
                                flexDirection: 'row',
                            }}>
                                <TouchableOpacity
                    onPress={() => {
                        upload();
                    }}
                    style={{
                        padding: 10,
                        // flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#F5FCFF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 150,
                        backgroundColor: UI.color_Gradient[1],
                        borderRadius: 75,
                        alignSelf: 'center',
                        
                    }}>
                        <Text style={{
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: 20,
                        }}>
                            Add TEXT
                        </Text>
                                </TouchableOpacity>
                                

                                <TouchableOpacity
                    onPress={() => {
                        upload();
                    }}
                    style={{
                        padding: 10,
                        // flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#F5FCFF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 150,
                        backgroundColor: UI.color_Gradient[1],
                        borderRadius: 75,
                        alignSelf: 'center',
                        
                    }}>
                        <Text style={{
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: 20,
                        }}>
                            Save
                        </Text>
                                </TouchableOpacity>
                            </View>
                            
                    }
                                

                        </View>
                        </Modal>







































</>

