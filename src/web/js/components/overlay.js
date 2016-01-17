import React from 'react';
import ReactDOM from 'react-dom';

import 'aframe';
import {Animation, Entity, Scene} from 'aframe-react';

export default class Overlay extends React.Component {

  constructor(props) {
    super(props);
  }

  componentWillUpdate(nextProps) {
    if (nextProps.isVr) {
      var scene = ReactDOM.findDOMNode(this.refs.scene);
      scene.hideUI();
      scene.setStereoRenderer();
    }
  }

  render() {
    return <Scene ref='scene'>
        <Entity geometry={{primitive: 'box'}} material='color: red' position='0 0 -5'>
          <Animation attribute='rotation' dur='5000' repeat='indefinite' to='0 360 360'/>
        </Entity>
      </Scene>;
  }
}

