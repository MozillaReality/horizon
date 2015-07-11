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
          url: DEFAULT_URL,
          icons: []
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
  onStereo() {
    document.body.dataset.projection = 'stereo';
  }

  /**
   * Handles switching to mono view-mode.
   */
  onMono() {
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
      url: url || DEFAULT_URL,
      icons: []
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

  onTitleChange(frameProps, e) {
    var frames = this.state.frames;
    frames[this.activeFrameIndex].title = e.detail;
    this.setState({
      frames: frames
    });
  }

  onLocationChange(frameProps, e) {
    var frames = this.state.frames;
    frames[this.activeFrameIndex].location = e.detail;
    this.setState({
      frames: frames
    });
  }

  onIconChange(frameProps, {detail}) {
    var frames = this.state.frames;
    frames.icons.push(detail);
    this.setState({
      frames: frames
    });
  }

  render() {
    return <div>
        <div id='fs-container' ref='fullscreenContainer'
          className={cx({
            hudVisible: this.state.hudVisible
          })}>
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
              this.state.frames.map((frameProps, idx) =>
                 <Frame
                  ref={`frame${idx}`}
                  id={`frame${idx}`}
                  frameProps={frameProps}
                  url={frameProps.url}
                  mozbrowsericonchange={this.onIconChange.bind(this)}
                  mozbrowserlocationchange={this.onLocationChange.bind(this)}
                  mozbrowsertitlechange={this.onTitleChange.bind(this)}
                  onMono={this.onMono.bind(this)}
                  onStereo={this.onStereo.bind(this)} />)
            }
            </div>
          </div>

          <div className='camera threed' ref='camera'>
            <Hud
              runtime={this.runtime}
              activeFrameProps={this.activeFrame}
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
