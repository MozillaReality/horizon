import React from 'react';
import ReactDOM from 'react-dom';
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
import Devtools from '../devtools.js';
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
    runtime.devtools = new Devtools();
    runtime.frameCommunicator = new FrameCommunicator('browser', {
      getActiveFrameElement: () => this.activeFrameRef.iframe
    });
    runtime.gamepadInput = new GamepadInput({
      input: {
        axisThreshold: 0
      },
      scroll: {
        axisThreshold: 0.15,
        smoothingFactor: 0.4,
        velocityThreshold: 0.05
      }
    });
    runtime.keyboardInput = new KeyboardInput();
    runtime.viewportManager = new ViewportManager({
      onHmdFrame: this.onHmdFrame.bind(this),
      enterBrowserVR: this.enterVR.bind(this)
    });
    runtime.settings = Settings;

    runtime.contentScripts.init(runtime);
    runtime.debugging.init(runtime);
    runtime.devtools.init(runtime);
    runtime.frameCommunicator.init(runtime);
    runtime.gamepadInput.init(runtime);
    runtime.keyboardInput.init(runtime);
    runtime.viewportManager.init(runtime);
    this.runtime = runtime;

    runtime.gamepadInput.assignIndices({
      'standard': {
        // XBox Vendor button.
        'b10': () => this.toggleHud(),

        // Use Start button too, since Vendor button doesn't work on
        // Windows: http://bugzil.la/1167457
        'b4': () => this.toggleHud(),

        // Use the Back button to reset sensor.
        'b5': () => runtime.viewportManager.resetSensor(),

        // Left analogue stick for horizontal scrolling.
        'a0': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
          runtime.gamepadInput.scroll.scrollX(axis, value)
        ),

        // Left analogue stick for vertical scrolling.
        'a1': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
          runtime.gamepadInput.scroll.scrollY(axis, value)
        ),

        // Use the "X" button to navigate back.
        'b13': () => this.activeFrameRef.onBack(),

        // Use the "B" button to navigate forward.
        'b12': () => this.activeFrameRef.onForward(),
      },
      '54c-268-PLAYSTATION(R)3 Controller': {
        // Vendor.
        'b16': () => this.toggleHud(),

        // Start.
        'b3': () => this.toggleHud(),

        // Select.
        'b0': () => runtime.viewportManager.resetSensor(),

        // Left analogue stick.
        'a0': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
          runtime.gamepadInput.scroll.scrollX(axis, value)
        ),
        'a1': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
          runtime.gamepadInput.scroll.scrollY(axis, value)
        ),

        // ☐ to navigate backward.
        'b15': () => this.activeFrameRef.onBack(),

        // ◯ to navigate forward.
        'b13': () => this.activeFrameRef.onForward(),
      },
      // XBOX Wired controller (Windows)
      'xinput': {
        'b9': () => this.toggleHud(),
        'b8': () => runtime.viewportManager.resetSensor(),
        'a0': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
          runtime.gamepadInput.scroll.scrollX(axis, value)
        ),
        'a1': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
          runtime.gamepadInput.scroll.scrollY(axis, value)
        ),
        'b2': () => this.activeFrameRef.onBack(),
        'b1': () => this.activeFrameRef.onForward(),
      }
    });

    runtime.keyboardInput.assign({
      ' ': () => this.toggleHud(),
      'ctrl =': () => this.onZoomIn(),
      'ctrl -': () => this.onZoomOut(),
      'ctrl 0': () => this.onResetZoom(),
      'f5': () => this.activeFrameRef.onReload(),
      'ctrl r': () => this.activeFrameRef.onReload(),
      'ctrl shift r': () => this.activeFrameRef.onReload(true),
      // TODO: Coming soon to a Horizon near you (issue #262).
      // 'ctrl t': () => this.newFrame(),
      // 'ctrl w': () => this.onClose(),
      // 'ctrl tab': () => this.nextFrame(),
      // 'ctrl shift tab': () => this.prevFrame(),
      'ctrl l': () => this.focusUrlInput(true),
      'escape': () => this.onStop(),
      'ctrl ArrowLeft': () => this.onBack(),
      'ctrl ArrowRight': () => this.onForward(),
      'backspace': () => this.onBackspace(),
      'c.down': () => this.allowCursor().then(this.cursorMouseDown.bind(this)),
      'c.up': () => this.allowCursor().then(this.cursorMouseUp.bind(this)),
      'alt arrowup': () => this.onScrollUp(),
      'alt arrowdown': () => this.onScrollDown(),
      'alt arrowleft': () => this.onScrollUp(),
      'alt arrowright': () => this.onScrollDown(),
      'ctrl arrowup': () => this.onScrollHome(),
      'ctrl arrowdown': () => this.onScrollEnd(),
    });

    this.state = {
      hudVisible: false,
      hudUrl: null,
      frames: [
        {
          viewmode: 'mono',
          url: Settings.startPageUrl,
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
   * Returns a promise if the active frame is mono.
   *
   * @returns {Promise} Resolved if frame is mono; rejected if HUD is stereo.
   */
  requireMonoFrameOpen() {
    if (this.activeFrame.viewmode === 'mono') {
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
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

  /**
   * Handles the focus hotkey.
   */
  focusUrlInput(force = false) {
    if (force && !this.state.hudVisible) {
      this.toggleHud();
    }

    this.refs.hud.urlInput.focus();
    this.refs.hud.urlInput.select();
  }

  newFrame(url) {
    var frames = this.state.frames;
    this.activeFrameIndex = frames.length;
    frames.push({
      url: url || Settings.startPageUrl,
      icons: []
    });
    this.setState({frames: frames});
  }

  /**
   * Enters VR mode.
   */
  enterVR() {
    this.runtime.viewportManager.enterVr(ReactDOM.findDOMNode(this.refs.fullscreenContainer));
  }

  /**
   * Sets camera transform and hmdState.
   * These values get updated frequenetly, so for now avoid setting them in this.state.
   * @param {CSSString} transform The camera transform.
   * @param {Object} hmdState The hmd state.
   */
  onHmdFrame(transform, hmdState) {
    this.runtime.hmdState = hmdState;
  }

  navigate(url) {
    if (UrlUtil.isNotURL(url)) {
      url = Settings.searchUrl.replace('{q}', encodeURIComponent(url));
    } else {
      url = UrlUtil.getUrlFromInput(url);
    }

    var frames = this.state.frames;
    frames[this.activeFrameIndex].url = url;
    this.setState({
      hudVisible: false,
      frames: frames
    });
  }

  onUrlSubmit(url) {
    this.navigate(url);
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

  onZoomIn() {
    this.activeFrameRef.onZoomIn();
  }

  onZoomOut() {
    this.activeFrameRef.onZoomOut();
  }

  onResetZoom() {
    this.activeFrameRef.onResetZoom();
  }

  /**
   * Handles backspace.
   *
   * If HUD is open, close HUD.
   * Else, trigger back action in active frame.
   */
  onBackspace() {
    if (this.state.hudVisible) {
      this.hideHud();
    } else {
      this.onBack();
    }
  }

  onScrollUp(step = Settings.scrollStep) {
    this.runtime.frameCommunicator.send('scroll.step', {
      scrollTop: -step
    });
  }

  onScrollDown(step = Settings.scrollStep) {
    this.runtime.frameCommunicator.send('scroll.step', {
      scrollTop: step
    });
  }

  onScrollHome() {
    this.runtime.frameCommunicator.send('scroll.home');
  }

  onScrollEnd() {
    this.runtime.frameCommunicator.send('scroll.end');
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

    var canGoBack = false;
    var canGoForward = false;

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

          <div id='content-container'
            className={cx({
              'content-container': true,
              [`frame--${this.activeFrame.viewmode}`]: true
            })}
            ref='frameWrapper'>
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

          <Hud
            ref='hud'
            runtime={this.runtime}
            activeFrameProps={this.activeFrame}
            hudVisible={this.state.hudVisible}
            hudUrl={this.state.hudUrl}
            onUrlSubmit={this.onUrlSubmit.bind(this)}
            onBack={this.onBack.bind(this)}
            onForward={this.onForward.bind(this)} />

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
