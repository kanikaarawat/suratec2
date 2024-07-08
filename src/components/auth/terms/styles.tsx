import {StyleSheet} from 'react-native';
import UI from '../../../config/styles/CommonStyles';
export default StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: UI.color_main,
    height: 35,
    textAlign: 'center',
    justifyContent: 'center',
  },
  textTitle: {
    fontSize: 16,
    color: UI.textBlack,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  richText: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pageTitleView: {
    borderBottomColor: UI.color_light_gray,
    borderBottomWidth: 1,
  },
  textPageTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    margin: 15,
  },
  pageWarning: {
    backgroundColor: '#22D0D0',
    flexDirection: 'row',
    opacity: 0.4,
    width: '90%',
    borderRadius: 5,
    marginHorizontal: 16,
    marginTop: 10,
    height: 58,
    padding: 10,
  },
  textNotiBold: {
    fontWeight: '700',
    fontSize: 11,
  },
  textNoti: {
    fontWeight: '400',
  },
  centerView: {
    height: '70%',
    width: '90%',
    marginHorizontal: 20,
    marginTop: 10,
    shadowColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5,
  },
});
