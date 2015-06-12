import Frame from './frame.js';
import neatAudio from '../../../node_modules/neat-audio/neat-audio.js';

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
    this.hud = $('#hud');
    this.title = $('#title');
    this.titleText = $('#title__text');
    this.titleIcon = $('#title__icon');
    this.directory = $('#directory');
    this.urlbar = $('#urlbar');
    this.urlInput = this.urlbar.querySelector('#urlbar__input');
    this.backfwd = $('#backfwd');
    this.backButton = $('#back');
    this.forwardButton = $('#forward');
    this.stopreload = $('#stopreload');
    this.reloadButton = $('#reload');
    this.stopButton = $('#stop');
    this.loading = $('#loading');
    this.closehudButton = $('#closehud');
    this.hudBackground = $('#background');

    // element at cursor
    this.cursorElement = null;
    this.cursor = $('#cursor');

    // Helper object for playing sound effects.
    this.sfx = {
      init: win => {
        neatAudio.init(win || window);
      },
      play: name => {
        neatAudio.playSound(this.sfx[name]);
      }
    };

    this.sfx.init();
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
      case 'mozbrowsershowmodalprompt':
        this.showModal(e);
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
   * Shows a modal dialog.
   */
  showModal(e) {
    e.preventDefault();

    var unblockUI = (detail, returnValue) => {
      if (returnValue !== undefined) {
        detail.returnValue = returnValue;
      }
      if (detail.unblock) {
        detail.unblock();
      }
    }.bind(null, e.detail);

    var controls = [];
    switch (e.detail.promptType) {
      case 'alert':
        controls.push({
          text: 'ok',
          handler: unblockUI
        });
        break;
      case 'prompt':
        // TODO
        break;
      case 'confirm':
        // TODO
    }
  }

  modalPromptHide() {

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
      container: this.viewportManager.monoContainer,
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
      var rotate = 20 * (i - this.activeFrameIndex) * -1;
      this.frames[i].element.style.transform = `translateX(${x}px) rotateY(${rotate}deg)`;
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
      var url = new URL(this.activeFrame.location);
      this.urlInput.value = url.hostname;
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
    if (this.hudVisible) {
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
   * Shows/Hides majority of the HUD elements.
   */
  showHud() {
    this.hudVisible = true;
    this.sfx.play('hudShow');
    this.container.style.animation = 'fs-container-darken 0.5s ease forwards';
    this.viewportManager.monoContainer.style.animation = 'container-pushBack 0.3s ease forwards';
    this.title.style.animation = 'show 0.1s ease forwards';
    this.directory.style.animation = 'show 0.1s ease forwards';
    this.urlbar.style.animation = 'show 0.1s ease forwards';
    this.backfwd.style.animation = 'show 0.1s ease forwards';
    this.showStopreload();
    this.closehudButton.style.animation = 'show 0.1s ease forwards';
    this.hudBackground.style.animation = 'background-fadeIn 0.3s ease forwards';
    this.cursor.style.visibility = 'visible';
  }

  hideHud(firstLoad) {
    this.hudVisible = false;
    if (!firstLoad) {
      this.sfx.play('hudHide');
    }
    this.urlInput.blur();
    this.container.style.animation = 'fs-container-lighten 0.5s ease forwards';
    this.viewportManager.monoContainer.style.animation = 'container-pullForward 0.3s ease forwards';
    this.title.style.animation = 'hide 0.1s ease forwards';
    this.directory.style.animation = 'hide 0.1s ease forwards';
    this.urlbar.style.animation = 'hide 0.1s ease forwards';
    this.backfwd.style.animation = 'hide 0.1s ease forwards';
    this.hideStopreload();
    this.closehudButton.style.animation = 'hide 0.1s ease forwards';
    this.hudBackground.style.animation = 'background-fadeOut 0.3s ease forwards';
    this.cursor.style.visibility = 'hidden';
  }

  toggleHud() {
    if (this.hudVisible) {
      this.hideHud();
    } else {
      this.showHud();
    }
  }

  /**
   * Returns a promise if the HUD is open.
   *
   * (Useful for conditionally calling functions based on HUD visibility.)
   */
  requireHudOpen() {
    if (this.hudVisible) {
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
  }

  /**
   * Show/Hide the stop-reload buttons.
   * Called by both loading events (mozbrowserloadstart and mozbrowserloadend) and user action (toggleHud).
   */
  showStopreload() {
    this.stopreload.style.animation = 'show 0.1s ease forwards';
  }

  hideStopreload() {
    // Hide stop-reload buttons only if activeFrame is not currently loading.
    // This ensures the stop button stays visible during loading.
    if (!this.isLoading) {
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

    // When loading starts, show the stop button.
    this.stopButton.style.display = 'inline';
  }

  hideLoadingIndicator() {
    this.hideStopreload();
    this.loading.style.animation = 'hide 0.1s ease forwards';

    // When loading ends, hide the stop button to reveal the underlying reload button.
    this.stopButton.style.display = 'none';
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


  /**
   * Cursor
   */
  intersectCursor() {
    // the Y value needs to be set to half offsetHeight of cursor element.
    var el = document.elementFromPoint(0, 10);
    if (el !== this.cursorElement) {
      this.cursorElement = el;
    }
  }

  cursorClick() {
    var mouseEvent = document.createEvent('MouseEvents');
    mouseEvent.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    this.cursorElement.dispatchEvent(mouseEvent);
  }

  init(runtime) {
    this.utils = runtime.utils;
    this.viewportManager = runtime.viewportManager;

    // Preload the sound effects so we can play them later.
    Promise.all([
      neatAudio.fetchSound(runtime.settings.www_hud_hide_src),
      neatAudio.fetchSound(runtime.settings.www_hud_show_src)
    ]).then(sounds => {
      this.sfx.hudHide = sounds[0];
      this.sfx.hudShow = sounds[1];
    }, err => {
      console.error('Could not fetch sound:', err.stack);
    });

    // Creates listeners for HUD element states and positions.
    window.addEventListener('resize', this.positionFrames.bind(this));
    this.hud.addEventListener('click', this);
    this.urlbar.addEventListener('submit', this.handleUrlEntry.bind(this));
    this.urlInput.addEventListener('focus', this.focusUrlbar.bind(this));
    this.urlInput.addEventListener('blur', this.handleBlurUrlBar.bind(this));
    this.closehudButton.addEventListener('click', this.hideHud.bind(this));

    // Creates initial frame.
    this.newFrame();

    // Hides the HUD and loading indicators on first load.
    this.hideHud(true);
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

            'b11': () => this.cursorClick(),
          }
        },
      },
      scroll: {
        axisThreshold: 0.15,
        smoothingFactor: 0.4,
        velocityThreshold: 0.05
      }
    });

    setInterval(this.intersectCursor.bind(this), 100);

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
      'c': () => this.requireHudOpen().then(() => this.cursorClick()),
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

    if (runtime.settings.play_audio_on_browser_start) {
      neatAudio.fetchSound(runtime.settings.www_browser_start_src).then(sound => {
        this.sfx.browserStart = sound;

        // Sound chime when browser has (re)started.
        this.sfx.play('browserStart');
      });
    }
  }
}
