const title = {thai: 'เพิ่มอุปกรณ์', eng: 'Add Devices'}
const devicesListText = {thai: 'อุปกรณ์ที่เชื่อมต่อ', eng: 'Connected Device List'}
const connectText = {thai: 'เชื่อมต่อ', eng: 'Connect'}
const disConnectText = {thai: 'ตัดการเชื่อมต่อ', eng: 'Disconnect'}
const cancelText = {thai: 'ยกเลิก', eng: 'Cancel'}
const nameText = {thai: 'ชื่อ', eng: 'Name'}
const idText = {thai: 'รหัสอุปกรณ์', eng: 'ID'}
const searchText = {thai: 'กำลังค้นหาอุปกรณ์', eng: 'Searching'}
const rssiText = {thai: 'ความเข้มสัญญาณ', eng: 'Signal Strength'}
const connectSuccess = (text) => ({thai: `เชื่อมต่อ ${text} สำเร็จ`, eng: `Connect to ${text} Success`})
const connected = (text) => ({thai: `${text} ได้เชื่อมต่อแล้ว`, eng: `${text} has Connected`})
const connectFail = {thai: 'ไม่สามารถเชื่อมต่อกับอุปกรณ์นี้ได้', eng: `Can't Conect to This Device`}

export default {
    title,
    devicesListText,
    connectFail,
    connectSuccess,
    connected,
    rssiText,
    searchText,
    idText,
    nameText,
    cancelText,
    disConnectText,
    connectText
}