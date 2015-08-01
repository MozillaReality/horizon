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
import Utils from './../lib/utils.js';
import UrlUtil from '../../../../node_modules/urlutil.js/src/urlutil.js';
import cx from './../lib/class_set.js';

export default class Browser extends React.Component {

  constructor(props) {
    super(props);

    var runtime = props.runtime;
    runtime.utils = new Utils();
    runtime.contentScripts = new ContentScripts();
    runtime.debugging = new Debugging();
    runtime.frameCommunicator = new FrameCommunicator('browser', {
      getActiveFrameElement: () => this.activeFrameRef.iframe
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

  get activeFrameRef() {
    return this.refs[`frame${this.activeFrameIndex}`];
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

  /**
   * Toggles the current state of the hud.
   * @param {Boolean} [force] When true opens the hud, when false closes the hud. If not used, normal toggle behavior ensues.
   */
  toggleHud(force) {
    // Steal focus from whichever element is currently focussed.
    // Do not blur the current element if force is set and there's nothing to do.
    var el = document.activeElement;
    if (el && force !== undefined) {
      el.blur();
    }

    this.setState({
      hudVisible: force !== undefined ? force : !this.state.hudVisible
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
    if (UrlUtil.isNotURL(url)) {
      url = Settings.search_url.replace('{q}', encodeURIComponent(url));
    }

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
    this.navigate(this.state.hudUrl);
    this.refs.hud.urlInput.blur();
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
    this.updateNavigationState();
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

  onBack() {
    if (this.activeFrame.canGoBack) {
      this.activeFrameRef.onBack();
      this.setState({
        hudVisible: false
      });
    }
  }

  onForward() {
    if (this.activeFrame.canGoForward) {
      this.activeFrameRef.onForward();
      this.setState({
        hudVisible: false
      });
    }
  }

  onReload() {
    this.activeFrameRef.onReload();
    this.setState({
      hudVisible: false
    });
  }

  onStop() {
    this.activeFrameRef.onStop();
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

  updateNavigationState() {
    var frames = this.state.frames;

    var canGoBack = this.runtime.utils.evaluateDOMRequest(this.activeFrameRef.iframe.getCanGoBack());
    canGoBack.then(result => {
      frames[this.activeFrameIndex].canGoBack = result;
    });

    var canGoForward = this.runtime.utils.evaluateDOMRequest(this.activeFrameRef.iframe.getCanGoForward());
    canGoForward.then(result => {
      frames[this.activeFrameIndex].canGoForward = result;
    });

    return Promise.all([canGoBack, canGoForward]).then(() => {
      this.setState({
        frames: frames
      });
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
              ref='hud'
              runtime={this.runtime}
              activeFrameProps={this.activeFrame}
              hudVisible={this.state.hudVisible}
              hudUrl={this.state.hudUrl}
              onUrlChange={this.onUrlChange.bind(this)}
              onUrlSubmit={this.onUrlSubmit.bind(this)}
              onBack={this.onBack.bind(this)}
              onForward={this.onForward.bind(this)}
              toggleHud={this.toggleHud.bind(this)} />

            <div id='stopreload' className='stopreload threed'>
              <button
                className={cx({
                  'fa fa-repeat nav reload': true,
                  hidden: this.activeFrame.loading || !this.state.hudVisible
                })}
                onClick={this.onReload.bind(this)}
                data-action='reload' id='reload'></button>
              <button
                className={cx({
                  'fa fa-times nav stop': true,
                  hidden: !this.activeFrame.loading
                })}
                onClick={this.onStop.bind(this)}
                data-action='stop' id='stop'></button>
            </div>

            <div id='loading'
              className={cx({
                visible: this.activeFrame.loading,
                'loading threed': true
              })}>LOADING</div>
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
