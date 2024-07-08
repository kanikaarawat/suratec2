import React, {Component} from 'react';
import {Path} from 'react-native-svg';
import {StyleSheet, View, Text} from 'react-native';
import * as shape from 'd3-shape';
import {YAxis, AreaChart, Grid} from 'react-native-svg-charts';

const getWeight = sensor => {
  fWeight = sensor[0] + sensor[1] + sensor[2];
  mWeight = sensor[3];
  hWeight = sensor[4];
  fWeight = fWeight / 3;
  sumWeight = fWeight + mWeight + hWeight;
  sumWeight = sumWeight / 3;

  return editArray([fWeight, mWeight, hWeight, sumWeight]); // [0 , 0 , 0 , 0]
};

const editArray = arr => {
  let found = false;
  while (!found) {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i; j < arr.length; j++) {
        if (arr[i] === arr[j] && i !== j) {
          arr[i] += 1;
          count++;
        }
      }
    }
    if (count === 0) {
      found = true;
    }
  }
  return arr;
};

export default class Chart extends Component {
  constructor() {
    super();

    this.state = {
      LareaFore: [],
      LareaMid: [],
      LareaHeel: [],
      LareaEntire: [],
      RareaFore: [],
      RareaMid: [],
      RareaHeel: [],
      RareaEntire: [],
    };
  }

  static getDerivedStateFromProps(props, state) {
    let lWeight = getWeight(props.lsensor); // [0 , 0 , 0 , 0 ]
    let rWeight = getWeight(props.rsensor);

    let LareaFore = [...state.LareaFore];
    let LareaEntire = [...state.LareaEntire];
    let LareaHeel = [...state.LareaHeel];
    let LareaMid = [...state.LareaMid];

    let RareaFore = [...state.RareaFore];
    let RareaEntire = [...state.RareaEntire];
    let RareaHeel = [...state.RareaHeel];
    let RareaMid = [...state.RareaMid];

    LareaFore.push(lWeight[0]);
    LareaMid.push(lWeight[1]);
    LareaHeel.push(lWeight[2]);
    LareaEntire.push(lWeight[3]);

    RareaFore.push(rWeight[0]);
    RareaMid.push(rWeight[1]);
    RareaHeel.push(rWeight[2]);
    RareaEntire.push(rWeight[3]);

    if (LareaFore.length > 10) {
      LareaFore.shift();
      LareaMid.shift();
      LareaHeel.shift();
      LareaEntire.shift();
      RareaFore.shift();
      RareaMid.shift();
      RareaHeel.shift();
      RareaEntire.shift();
    }

    return {
      LareaFore,
      LareaMid,
      LareaHeel,
      LareaEntire,
      RareaFore,
      RareaMid,
      RareaHeel,
      RareaEntire,
    };
  }

