/*
global HMDVRDevice, PositionSensorVRDevice
*/

import Matrix from './lib/matrix.js';

var matrix = new Matrix();

export default class ViewportManager {
  constructor() {
    this.body = document.body;
    this.container = $('#fs-container');
    this.contentCamera = $('#content-camera')
    this.contentContainer = $('#content-container');
    this.enter = $('#entervr');

    // use CSS variable for mono content scale value.
    this.monoScale = window.getComputedStyle(document.documentElement).getPropertyValue('--content-scale');

    this.vrDevices = null;
    this.lastPosition = null;
    this.getVrDevices().then(devices => {
      this.vrDevices = devices;
    }).catch(function(err) {
      console.warn(err);
    });
  }


  /**
   * Returns elements which camera transforms should be applied.
   *
   * @returns {Array} Array of elements.
   */
  getCameras() {
    return $$('.camera');
  }


  /**
   * Handles switching to stereo view-mode.
   */
  toStereo() {
    // Remove the classNames used to apply camera view transforms.
    this.contentCamera.className = '';
    this.cameras = this.getCameras();
    // Clear any transforms left over from mono-mode.
    this.contentCamera.style.transform = '';
    this.contentContainer.className = 'frame--stereo';
    this.body.dataset.projection = 'stereo';
  }


  /**
   * Handles switching to mono view-mode.
   */
  toMono() {
    // Add classNames used to apply camera view transforms.
    this.contentCamera.className = 'camera threed';
    this.cameras = this.getCameras();
    this.contentContainer.className = 'frame--mono threed';
    this.body.dataset.projection = 'mono';
  }

  filterInvalidDevices(devices) {
    let oculusDevices = devices.filter(device => {
      return device.deviceName.toLowerCase().indexOf('oculus') !== -1;
    });

    if (oculusDevices.length >= 1) {
      return devices.filter(device => {
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
        return {
          headset: headset,
          position: position
        };
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
      console.warn('No VR devices detected.');
      return false;
    }

    let state = this.vrDevices.position.getState();
    this.runtime.hmdState = state;
    let orientation = state.orientation;
    let position = state.position || this.lastPosition;
    let cssPosition = '';

    if (position !== null) {
      // The scaled position to use.
      let val = {};

      for (let p in position) {
        val[p] = position[p] * this.settings.hmd_scale; /* scale position from HMD to match CSS values */
      }
      /* -y to account for css y orientation */
      val.y *= -1;
      cssPosition = `translate3d(${val.x}cm, ${val.y}cm, ${val.z}cm)`;

      // Store the last position to smooth movement if we don't get a position next time.
      this.lastPosition = position;
    }

    this.hmdState = {
      position: position,
      orientation: orientation
    };

    let transform = matrix.cssMatrixFromOrientation(orientation) + ' ' + cssPosition;

    this.cameras.forEach(camera => {
      camera.style.transform = transform;
    });

    window.requestAnimationFrame(this.onFrame.bind(this));
  }

  init(runtime) {
    this.runtime = runtime;
    this.settings = runtime.settings;
    this.enter.addEventListener('click', this.enterVr.bind(this));

    // Handles moving between stereo and mono view modes.
    window.addEventListener('stereo-viewmode', this.toStereo.bind(this));
    window.addEventListener('mono-viewmode', this.toMono.bind(this));

    runtime.keyboardInput.assign({
      'ctrl z': () => this.resetSensor(),
      'ctrl f': () => this.enterVr()
    });

    window.requestAnimationFrame(this.onFrame.bind(this));
  }
}
