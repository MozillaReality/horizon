import Frame from './frame.js';

const scrollConfig = {
  step: 50,
};

export default class FrameManager {
  constructor() {
    this.visible = false;
    this.frames = [];
    this.activeFrameIndex = null;
    this.currentId = 0;
    this.hud = $('#hud');
    this.title = $('#hud__title');
    this.nav = $('#nav');
    this.container = $('#fs-container');
    this.contentContainer = $('#container--mono');
    this.contentStereoContainer = $('#container--stereo');
    this.urlbar = $('#nav__urlbar');
    this.urlInput = this.urlbar.querySelector('input');
    this.hudIcon = $('#hud__icon');
    this.backButton = $('#nav__back');
    this.forwardButton = $('#nav__forward');
    this.windowControls = $('#window-controls');
  }

  get activeFrame() {
    return this.frames[this.activeFrameIndex];
  }

  nextId() {
    return ++this.currentId;
  }

  browserEvent(e, frame) {
    if (frame.id !== this.activeFrame.id) {
      return;
    }

    switch(e.type) {
      case 'mozbrowserlocationchange':
        this.updateHUDForNavButtons();
        /* falls through */
      case 'mozbrowsertitlechange':
        this.updateHUDForActiveFrame();
        break;
      case 'mozbrowseropenwindow':
        this.newFrame(e.detail.url);
        break;
      case 'mozbrowseropentab':
        this.newFrame(e.detail.url, false);
        break;
    }
  }

  handleEvent(e) {
    var action = e.target.dataset && e.target.dataset.action;
    if (!action) { return; }

    switch(action) {
      case 'new':
        this.newFrame();
        return;
      case 'nativeControl':
        this.nativeControl(e);
        return;
    }

    this.activeFrame['on_' + e.target.dataset.action](e);
  }

  /**
   * Handles when a native control is clicked.
   */
  nativeControl(e) {
    var type = e.target.dataset.message;
    window.dispatchEvent(new CustomEvent('mozContentEvent',
      {bubbles: true, cancelable: false, detail: {type}}));
  }

  /**
   * Opens a new browsing frame.
   */
  newFrame(location = 'http://www.mozvr.com/projects', openInForeground = true) {
    var app = new Frame({
      id: this.nextId(),
      url: location,
      container: this.contentContainer,
      browserEvent: this.browserEvent.bind(this)
    });

    // We allow tabs to be opened in the background, by not advancing the current index.
    if (openInForeground) {
      this.activeFrameIndex = this.frames.length;
    }
    this.frames.push(app);

    this.positionFrames();
  }

  /**
   * Closes the currently active frame.
   */
  closeFrame() {
    if (!this.activeFrame) { return; }

    this.activeFrame.close();

    this.frames.splice(this.activeFrameIndex, 1);
    this.activeFrameIndex = this.activeFrameIndex > 0 ? this.activeFrameIndex - 1 : 0;

    this.positionFrames();
  }

  positionFrames() {
    for (var i = 0; i < this.frames.length; i++) {
      var width = this.frames[i].element.offsetWidth;
      var x = (i - this.activeFrameIndex) * width;
      var distance = 1000;
      var rotate = 20 * (i - this.activeFrameIndex) * -1;
      this.frames[i].element.style.transform = `translateX(${x}px)
        perspective(${distance}px)
        rotateY(${rotate}deg)`;
    }
    this.updateHUDForNavButtons();
    this.updateHUDForActiveFrame();
  }

  updateHUDForActiveFrame() {
    if (this.activeFrame) {
      this.urlInput.value = this.activeFrame.title || this.activeFrame.location;
      this.updateTitle(this.activeFrame.title);
      this.hudIcon.style.backgroundImage = `url(${this.activeFrame.icon})`;
    } else {
      this.hudIcon.style.backgroundImage = '';
      this.urlInput.value = '';
    }
  }

  updateHUDForNavButtons() {
    if (!this.activeFrame || !this.activeFrame.element) {
      return;
    }

    this.getCanGoBack().then(result => {
      if (result) {
        this.backButton.removeAttribute('disabled');
      } else {
        this.backButton.setAttribute('disabled', 'true');
      }
    }).catch(console.warn.bind(console));

    this.getCanGoForward().then(result => {
      if (result) {
        this.forwardButton.removeAttribute('disabled');
      } else {
        this.forwardButton.setAttribute('disabled', 'true');
      }
    }).catch(console.warn.bind(console));
  }

  getCanGoBack() {
    return this.utils.evaluateDOMRequest(this.activeFrame.element.getCanGoBack());
  }

  getCanGoForward() {
    return this.utils.evaluateDOMRequest(this.activeFrame.element.getCanGoForward());
  }

  /**
   * Handles the focus hotkey.
   * Sets the urlbar to be the raw location instead of title.
   */
  focusUrlbar() {
    if (this.activeFrame) {
      this.urlInput.value = this.activeFrame.location;
    }
    this.urlInput.focus();
    this.urlInput.select();
  }

