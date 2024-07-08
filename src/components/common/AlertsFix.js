import { Alert } from 'react-native';


const alertBasic = (title , messages) =>{
    if(title === null){
        //null
        Alert.alert('รายงานข้อผิดพลาด' , messages)
    }else if(!title){
        // flase
        Alert.alert('ทำรายการสำเร็จ' , messages)

    }else{
        Alert.alert(title  , messages)
    }
}

export default { 
    alertBasic 
}