  render() {
    const colors = ['red', 'green', 'blue', 'black'];
    const keys = ['Fore', 'Mid', 'Entire', 'Heel'];
    const LineFore = ({line}) => (
      <Path
        key={'line'}
        d={line}
        stroke={'rgb(0, 143, 251)'}
        fill={'none'}
        strokeWidth={2}
      />
    );
    const LineMid = ({line}) => (
      <Path
        key={'line'}
        d={line}
        stroke={'rgb(0, 227, 150)'}
        fill={'none'}
        strokeWidth={2}
      />
    );
    const LineHell = ({line}) => (
      <Path
        key={'line'}
        d={line}
        stroke={'rgb(254, 176, 25)'}
        fill={'none'}
        strokeWidth={2}
      />
    );
    const LineEntire = ({line}) => (
      <Path
        key={'line'}
        d={line}
        stroke={'rgb(255, 69, 96)'}
        fill={'none'}
        strokeWidth={2}
      />
    );
    return (
      <View>
        <Text style={{marginLeft: 10, marginTop: 10}}> Left Foot </Text>
        <View style={{height: 200, flexDirection: 'row', margin: 20}}>
          <YAxis
            contentInset={{top: 10, bottom: 10}}
            style={{padding: 10}}
            data={[0, 100, 200, 300, 400, 500, 600, 700]}
            svg={{
              fill: 'grey',
              fontSize: 10,
              padding: 20,
            }}
            numberOfTicks={5}
            formatLabel={value => `${value}`}
          />
          <AreaChart
            style={{flex: 1, marginLeft: 10}}
            data={this.state.LareaFore}
            yMax={800}
            yMin={0}
            svg={{fill: 'rgba(0, 143, 251, 0.2)'}}
           contentInset={{top: 10, bottom: 0}}
            curve={shape.curveNatural}>
            <LineFore />
          </AreaChart>
          <AreaChart
            style={{...StyleSheet.absoluteFill, marginLeft: 47}}
            data={this.state.LareaMid}
            yMax={800}
            yMin={0}
            svg={{fill: 'rgba(0, 227, 150, 0.2)'}}
           contentInset={{top: 10, bottom: 0}}
            curve={shape.curveNatural}>
            <LineMid />
          </AreaChart>
          <AreaChart
            style={{...StyleSheet.absoluteFill, marginLeft: 47}}
            data={this.state.LareaHeel}
            yMax={800}
            yMin={0}
            svg={{fill: 'rgba(254, 176, 25, 0.2)'}}
           contentInset={{top: 10, bottom: 0}}
            curve={shape.curveNatural}>
            <LineHell />
          </AreaChart>
          <AreaChart
            style={{...StyleSheet.absoluteFill, marginLeft: 47}}
            data={this.state.LareaEntire}
            yMax={800}
            yMin={0}
            svg={{fill: 'rgba(255, 69, 96, 0.2)'}}
           contentInset={{top: 10, bottom: 0}}
            curve={shape.curveNatural}>
            <LineEntire />
          </AreaChart>
        </View>
        <View style={{alignItems: 'center'}}>
          <Text style={({color: '#00b7d4'}, {fontSize: 10})}>
            <Text style={{color: 'rgb(0, 143, 251)'}}>● Fore foot</Text>
            {'    '}
            <Text style={{color: 'rgb(0, 227, 150)'}}>● Mid foot</Text>
            {'    '}
            <Text style={{color: 'rgb(254, 176, 25)'}}>● Heel</Text>
            {'    '}
            <Text style={{color: 'rgb(255, 69, 96)'}}>● Entire Foot</Text>
          </Text>
        </View>

        <Text style={{marginLeft: 10, marginTop: 10}}> Right Foot </Text>

        <View style={{height: 200, flexDirection: 'row', margin: 20}}>
          <YAxis
            contentInset={{top: 10, bottom: 10}}
            style={{padding: 10}}
            data={[0, 100, 200, 300, 400, 500, 600, 700]}
            svg={{
              fill: 'grey',
              fontSize: 10,
              padding: 20,
            }}
            numberOfTicks={5}
            formatLabel={value => `${value}`}
          />
          <AreaChart
            style={{flex: 1, marginLeft: 10}}
            data={this.state.RareaFore}
            yMax={800}
            yMin={0}
            svg={{fill: 'rgba(0, 143, 251, 0.2)'}}
            contentInset={{top: 10, bottom: 0}}
            curve={shape.curveNatural}>
            <LineFore />
          </AreaChart>
          <AreaChart
            style={{...StyleSheet.absoluteFill, marginLeft: 47}}
            data={this.state.RareaMid}
            yMax={800}
            yMin={0}
            svg={{fill: 'rgba(0, 227, 150, 0.2)'}}
            contentInset={{top: 10, bottom: 0}}
            curve={shape.curveNatural}>
            <LineMid />
          </AreaChart>
          <AreaChart
            style={{...StyleSheet.absoluteFill, marginLeft: 47}}
            data={this.state.RareaHeel}
            yMax={800}
            yMin={0}
            svg={{fill: 'rgba(254, 176, 25, 0.2)'}}
            contentInset={{top: 10, bottom: 0}}
            curve={shape.curveNatural}>
            <LineHell />
          </AreaChart>
          <AreaChart
            style={{...StyleSheet.absoluteFill, marginLeft: 47}}
            data={this.state.RareaEntire}
            yMax={800}
            yMin={0}
            svg={{fill: 'rgba(255, 69, 96, 0.2)'}}
            contentInset={{top: 10, bottom: 0}}
            curve={shape.curveNatural}>
            <LineEntire />
          </AreaChart>
        </View>

        <View style={{alignItems: 'center'}}>
          <Text style={({color: '#00b7d4'}, {fontSize: 10})}>
            <Text style={{color: 'rgb(0, 143, 251)'}}>● Fore foot</Text>
            {'    '}
            <Text style={{color: 'rgb(0, 227, 150)'}}>● Mid foot</Text>
            {'    '}
            <Text style={{color: 'rgb(254, 176, 25)'}}>● Heel</Text>
            {'    '}
            <Text style={{color: 'rgb(255, 69, 96)'}}>● Entire Foot</Text>
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
