import React, { Component } from 'react';
import * as Svg from 'react-native-svg'
import { Animated } from 'react-native';

import AnimatedSvgFix from './AnimatedSvgFix';

const NativeSvgPath = Svg.Path;

class SvgPath extends Component {
    setNativeProps = (props = {}) => {
        this._component && this._component.setNativeProps(props);
    }
    render() {
        return (
            <NativeSvgPath
                ref={component => (this._component = component)}
                {...this.props}
            />
        );
    }
}
SvgPath = AnimatedSvgFix(SvgPath);
export default SvgPath;
