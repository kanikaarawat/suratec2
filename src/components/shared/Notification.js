// 7.11.62
import React, {Component} from 'react';
import NotificationsFix from '../common/NotificationsFix';
import {connect} from 'react-redux';

class NotificationsState extends Component {
  state = {
    switch: false,
  };

  notificationSwitch = (val) => {
    this.setState({ switch: val })
    this.props.actionNotificationButton(val)
  }

  componentDidMount = () => {
    if (typeof this.props.noti !== 'undefined') {
      this.setState({switch: this.props.noti})
    } else {
      this.props.actionNotificationButton(false);
      this.state.switch = false;
    }
  };

  render() {
    return (
      <NotificationsFix
        titleName={'Setting'}
        content={'Notifications'}
        onValueChange={val => {
          this.notificationSwitch(val);
        }}
        switchValue={this.state.switch}
      />
    );
  }
}

const mapStateToProps = state => {
  return {
    noti: state.noti,
  };
};

const mapDisPatchToProps = dispatch => {
  return {
    actionNotificationButton: data => {
      return dispatch({type: 'ACTION_BUTTON_NOTIFICATION', payload: data});
    },
  };
};

export default connect(
  mapStateToProps,
  mapDisPatchToProps,
)(NotificationsState);
