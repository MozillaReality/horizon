/*
global HMDVRDevice, PositionSensorVRDevice
*/

import * as Matrix from 'js/lib/matrix.js';

var matrix = new Matrix();

export default class ViewportManager {
  constructor() {
    this.vrDevices = null;

    this.container = $('#fs-container');
    this.camera = $('#camera');
    this.enter = $('#entervr');

    this.getVrDevices().then(devices => {
      this.vrDevices = devices;
    }).catch(function(err) {
      console.warn(err);
    });
  }

  filterInvalidDevices(devices) {
    let oculusDevices = devices.filter((device) => {
      return device.deviceName.toLowerCase().indexOf('oculus') !== -1;
    });

    if (oculusDevices.length >= 1) {
      return devices.filter((device) => {
        return device.deviceName.toLowerCase().indexOf('cardboard') === -1;
      });
    } else {
      return devices;
    }
  }

  vrDeviceCallback(devices) {
    devices = this.filterInvalidDevices(devices);

    let headset;
    let position;

    for (let i = 0; i < devices.length; i++) {
      let device = devices[i];
      if (device instanceof HMDVRDevice) {
        headset = device;
      }
      if (device instanceof PositionSensorVRDevice) {
        position = device;
      }
      if (position && headset) {
        return ({
          headset: headset,
          position: position
        });
      }
    }
    return false;
  }

  getVrDevices() {
    return new Promise((resolve, reject) => {
      if (navigator.getVRDevices) {
        navigator.getVRDevices().then(devices => {
          resolve(this.vrDeviceCallback(devices));
        });
      } else {
        reject('No VR devices found.');
      }
    });
  }

  resetSensor() {
    if (!this.vrDevices) {
      return false;
    }
    this.vrDevices.position.resetSensor();
  }

  launchFs(element, opts) {
    if (element.requestFullscreen) {
      element.requestFullscreen(opts);
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen(opts);
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(opts);
    }
  }

  enterVr() {
    this.launchFs(this.container, {
      vrDisplay: this.vrDevices.headset
    });
  }

  onFrame() {
    if (!this.vrDevices) {
      return false;
    }

    let state = this.vrDevices.position.getState();
    let orientation = state.orientation;
    let position = state.position;
    let cssPosition = '';

    if (position !== null) {
      for (let p in position) {
        position[p] *= -50; /* scale position from HMD to match CSS values */
      }
      /* -y to account for css y orientation */
      cssPosition = `translate3d(${position.x}cm, ${position.y}cm, ${position.z}cm)`;
    }
    
    this.camera.style.transform = matrix.cssMatrixFromOrientation(orientation) + ' ' + cssPosition;

    window.requestAnimationFrame(this.onFrame.bind(this));
  }

  start(runtime) {
    this.enter.addEventListener('click', this.enterVr.bind(this));

    runtime.keyboardControl.assign({
      'ctrl z': () => this.resetSensor(),
      'ctrl f': () => this.enterVr()
    });

    window.requestAnimationFrame(this.onFrame.bind(this));
  }
}
