var RNFS = require('react-native-fs');

export class FileManager {
  constructor() {
    this.path = RNFS.DocumentDirectoryPath + this._getFileName();
  }
  _getFileName = () => {
    let date = new Date();
    return (
      '/surasole-log-' +
      date.getDate().toString() +
      (date.getMonth() + 1).toString() +
      date.getFullYear().toString() +
      date.getHours().toString() +
      date.getMinutes().toString() +
      date.getSeconds().toString() +
      '.text'
    );
  };
  appendText = data => {
    RNFS.appendFile(this.path, JSON.stringify(data) + ',').then(() => {});
    return this.path;
  };
}

export const deleteFile = async path => {
  try {
    await RNFS.unlink(path);
  } catch (err) {
    console.log(err.message);
  }
};

export const readFile = fileDir => {
  return RNFS.readFile(fileDir);
  //let path = RNFS.DocumentDirectoryPath + fileName;
  // const content = await RNFS.readFile(fileDir).then((data) => {
  //   dataOBJ =  JSON.parse('[' + data.substring(0 , data.length - 1) + ']')
  //   console.log(dataOBJ)
  //   return {content: dataOBJ}
  // })
  // console.log(content)
  // return content;
};

export const getFileList = () => {
  let path = RNFS.DocumentDirectoryPath;
  let regex = /(surasole-log-)\d+(.text)/gi;
  // let list = RNFS.readDir(path).then((items) => {
  //   return items.find((v) => {regex.test(v.name)})
  // })
  // return list;
  return RNFS.readDir(path);
};
