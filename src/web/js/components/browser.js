import React from '../../../../node_modules/react';
import Frame from './frame.js';
import Hud from './hud.js';
import cx from './../lib/class_set.js';

import ContentScripts from './../content_scripts.js';
import Debugging from './../debugging.js';
import FrameCommunicator from './../frame_communicator.js';
import ViewportManager from './../viewport_manager.js';
import GamepadInput from './../inputs/gamepad/index.js';
import KeyboardInput from './../inputs/keyboard/index.js';
import Utils from './../lib/utils.js';

const DEFAULT_URL = 'http://mozvr.com/posts/quick-vr-prototypes/';

export default class Browser extends React.Component {

  constructor(props) {
    super(props);

    var runtime = props.runtime;
    runtime.utils = new Utils();
    runtime.contentScripts = new ContentScripts();
    runtime.debugging = new Debugging();
    runtime.frameCommunicator = new FrameCommunicator('browser');
    runtime.gamepadInput = new GamepadInput();
    runtime.keyboardInput = new KeyboardInput();
    runtime.viewportManager = new ViewportManager({
      onCameraTransform: this.onCameraTransform.bind(this)
    });
    runtime.settings = {
      www_directory_src: '/directory.json',
      www_browser_start_src: '/media/browser_start.wav',
      play_audio_on_browser_start: false,
      hmd_scale: -100,
      pixels_per_meter: 96 / 2.54,
    };

    runtime.contentScripts.init(runtime);
    runtime.debugging.init(runtime);
    runtime.frameCommunicator.init(runtime);
    runtime.gamepadInput.init(runtime);
    runtime.keyboardInput.init(runtime);
    runtime.viewportManager.init(runtime);
    this.runtime = runtime;

    runtime.keyboardInput.assign({
      ' ': () => this.toggleHud()
    });

    this.state = {
      hudVisible: false,
      frames: [
        {
          viewmode: 'mono',
          url: DEFAULT_URL
        }
      ]
    };
    this.activeFrameIndex = 0;
  }

  get activeFrame() {
    return this.state.frames[this.activeFrameIndex];
  }

  /**
   * Handles switching to stereo view-mode.
   */
  toStereo() {
    document.body.dataset.projection = 'stereo';
  }

  /**
   * Handles switching to mono view-mode.
   */
  toMono() {
    document.body.dataset.projection = 'mono';
  }

  toggleHud() {
    // Steal focus from whichever element is currently focussed.
    var el = document.activeElement;
    if (el) {
      el.blur();
    }

    this.setState({
      hudVisible: !this.state.hudVisible
    });
  }

  newFrame(url) {
    var frames = this.state.frames;
    this.activeFrameIndex = frames.length;
    frames.push({
      url: url || DEFAULT_URL
    });
    this.setState({frames: frames});
  }

  /**
   * Enters VR mode.
   */
  enterVR() {
    this.runtime.viewportManager.enterVr(React.findDOMNode(this.refs.fullscreenContainer));
  }

  /**
   * Sets camera transform.
   */
  onCameraTransform(transform) {
    React.findDOMNode(this.refs.camera).style.transform = transform;
    if (this.activeFrame.viewmode === 'mono') {
      React.findDOMNode(this.refs.contentCamera).style.transform = transform;
    }
  }

  onUrlEntry(e) {
    e.preventDefault();
    var urlInput = React.findDOMNode(this.refs.urlInput);
    this.navigate(urlInput.value);
    this.urlInput.blur();
    this.hideHud();
  }

  /**
   * Handles mozbrowser events
   */
  onBrowserEvent(event) {
    console.log('Received', event);
  }

  /**
   * Shows/Hides majority of the HUD elements.
   */
  showHud() {
    this.container.style.animation = 'fs-container-darken 0.5s ease forwards';
    this.viewportManager.contentContainer.classList.add('pushBack');
    this.title.style.animation = 'show 0.1s ease forwards';
    this.directory.style.animation = 'show 0.1s ease forwards';
    this.urlbar.style.animation = 'show 0.1s ease forwards';
    this.backfwd.style.animation = 'show 0.1s ease forwards';
    this.showStopreload();
    this.closehudButton.style.animation = 'show 0.1s ease forwards';
    this.hudBackground.style.animation = 'show 0.3s ease forwards';
  }

  hideHud(firstLoad) {
    this.urlInput.blur();
    this.container.style.animation = 'fs-container-lighten 0.5s ease forwards';
    this.viewportManager.contentContainer.classList.remove('pushBack');
    this.title.style.animation = 'hide 0.1s ease forwards';
    this.directory.style.animation = 'hide 0.1s ease forwards';
    this.urlbar.style.animation = 'hide 0.1s ease forwards';
    this.backfwd.style.animation = 'hide 0.1s ease forwards';
    this.hideStopreload();
    this.closehudButton.style.animation = 'hide 0.1s ease forwards';
    this.hudBackground.style.animation = 'hide 0.3s ease forwards';
  }

  render() {
    return <div>
        <div id='fs-container' ref='fullscreenContainer'>
          <div id='content-camera'
            className={this.activeFrame.viewmode === 'mono' ? 'camera threed' : ''}
            ref='contentCamera'>
            <div id='content-container'
              className={cx({
                'content-container': true,
                [`frame--${this.activeFrame.viewmode}`]: true,
                threed: this.activeFrame.viewmode === 'mono'
              })}
              ref="frameWrapper">
            {
              this.state.frames.map((frameProps, idx) => {
                 return <Frame
                  ref={`frame${idx}`}
                  id={`frame${idx}`}
                  url={frameProps.url}
                  browserEvent={this.onBrowserEvent.bind(this)} />
              })
            }
            </div>
          </div>

          <div className='camera threed' ref='camera'>
            <Hud
              hudVisible={this.state.hudVisible}
              onUrlEntry={this.onUrlEntry.bind(this)}/>
          </div>
          <div id='cursor' className='cursor threed'>
            <div className='cursor-arrow threed'></div>
          </div>
        </div>
        <button
          id='entervr'
          className='btn btn--entervr'
          onClick={this.enterVR.bind(this)}
          >Enter VR</button>
      </div>;
  }
}
