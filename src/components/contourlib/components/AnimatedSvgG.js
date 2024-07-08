import React, { Component } from 'react';
import * as Svg from 'react-native-svg'
import AnimatedSvgFix from './AnimatedSvgFix';

const NativeSvgG = Svg.G;

class SvgG extends Component {
    setNativeProps = (props) => {
        this._component && this._component.setNativeProps(props);
    }
    render() {
        return (
            <NativeSvgG
                ref={component => (this._component = component)}
                {...this.props}
            />
        );
    }
}
SvgG = AnimatedSvgFix(SvgG);
export default SvgG;
