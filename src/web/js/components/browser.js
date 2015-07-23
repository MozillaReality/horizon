import ContentScripts from './../content_scripts.js';
import Debugging from './../debugging.js';
import FrameCommunicator from './../frame_communicator.js';
import ViewportManager from './../viewport_manager.js';

import GamepadInput from './../inputs/gamepad/index.js';
import KeyboardInput from './../inputs/keyboard/index.js';

import Cursor from './cursor.js';
import Frame from './frame.js';
import Hud from './hud.js';
import Settings from '../settings.js';
import UriHelper from './../lib/uri_helper.js';
import Utils from './../lib/utils.js';
import cx from './../lib/class_set.js';

export default class Browser extends React.Component {

  constructor(props) {
    super(props);

    var runtime = props.runtime;
    runtime.utils = new Utils();
    runtime.contentScripts = new ContentScripts();
    runtime.debugging = new Debugging();
    runtime.frameCommunicator = new FrameCommunicator('browser', {
      getActiveFrameElement: () => this.activeFrameElement
    });
    runtime.gamepadInput = new GamepadInput();
    runtime.keyboardInput = new KeyboardInput();
    runtime.viewportManager = new ViewportManager({
      onHmdFrame: this.onHmdFrame.bind(this),
      enterBrowserVR: this.enterVR.bind(this)
    });
    runtime.settings = Settings;

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
      hudUrl: null,
      frames: [
        {
          viewmode: 'mono',
          url: Settings.start_page_url,
          icons: []
        }
      ]
    };
    this.activeFrameIndex = 0;
  }

  get activeFrame() {
    return this.state.frames[this.activeFrameIndex];
  }

  get activeFrameElement() {
    return this.refs[`frame${this.activeFrameIndex}`].iframe;
  }

  /**
   * Handles switching to stereo view-mode.
   */
  onStereo() {
    console.log('Entering stereo.');

    // Manually clear transform.
    React.findDOMNode(this.refs.contentCamera).style.transform = '';

    document.body.dataset.projection = 'stereo';
    var frames = this.state.frames;
    frames[this.activeFrameIndex].viewmode = 'stereo';
    this.setState({
      frames: frames
    });
  }

  /**
   * Handles switching to mono view-mode.
   */
  onMono() {
    console.log('Entering mono.');
    document.body.dataset.projection = 'mono';
    var frames = this.state.frames;
    frames[this.activeFrameIndex].viewmode = 'mono';
    this.setState({
      frames: frames
    });
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
      url: url || Settings.start_page_url,
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
   * Sets camera transform and hmdState.
   * These values get updated frequenetly, so for now avoid setting them in this.state.
   * @param {CSSString} transform The camera transform.
   * @param {Object} hmdState The hmd state.
   */
  onHmdFrame(transform, hmdState) {
    React.findDOMNode(this.refs.camera).style.transform = transform;
    if (this.activeFrame.viewmode === 'mono') {
      React.findDOMNode(this.refs.contentCamera).style.transform = transform;
    }
    this.runtime.hmdState = hmdState;
  }

  navigate(url) {
    var frames = this.state.frames;
    frames[this.activeFrameIndex].url = url;
    this.setState({
      hudVisible: false,
      frames: frames
    });
  }

  onUrlChange(e) {
    this.setState({hudUrl: e.target.value});
  }

  onUrlSubmit(e) {
    e.preventDefault();
    this.navigate(UriHelper.read(this.state.hudUrl));
    this.urlInput.blur();
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
      hudUrl: e.detail,
      frames: frames
    });
  }

  onIconChange(frameProps, {detail}) {
    var frames = this.state.frames;
    frames[this.activeFrameIndex].icons.push(detail);
    this.setState({
      frames: frames
    });
  }

  onLoadStart() {
    var frames = this.state.frames;
    frames[this.activeFrameIndex].loading = true;
    this.setState({
      frames: frames
    });
  }

  onLoadEnd() {
    var frames = this.state.frames;
    frames[this.activeFrameIndex].loading = false;
    this.setState({
      frames: frames
    });
  }

  onMetaChange(frameProps, {detail}) {
    if (detail.name !== 'viewmode') {
      return;
    }

    var values = {};
    detail.content.split(',').forEach(def => {
      var [key, val] = def.split('=');
      values[String(key).trim()] = String(val).trim();
    });

    var {projection} = values;

    // If the meta tag is removed, we revert to the default mono viewmode.
    if (detail.type === 'removed') {
      projection = 'mono';
    }

    if (projection === 'stereo') {
      this.onStereo();
    }

    if (projection === 'mono') {
      this.onMono();
    }
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
                  key={idx}
                  ref={`frame${idx}`}
                  id={`frame${idx}`}
                  frameProps={frameProps}
                  url={frameProps.url}
                  mozbrowsericonchange={this.onIconChange.bind(this)}
                  mozbrowserlocationchange={this.onLocationChange.bind(this)}
                  mozbrowsertitlechange={this.onTitleChange.bind(this)}
                  mozbrowserloadstart={this.onLoadStart.bind(this)}
                  mozbrowserloadend={this.onLoadEnd.bind(this)}
                  mozbrowsermetachange={this.onMetaChange.bind(this)} />)
            }
            </div>
          </div>

          <div className='camera threed' ref='camera'>
            <Hud
              runtime={this.runtime}
              activeFrameProps={this.activeFrame}
              hudVisible={this.state.hudVisible}
              hudUrl={this.state.hudUrl}
              onUrlChange={this.onUrlChange.bind(this)}
              onUrlSubmit={this.onUrlSubmit.bind(this)} />
          </div>
          <Cursor
            runtime={this.runtime}
            hudVisible={this.state.hudVisible}
            activeFrameProps={this.activeFrame}
            navigate={this.navigate.bind(this)} />
        </div>
        <button
          id='entervr'
          className='btn btn--entervr'
          onClick={this.enterVR.bind(this)}
          >Enter VR</button>
      </div>;
  }
}
