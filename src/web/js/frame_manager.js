import Frame from './frame.js';

const scrollConfig = {
  step: 50,
};

export default class FrameManager {
  constructor() {

    // Variables for managing frames.
    this.frames = [];
    this.activeFrameIndex = null;
    this.currentId = 0;

    // Variables for frame and HUD elements.
    this.hudVisible = false;
    this.isLoading = false;
    this.container = $('#fs-container');
    this.contentContainer = $('#container--mono');
    this.contentStereoContainer = $('#container--stereo');
    this.hud = $('#hud');
    this.title = $('#title');
    this.titleText = $('#title__text');
    this.titleIcon = $('#title__icon');
    this.directory = $('#directory');
    this.urlbar = $('#urlbar');
    this.urlInput = this.urlbar.querySelector('input');
    this.nav = $('#nav');
    this.backfwd = $('#backfwd');
    this.backButton = $('#backfwd__back');
    this.forwardButton = $('#backfwd__forward');
    this.stopreload = $('#stopreload');
    this.reloadButton = $('#stopreload--reload');
    this.stopButton = $('#stopreload--stop');
    this.loading = $('#loading');
    this.closehudButton = $('#closehud');
    this.resetsensorButton = $('#resetsensor');
    this.hudBackground = $('#background');

    // Variables for sound effects.
    this.sfxHudHide = $('#hud_hide');
    this.sfxHudShow = $('#hud_show');
  }


