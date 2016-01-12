import '../../../../node_modules/aframe-core';
import {Entity, Scene} from '../../../../node_modules/aframe-react/';

// import Camera from './aframe/Camera';
// import Light from './aframe/Light';
// import Sky from './aframe/Sky';
/*
<Scene>
        <Camera></Camera>

        <Light type="ambient" color="#888"/>
        <Light type="directional" intensity="0.5" position="-1 1 0"/>
        <Light type="directional" intensity="1" position="1 1 0"/>

        <Entity geometry='primitive: box' material='color: red' position='0 0 -5'/>
      </Scene>
 */
export default class Overlay extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Scene></Scene>
    );
  }
}

