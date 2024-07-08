//5.11.62

import React, {Component} from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {connect} from 'react-redux';

import HeaderFix from '../../common/HeaderFix';
import AlertFix from '../../common/AlertsFix';
import CardProfile from '../profile/card_profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../../../config/Api';

import UI from '../../../config/styles/CommonStyles';

import Lang from '../../../assets/language/menu/lang_profile';
import LangModal from './lang_model';

import ImagePicker from 'react-native-image-picker';

const options = {
  title: 'Select Picture',
  quality: 0.4,
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
};

const screenWidth = Math.round(Dimensions.get('window').width) * 0.35;

class index extends Component {
  state = {
    id_customer: '',
    fname: '',
    lname: '',
    weigth: '',
    heigth: '',
    age: '',
    sex: 0,
    id: '',
    tel: '',
    email: '',
    img_path: '',
    onModal: false,
    loading: false,
    id_facebook: '',
  };

  actionLang = () => {
    this.props.lang == 1 ? this.props.edit_Lang(0) : this.props.edit_Lang(1);
    this.setState({onModal: false});
  };

  actionUpdate = () => {
    let body = '';
    this.setState({loading: true});
    if (this.state.id_facebook != '') {
      body = {
        id: this.state.id,
        id_facebook: this.state.id_facebook,
        fname: this.state.fname,
        lname: this.state.lname,
        email: this.state.email,
        age: this.state.age,
        type: this.props.user.role,
        gender: this.state.sex,
        weight: this.state.weigth,
        telephone: this.state.tel,
        height: this.state.heigth,
        congenital_disease_flg: '1', // set ไว้รู้จะใส่อะไร
        congenital_disease: 'ความดัน', // set ไว้รู้จะใส่อะไร
        emergency_contract: '150 ถ.ศรีธานี', // set ไว้รู้จะใส่อะไร
      };
    } else {
      body = {
        id: this.state.id,
        fname: this.state.fname,
        lname: this.state.lname,
        age: this.state.age,
        email: this.state.email,
        type: this.props.user.role,
        gender: this.state.sex,
        weight: this.state.weigth,
        telephone: this.state.tel,
        height: this.state.heigth,
        congenital_disease_flg: '1', // set ไว้รู้จะใส่อะไร
        congenital_disease: 'ความดัน', // set ไว้รู้จะใส่อะไร
        emergency_contract: '150 ถ.ศรีธานี', // set ไว้รู้จะใส่อะไร
      };
    }

    fetch(`${API}/updata-profile`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(res => {
        this.setState({loading: false});
        console.log(res);

        if (res.message == 'บันทึกไม่สำเร็จ') {
          AlertFix.alertBasic(
            this.props.lang
              ? Lang.alertErrorTitle.thai
              : Lang.alertErrorTitle.eng,
            this.props.lang
              ? Lang.cannotEditAlert.thai
              : Lang.cannotEditAlert.eng,
          );
        } else {
          AlertFix.alertBasic(
            this.props.lang
              ? Lang.alertSuccessTitle.thai
              : Lang.alertSuccessTitle.eng,
            this.props.lang
              ? Lang.successTitleContentAlert.thai
              : Lang.successTitleContentAlert.eng,
          );
          let actualUser = res.customer_info;
          actualUser.role = this.props.user.role;
          this.props.addUser({user: actualUser, token: this.props.token});

          this.props.navigation.goBack();
        }
      })
      .catch(error => {
        this.setState({loading: false});
        console.log(error);
      });
  };

  componentDidMount = async () => {
    let user = this.props.user;
    console.log(user, 'userfff');
    this.setState({
      id:
        this.props.user.role == 'mod_employee'
          ? user.id_employee
          : user.id_customer,
      fname: user.fname.toString(),
      lname: user.lname.toString(),
      email: user.email,
      sex: user.sex === null ? 0 : parseInt(user.sex),
      heigth: user.height == null ? '0' : user.height.toString(),
      weigth: user.weight == null ? '0' : user.weight.toString(),
      age: user.age == null ? '0' : user.age.toString(),
      tel: user.telephone == null ? '0' : user.telephone.toString(),
      id_facebook: user.id_facebook == null ? '' : user.id_facebook.toString(),
    });

    let img = this.props.user.image;
    if (this.props.user.image === '' || this.props.user.image === undefined) {
      if (this.props.user.role == 'mod_employee') {
        img = 'doctor.png';
      } else {
        img = 'user.png';
      }
    } else {
      img = this.props.user.image;
    }
    this.setState({img_path: img});
  };

  editprofilePicture = () => {
    this.setState({loading: true});
    console.log('Edit Profile Picture Called');
    ImagePicker.launchImageLibrary(options, response => {
      console.log(response);
      if (response.fileName) {
        console.log(response);
        const data = new FormData();
        data.append('id', this.state.id);
        data.append('type', this.props.user.role);
        data.append('image', {
          name: response.fileName,
          type: response.type,
          uri: response.uri,
        });
        fetch(`${API}/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: data,
        })
          .then(res => {
            console.log(res);
            return res.json();
          })
          .then(res => {
            console.log(res);
            this.setState({loading: false});
            if (res.status === 'สำเร็จ') {
              let user = {...this.props.user, image: res.data};
              this.setState({img_path: res.data});
              this.props.updatePath(user);
              AlertFix.alertBasic(
                this.props.lang
                  ? Lang.alertSuccessTitle.thai
                  : Lang.alertSuccessTitle.eng,
                this.props.lang
                  ? Lang.successTitleContentAlert.thai
                  : Lang.successTitleContentAlert.eng,
              );
            } else {
              AlertFix.alertBasic(
                this.props.lang
                  ? Lang.alertErrorTitle.thai
                  : Lang.alertErrorTitle.eng,
                this.props.lang
                  ? Lang.cannotEditAlert.thai
                  : Lang.cannotEditAlert.eng,
              );
            }
          })
          .catch(err => {
            this.setState({loading: false});
            AlertFix.alertBasic(
              this.props.lang
                ? Lang.alertErrorTitle.thai
                : Lang.alertErrorTitle.eng,
              this.props.lang
                ? Lang.cannotEditAlert.thai
                : Lang.cannotEditAlert.eng,
            );
            console.log(err);
          });
      }
    });
    //   .catch(err => {
    //     console.log(err);
    //     AlertFix.alertBasic(
    //       this.props.lang
    //         ? Lang.alertErrorTitle.thai
    //         : Lang.alertErrorTitle.eng,
    //       this.props.lang
    //         ? Lang.cannotEditAlert.thai
    //         : Lang.cannotEditAlert.eng,
    //     );

    //   });
  };

  validateNumber(key, value) {
    var temp = value;
    var value = parseInt(value);
    var data = {};
    console.log(value);
    if (temp == '') {
      console.log('temp');
      data[key] = temp;
      this.setState(data);
    } else if (!isNaN(value)) {
      console.log('not NaN');
      data[key] = value.toString();
      this.setState(data);
    } else if (isNaN(value)) {
      console.log('isNaN');
      data[key] = (0).toString();
      this.setState(data);
    }
  }

  validateNumber(key, value) {
    var temp = value;
    var value = parseInt(value);
    var data = {};
    console.log(value);
    if (temp == '') {
      console.log('temp');
      data[key] = temp;
      this.setState(data);
    } else if (!isNaN(value)) {
      console.log('not NaN');
      data[key] = value.toString();
      this.setState(data);
    } else if (isNaN(value)) {
      console.log('isNaN');
      data[key] = (0).toString();
      this.setState(data);
    }
  }

  render() {
    const {img_path, loading} = this.state;

    return (
      <ScrollView style={{flex: 1}}>
        <HeaderFix
          icon_left={'left'}
          onpress_left={() => {
            this.props.navigation.goBack();
          }}
          title={this.props.lang ? 'แก้ไขโปรไฟล์' : 'Edit Profile'}
          icon_rigth={'ellipsis-v'}
          iconType={'FontAwesome5'}
          onpress_rigth={() => {
            this.setState({onModal: true});
          }}
        />

        <View>
          {/* {loading &&
                     <View style={{position:'absolute', flex:1, flexDirection:'row', justifyContent:'center', top:'45%', left:'45%', zIndex:999}}>
                        <ActivityIndicator size="large" /> 
                    </View>
                  } */}
          <TouchableOpacity
            style={{alignItems: 'center', paddingTop: 16}}
            onPress={() => this.editprofilePicture()}>
            <View style={{width: screenWidth, height: screenWidth, padding: 5}}>
              <Image
                style={{
                  width: screenWidth,
                  height: screenWidth,
                  borderRadius: screenWidth / 2,
                }}
                source={{
                  uri: this.props.user.image,
                  // uri: 'https://api1.suratec.co.th/pic/' + img_path
                }}
              />
              <View
                style={{
                  width: screenWidth * 0.2,
                  height: screenWidth * 0.2,
                  borderRadius: screenWidth * 0.34,
                  position: 'absolute',
                  backgroundColor: UI.color_Gradient[1],
                  bottom: 1,
                  right: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  style={{
                    width: screenWidth * 0.13,
                    height: screenWidth * 0.13,
                  }}
                  source={require('../../../assets/image/icons/camera.png')}
                />
              </View>
            </View>
          </TouchableOpacity>

          <CardProfile
            labelFirstName={
              this.props.lang
                ? Lang.firstNamelabel.thai
                : Lang.firstNamelabel.eng
            }
            inputValueFirstName={this.state.fname}
            inputFirstName={txt => {
              this.setState({fname: txt});
            }}
            labelLastName={
              this.props.lang ? Lang.LastNamelabel.thai : Lang.LastNamelabel.eng
            }
            inputValueLastName={this.state.lname}
            inputLastName={txt => {
              this.setState({lname: txt});
            }}
            labelEmail={
              this.props.lang ? Lang.Emaillabel.thai : Lang.Emaillabel.eng
            }
            inputValueEmail={this.state.email}
            inputEmail={txt => {
              this.setState({email: txt});
            }}
            labelGender={
              this.props.lang ? Lang.genderlabel.thai : Lang.genderlabel.eng
            }
            inputValueGender={this.state.sex}
            inputGender={txt => {
              console.log('sex', txt);
              this.setState({sex: txt});
            }}
            labelWeigth={
              this.props.lang ? Lang.weightLabel.thai : Lang.weightLabel.eng
            }
            inputValueWeigth={this.state.weigth}
            inputWeigth={txt => {
              this.validateNumber('weigth', txt);
            }}
            labelHeight={
              this.props.lang ? Lang.heigthLabel.thai : Lang.heigthLabel.eng
            }
            inputValueHeight={this.state.heigth}
            inputHeigth={txt => {
              this.validateNumber('heigth', txt);
            }}
            labelAge={this.props.lang ? Lang.ageLabel.thai : Lang.ageLabel.eng}
            inputValueAge={this.state.age}
            inputAge={txt => {
              this.validateNumber('age', txt);
            }}
            labelTel={
              this.props.lang
                ? Lang.emergencyLabel.thai
                : Lang.emergencyLabel.eng
            }
            inputValueTel={this.state.tel}
            inputTel={txt => {
              this.setState({tel: txt});
            }}
            type={this.props.user.role}
            onUpdate={() => this.actionUpdate()}
          />

          <LangModal
            title={this.props.lang ? Lang.langTitle.thai : Lang.langTitle.eng}
            modalVisible={this.state.onModal}
            onModalClosed={() => {
              this.setState({onModal: false});
            }}
            labelBtn={this.props.lang ? 'English' : 'ภาษาไทย'}
            onLang={() => this.actionLang()}
          />
        </View>
      </ScrollView>
    );
  }
}

const mapStateToProps = state => {
  return {
    token: state.token,
    user: state.user,
    lang: state.lang,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addUser: user => {
      return dispatch({type: 'ADD_USERINFO', payload: user});
    },
    resetUser: () => {
      return dispatch({type: 'RESET_USERINFO'});
    },
    edit_Lang: data => {
      return dispatch({type: 'EDIT_LANG', payload: data});
    },
    updatePath: path => {
      return dispatch({type: 'EDIT_PROFILE_PATH', payload: path});
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(index);