  /**
   * Manages events for the active frame.
   */
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
      case 'mozbrowserloadend':
        this.isLoading = false;
        this.hideLoadingIndicator();
        break;
      case 'mozbrowserloadstart':
        this.isLoading = true;
        this.showLoadingIndicator();
        break;
    }
  }


  /**
   * Manages events for native controls.
   */
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
      case 'forward':
      case 'back':
      case 'reload':
        // On back, forward or reload, hide the Hud and trigger the selected action on the active frame.
        this.toggleHud();
        this.activeFrame['on_' + e.target.dataset.action](e);
        return
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
   * Creates a new browsing frame.
   */
  newFrame(location = 'http://mozvr.com/posts/quick-vr-prototypes/', openInForeground = true) {
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
   * Gets the activeFrame.
   */
  get activeFrame() {
    return this.frames[this.activeFrameIndex];
  }

  /**
   * Returns the next ID.
   */
  nextId() {
    return ++this.currentId;
  }

  /**
   * Handles browsing through and re-positioning open frames.
   */
  prevFrame() {
    this.activeFrameIndex = (this.activeFrameIndex - 1 + this.frames.length) % this.frames.length;
    this.positionFrames();
  }

  nextFrame() {
    this.activeFrameIndex = (this.activeFrameIndex + 1) % this.frames.length;
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

  /**
   * Closes the currently active frame.
   */
  closeFrame() {
    if (!this.activeFrame) { return; }

    this.activeFrame.close();

    this.frames.splice(this.activeFrameIndex, 1); // Remove the active frame from the stack.
    this.activeFrameIndex = Math.max(this.activeFrameIndex - 1, 0);

    this.positionFrames();
  }


  /**
   * Updates HUD elements to match active frame (or sets them empty if there is no active frame).
   */
  updateHUDForActiveFrame() {
    if (this.activeFrame) {
      this.urlInput.value = this.activeFrame.title || this.activeFrame.location;
      this.updateTitle(this.activeFrame.title);
      this.titleIcon.style.backgroundImage = `url(${this.activeFrame.icon})`;
    } else {
      this.titleIcon.style.backgroundImage = '';
      this.urlInput.value = '';
    }
  }

  /**
   * Toggles navigation UI depending on history states of the active frame.
   */
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
   * Handles change in url input field.
   */
  handleChange() {
    if (this.urlInput.value.trim().length === 0) {
      this.hideHud();
    }
  }

  /**
   * Updates title text.
   */
  updateTitle(text) {
    this.titleText.textContent = text;
  }

  /**
   * On blur returns to the title of the page.
   */
  handleBlurUrlBar() {
    this.updateHUDForActiveFrame();
  }

  /**
   * Handles backspace. If HUD is open, close HUD. Else, trigger back action in active frame.
   */
  backspace() {
    if(this.hudVisible) {
      this.hideHud();
    } else {
      this.activeFrame.on_back();
    }
  }


  /**
   * Handles loading new URLs into active frame.
   */
  handleLinkClick(e) {
    e.preventDefault();
    this.navigate(e.target.href);
    this.hideHud();
  }

  handleUrlEntry(e) {
    e.preventDefault();
    this.navigate(this.urlInput.value);
    this.urlInput.blur();
    this.hideHud();
  }

  navigate(url) {
    if (!this.activeFrame) {
      this.newFrame();
    }
    this.activeFrame.navigate(url);
  }


  /**
   * Handles view mode changes for content iframes.
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


  /**
   * Shows/Hides majority of the HUD elements.
   */
  showHud() {
    this.hudVisible = true;
    this.focusUrlbar();
    this.sfxHudShow.play();
    this.container.style.animation = 'fs-container-darken 0.5s ease forwards';
    this.contentContainer.style.animation = 'container-pushBack 0.3s ease forwards';
    this.title.style.animation = 'show 0.1s ease forwards';
    this.directory.style.animation = 'show 0.1s ease forwards';
    this.urlbar.style.animation = 'show 0.1s ease forwards';
    this.backfwd.style.animation = 'show 0.1s ease forwards';
    this.showStopreload();
    this.closehudButton.style.animation = 'show 0.1s ease forwards';
    this.resetsensorButton.style.animation = 'show 0.1s ease forwards';
    this.hudBackground.style.animation = 'background-fadeIn 0.3s ease forwards';
  }

  hideHud() {
    this.hudVisible = false;
    this.urlInput.blur();
    this.sfxHudHide.play();
    this.container.style.animation = 'fs-container-lighten 0.5s ease forwards';
    this.contentContainer.style.animation = 'container-pullForward 0.3s ease forwards';
    this.title.style.animation = 'hide 0.1s ease forwards';
    this.directory.style.animation = 'hide 0.1s ease forwards';
    this.urlbar.style.animation = 'hide 0.1s ease forwards';
    this.backfwd.style.animation = 'hide 0.1s ease forwards';
    this.hideStopreload();
    this.closehudButton.style.animation = 'hide 0.1s ease forwards';
    this.resetsensorButton.style.animation = 'hide 0.1s ease forwards';
    this.hudBackground.style.animation = 'background-fadeOut 0.3s ease forwards';
  }

  toggleHud() {
    if (this.hudVisible) {
      this.hideHud();
    } else {
      this.showHud();
    }
  }


  /**
   * Show/Hide the stop-reload buttons.
   * Called by both loading events (mozbrowserloadstart and mozbrowserloadend) and user action (toggleHud).
   */
  showStopreload(){
    this.stopreload.style.animation = 'show 0.1s ease forwards';
  }

  hideStopreload(){
    if(!this.isLoading){ // Only hide if activeFrame is not currently loading. This ensures the stop button stays visible during loading.
      this.stopreload.style.animation = 'hide 0.1s ease forwards';
    }
  }


  /**
   * Show/Hide loading indicators.
   * Called by mozbrowserloadstart and mozbrowserloadend events.
   */
  showLoadingIndicator() {
    this.showStopreload();
    this.loading.style.animation = 'show 0.1s ease forwards';
    this.stopButton.style.display = 'inline'; // When loading starts, show the stop button.
  }

  hideLoadingIndicator() {
    this.hideStopreload();
    this.loading.style.animation = 'hide 0.1s ease forwards';
    this.stopButton.style.display = 'none'; // When loading ends, hide the stop button to reveal the underlying reload button.
  }


  /**
   * Populate the directory using the loaded JSON.
   */
  buildDirectory(data) {
    data.sites.forEach(site => {
      var tile = document.createElement('a');
      tile.className = 'directory__tile';
      tile.setAttribute('href', site.url);
      tile.innerHTML = site.name;
      tile.addEventListener('click', this.handleLinkClick.bind(this), false);
      var type = document.createElement('span');
      type.className = 'type';
      type.innerHTML = site.type;
      tile.appendChild(type);
      this.directory.appendChild(tile);
    });
  }

  init(runtime) {
    this.utils = runtime.utils;
    this.viewportManager = runtime.viewportManager;

    // Creates listeners for HUD element states and positions.
    window.addEventListener('resize', this.positionFrames.bind(this));
    this.hud.addEventListener('click', this);
    this.urlbar.addEventListener('submit', this.handleUrlEntry.bind(this));
    this.urlInput.addEventListener('focus', this.focusUrlbar.bind(this));
    this.urlInput.addEventListener('blur', this.handleBlurUrlBar.bind(this));
    this.urlInput.addEventListener('input', this.handleChange.bind(this));
    this.closehudButton.addEventListener('click', this.hideHud.bind(this));
    this.resetsensorButton.addEventListener('click', this.viewportManager.resetSensor.bind(this));

    // Creates initial frame.
    this.newFrame();

    // Handles moving between stereo and mono view modes.
    window.addEventListener('stereo-viewmode', e => {
      this.toStereo(e.detail);
    });
    window.addEventListener('mono-viewmode', e => {
      this.toMono(e.detail);
    });

    // Hides the HUD and loading indicators on first load.
    this.hideHud();
    this.hideLoadingIndicator();

    /**
     * Loads JSON for Directory.
     */
    fetch(runtime.settings.www_directory_src)
    .then(response => {
      return response.json();
    })
    .then(data => {
      this.buildDirectory(data);
    });

    runtime.gamepadInput.assign({
      input: {
        axisThreshold: 0,
        indices: {
          standard: {
            // XBox Vendor button.
            'b10': () => this.toggleHud(),

            // Use Start button too, since vendor button doesn't work on Windows:
            // See http://bugzil.la/1167457.
            'b4': () => this.toggleHud(),

            // Horizontal scrolling.
            'a0': (gamepad, axis, value) => runtime.gamepadInput.scroll.scrollX(axis, value),

            // Vertical scrolling.
            'a1': (gamepad, axis, value) => runtime.gamepadInput.scroll.scrollY(axis, value),
          }
        },
      },
      scroll: {
        axisThreshold: 0.15,
        smoothingFactor: 0.4,
        velocityThreshold: 0.05
      }
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
      'ctrl ArrowLeft': () => this.activeFrame.on_back(),
      'ctrl ArrowRight': () => this.activeFrame.on_forward(),
      'ctrl tab': () => this.nextFrame(),
      'ctrl shift tab': () => this.prevFrame(),
      'backspace': () => this.backspace(),
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
      },
    });
  }
}