  /**
   * Handles change in url input field
   */
  handleChange() {
    if (this.urlInput.value.trim().length === 0) {
      this.hideHud();
    }
  }

  /**
   * Handles view mode changes for content iframes
   * Attaches iframe to appropriate container in DOM for projection.
   */
  toStereo(app) {
    app.isStereo = true;
    app.element.className = 'frame--stereo';
    this.contentStereoContainer.appendChild(app.element);
  }

  toMono(app) {
    app.isStereo = false;
    app.element.className = 'frame--mono threed';
    this.contentContainer.appendChild(app.element);
  }

  hideHud() {
    this.hud.style.opacity = 0;
    this.urlInput.blur();
    this.visible = false;
  }

  showHud() {
    this.hud.style.opacity = 1;
    this.visible = true;
    this.focusUrlbar();
  }

  updateTitle(text) {
    this.title.textContent = text;
  }

  toggleHud() {
    if (this.visible) {
      this.hideHud();
    } else {
      this.showHud();
    }
  }

  /**
   * On blur we want to return to the title of the page.
   */
  handleBlurUrlBar() {
    this.updateHUDForActiveFrame();
  }

  handleUrlEntry(e) {
    e.preventDefault();
    this.navigate(this.urlInput.value);
    this.urlInput.blur();
    this.hideHud();
  }

  prevFrame() {
    this.activeFrameIndex = (this.activeFrameIndex - 1 + this.frames.length) % this.frames.length;
    this.positionFrames();
  }

  nextFrame() {
    this.activeFrameIndex = (this.activeFrameIndex + 1) % this.frames.length;
    this.positionFrames();
  }

  navigate(url) {
    if (!this.activeFrame) {
      this.newFrame();
    }
    this.activeFrame.navigate(url);
  }

  init(runtime) {
    this.utils = runtime.utils;

    window.addEventListener('resize', this.positionFrames.bind(this));
    this.hud.addEventListener('click', this);
    this.windowControls.addEventListener('click', this);
    this.urlbar.addEventListener('submit', this.handleUrlEntry.bind(this));
    this.urlInput.addEventListener('focus', this.focusUrlbar.bind(this));
    this.urlInput.addEventListener('blur', this.handleBlurUrlBar.bind(this));
    this.urlInput.addEventListener('input', this.handleChange.bind(this));
    this.newFrame();

    window.addEventListener('stereo-viewmode', e => {
      this.toStereo(e.detail);
    });
    window.addEventListener('mono-viewmode', e => {
      this.toMono(e.detail);
    });

    runtime.gamepadInput.assign({
      input: {
        axisThreshold: 0,
        indices: {
          standard: {
            // XBox Vendor button.
            'b10': () => this.toggleHud(),
            // Use Start button too, since vendor button doesn't work on Windows:
            // See http://bugzil.la/1167457
            'b4': () => this.toggleHud(),
          }
        },
      },
    });

    runtime.keyboardInput.assign({
      'ctrl =': () => this.activeFrame.zoomIn(),
      'ctrl -': () => this.activeFrame.zoomOut(),
      'ctrl 0': () => this.activeFrame.resetZoom(),
      'f5': () => this.activeFrame.on_reload(),
      'ctrl r': () => this.activeFrame.on_reload(),
      'ctrl shift r': () => this.activeFrame.on_reload(null, true),
      'ctrl t': () => this.newFrame(),
      'ctrl w': () => this.closeFrame(),
      'ctrl l': () => this.focusUrlbar(),
      'escape': () => this.activeFrame.on_stop(),
      'backspace': () => this.activeFrame.on_back(),
      'ctrl ArrowLeft': () => this.activeFrame.on_back(),
      'ctrl ArrowRight': () => this.activeFrame.on_forward(),
      'ctrl tab': () => this.nextFrame(),
      'ctrl shift tab': () => this.prevFrame(),
      ' ': () => this.toggleHud(),
      'alt arrowup': () => {
        runtime.frameCommunicator.send('scroll.step', {
          scrollTop: -scrollConfig.step
        });
      },
      'alt arrowdown': () => {
        runtime.frameCommunicator.send('scroll.step', {
          scrollTop: scrollConfig.step
        });
      },
      'alt arrowleft': () => {
        runtime.frameCommunicator.send('scroll.step', {
          scrollLeft: -scrollConfig.step
        });
      },
      'alt arrowright': () => {
        runtime.frameCommunicator.send('scroll.step', {
          scrollLeft: scrollConfig.step
        });
      },
      'ctrl arrowup': () => {
        runtime.frameCommunicator.send('scroll.home');
      },
      'ctrl arrowdown': () => {
        runtime.frameCommunicator.send('scroll.end');
      }
    });
  }
}
