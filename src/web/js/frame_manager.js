import vec4 from '../../../node_modules/gl-vec4';

import Matrix from './lib/matrix.js';

var matrix = new Matrix();

const scrollConfig = {
  step: 50,
};

const mouseConfig = {
  activeClassName: 'active',
  hoverClassName: 'hover',
  focusClassName: 'focus',
  formSubmitThreshold: 1500,  // Time to wait for mousedown (buttondown) before triggering a form submit.
};

export default class FrameManager {
  constructor() {
    this.activeFrameIndex = null;
    this.currentId = 0;

    // Variables for frame and HUD elements.
    this.hudVisible = false;
    this.isLoading = false;

    // Element at cursor.
    this.cursorElement = null;
    this.cursorMouseLeaveQueue = [];
  }


  /**
   * Manages events for the active frame (called from `Frame.handleEvent` method).
   *
   * @param {Event} e A `mozbrowser*` event.
   * @param {Object} frame A `Frame` instance (should be the active frame's).
   */
  browserEvent(e, frame) {
    if (frame.id !== this.activeFrame.id) {
      return;
    }

    switch (e.type) {
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
   * Manages events for native controls (for clicking on HUD elements).
   *
   * @param {Event} e A `click` event.
   */
  handleEvent(e) {
    var action = e.target.dataset && e.target.dataset.action;
    if (!action) { return; }

    switch (action) {
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
   * Shows a modal dialog (called from `browserEvent` method).
   *
   * @param {Event} e A `mozbrowsershowmodalprompt` event.
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
   *
   * @param {Event} e The custom event triggered from the window controls.
   */
  nativeControl(e) {
    var type = e.target.dataset.message;
    window.dispatchEvent(new CustomEvent('mozContentEvent',
      {bubbles: true, cancelable: false, detail: {type}}));
  }

  /**
   * Creates a new browsing frame.
   *
   * @returns {Object} App
   */
  newFrame(location = 'http://mozvr.com/posts/quick-vr-prototypes/', openInForeground = true) {
    var app = new window.Frame({
      id: this.nextId(),
      url: location,
      container: this.viewportManager.contentContainer,
      browserEvent: this.browserEvent.bind(this)
    });

    // We allow tabs to be opened in the background, by not advancing the current index.
    if (openInForeground) {
      this.activeFrameIndex = this.frames.length;
    }
    this.frames.push(app);

    this.positionFrames();

    return app;
  }

  /**
   * Gets the activeFrame.
   *
   * @returns {Object} The active `Frame` instance.
   */
  get activeFrame() {
    return this.frames[this.activeFrameIndex];
  }

  /**
   * Returns the next ID.
   *
   * @returns {Number} The next frame (tab) number.
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
    } else {
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
   *
   * @param {String} text Title of page loaded in the active frame.
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
   *
   * @param {Event} e A 'click' event (delegated on document).
   */
  handleLinkClick(e) {
    var a = this.utils.getHijackableAnchor(e);
    if (a) {
      e.preventDefault();
      e.stopPropagation();

      this.navigate(a.href);
      this.hideHud();
    }
  }

  navigate(url) {
    if (!this.activeFrame) {
      this.newFrame();
    }
    this.activeFrame.navigate(url);
  }

  /**
   * Returns a promise if the HUD is open.
   *
   * (Useful for conditionally calling functions based on HUD visibility.)
   *
   * @returns {Promise} Resolved if HUD is opened; rejected if HUD is closed.
   */
  requireHudOpen() {
    if (this.hudVisible) {
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
  }

  /**
   * Returns a promise if the active frame is mono.
   *
   * @returns {Promise} Resolved if frame is mono; rejected if HUD is stereo.
   */
  requireMonoFrameOpen() {
    if (!this.activeFrame.isStereo) {
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
  }

  /**
   * Returns a promise if the active frame is stereo.
   *
   * @returns {Promise} Resolved if frame is stereo; rejected if HUD is mono.
   */
  requireStereoFrameOpen() {
    if (this.activeFrame.isStereo) {
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
  }


  /**
   * Allow cursor to be active only when HUD is visible or displaying mono content.
   *
   * @returns {Promise} Resolve if cursor can be active.
   */
  allowCursor() {
    if (this.hudVisible || !this.activeFrame.isStereo) {
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
   * Cursor
   */
  handleCursorTransition() {
    this.cursorElement.transitioned = true;
  }

  intersectCursor() {
    setTimeout(() => {
      var el = document.elementFromPoint(0, 0);
      if (el !== this.cursorElement || this.cursorElement.transitioned) {
        this.cursorMouseLeave(el);
        this.cursorElement = el;

        // flag elements to have translations re-computed on animation and transition events.
        if (!this.cursorElement.transitioned) {
          this.cursorElement.addEventListener('transitionend', this.handleCursorTransition.bind(this));
          this.cursorElement.addEventListener('animationend', this.handleCursorTransition.bind(this));
        } else {
          this.cursorElement.removeEventListener('transitionend', this.handleCursorTransition.bind(this));
          this.cursorElement.removeEventListener('animationend', this.handleCursorTransition.bind(this));
          delete this.cursorElement.transitioned;
        }

        this.cursorElementTranslation = this.getElementTranslation(el);
        this.cursorMouseEnter();
      }

      requestAnimationFrame(this.intersectCursor.bind(this));
    }, 100); // Checking for element at every RAF is unecessary, so we set a interval at a much lower frequency.
  }

  cursorMouseLeave(newEl) {
    let prevEl = this.cursorElement;

    if (prevEl) {
      prevEl.mock = true;

      this.cursorDownElement = null;

      // Mark a leave only if `previousEl` isn't a child of `el`.
      if (prevEl.contains(newEl)) {
        // The new element is still a parent of the new element, so emit the 'mouseleave' event later.
        this.cursorMouseLeaveQueue.push(prevEl);
      } else {
        // Clear the queue of elements we are no longer focussed on.
        while (this.cursorMouseLeaveQueue.length) {
          this.utils.emitMouseEvent('mouseleave', this.cursorMouseLeaveQueue.pop());
        }

        this.utils.emitMouseEvent('mouseleave', prevEl);
      }
    }

    return Promise.resolve();
  }

  cursorMouseEnter() {
    let el = this.cursorElement;

    if (el) {
      el.mock = true;

      this.utils.emitMouseEvent('mouseenter', el);
    }

    return Promise.resolve();
  }

  cursorMouseDown() {
    let el = this.cursorElement;

    if (el) {
      this.cursorDownElement = el;

      el.mock = true;
      this.utils.emitMouseEvent('mousedown', el);
      if (document.activeElement) {
        document.activeElement.blur();
      }
      el.focus();

      this.mouseIntoIframe('mousedown');

      this.utils.sleep(mouseConfig.formSubmitThreshold).then(() => {
        // If the click button has been depressed for a long time, assume a form submission.
        if (el === this.cursorDownElement) {
          // Check if the active element is in a form element.
          let form = this.utils.getFocusedForm(el);
          if (form) {
            // If so, submit the form.
            form.submit();
            form.dispatchEvent(new Event('submit'));
          }
        }
      });
    }

    return Promise.resolve();
  }


  /**
   * Traverse up tree to find containing element with matrix3d transform.
   *
   * @param {Element} el Element
   * @returns {Array} Array of matrix3d values.
   */
  getNearest3dTransform(el) {
    if (!el) {
      return false;
    }
    let transform = window.getComputedStyle(el).transform;
    if (transform.indexOf('matrix3d') === -1) {
      return this.getNearest3dTransform(el.parentElement);
    } else {
      return transform;
    }
  }


  /**
   * Return 3d translation of element.
   *
   * @param {Element} el Element
   * @returns { {x:Number, y:Number, z:Number} } Translation
   */
  getElementTranslation(el) {
    if (!el) {
      return false;
    }

    let transform = this.getNearest3dTransform(el);
    if (!transform) {
      return false;
    }

    let cssMatrix = matrix.matrixFromCss(transform);
    return {
      x: -(cssMatrix[12] * this.viewportManager.monoScale), // multiply by mono container scale
      y: cssMatrix[13] * this.viewportManager.monoScale,
      z: -cssMatrix[14]
    };
  }


  /**
   * Return direction from VR headset quaternion.   Use -Z as forward.
   *
   * @returns {Object} Direction
   * @returns { {x:Number, y:Number, z:Number} } Direction
   */
  getDirection() {
    let hmd = this.viewportManager.hmdState;
    if (!hmd || !hmd.orientation) {
      return false;
    }

    // Transform the HMD quaternion by direction vector.
    let direction = vec4.transformQuat([], [0, 0, -1, 0],
      [hmd.orientation.x, hmd.orientation.y, hmd.orientation.z, hmd.orientation.w]);

    return {
      x: -direction[0],
      y: -direction[1],
      z: direction[2]
    };
  }

  /**
   * Return position offset from VR headset.
   *
   * @returns {Object} Position
   * @returns { {x:Number, y:Number, z:Number} } Position
   */
  getPosition() {
    let hmd = this.viewportManager.hmdState;
    if (!hmd) {
      return false;
    }

    let scale = this.settings.pixels_per_meter * this.settings.hmd_scale;
    if (hmd.position) {
      return {
        x: -hmd.position.x * scale,
        y: -hmd.position.y * scale,
        z: -hmd.position.z * scale
      };
    } else {
      return {x: 0, y: 0, z: 0};
    }
  }

  /**
   * Position the cursor at the same depth as the mono iframe container.
   * Otherwise, use the depth set on cursor element.
   */
  positionCursor() {
    let translation = this.cursorElementTranslation;
    let direction = this.getDirection();
    let position = this.getPosition();

    if (translation && direction && position) {
      // Find intersection on plane.
      let distance = translation.z + position.z;
      let intersectionX = distance / direction.z * direction.x + position.x + translation.x;
      let intersectionY = -(distance / direction.z * direction.y + position.y + translation.y);
      // Use pythagoras to find depth at intersection.
      let intersectionZx = Math.sqrt(Math.pow(distance / direction.z * direction.x, 2) + Math.pow(distance, 2));
      let intersectionZy = Math.sqrt(Math.pow(distance / direction.z * direction.y, 2) + Math.pow(distance, 2));
      let intersectionZ = Math.max(intersectionZx, intersectionZy) - 10; // bias cursor depth to avoid z-fighting.
      this.intersectionX = intersectionX;
      this.intersectionY = intersectionY;

      this.cursor.classList.add('is-visible');
      this.cursor.style.transform = `translate3d(0, 0, -${intersectionZ}px)`;
    } else {
      this.cursor.classList.remove('is-visible');
      this.cursor.style.transform = '';
    }

    requestAnimationFrame(this.positionCursor.bind(this));
  }

  mouseIntoIframe(eventName) {
    if (this.cursorElement !== this.viewportManager.contentContainer) {
      return;
    }
    this.frameCommunicator.send('mouse.' + eventName, {
      top: this.intersectionY / this.viewportManager.monoScale,
      left: this.intersectionX / this.viewportManager.monoScale
    });
  }

  cursorMouseUp() {
    let el = this.cursorElement;

    if (el) {
      this.cursorDownElement = null;

      this.utils.emitMouseEvent('mouseup', el);
      this.utils.emitMouseEvent('click', el);

      this.mouseIntoIframe('mouseup');
    }

    return Promise.resolve();
  }

  handleMouseLeave(e) {
    var el = e.target;
    if (el && el.mock) {
      // Blur and remove hover/active classes from the element we were previously focussed on/cursored over.
      el.classList.remove(mouseConfig.hoverClassName, mouseConfig.activeClassName, mouseConfig.focusClassName);
    }
  }

  handleMouseEnter(e) {
    var el = e.target;
    if (el && el.mock) {
      el.classList.add(mouseConfig.hoverClassName);
    }
  }

  handleMouseDown(e) {
    var el = e.target;
    if (el && el.mock) {
      el.classList.remove(mouseConfig.hoverClassName);
      el.classList.add(mouseConfig.activeClassName, mouseConfig.focusClassName);
    }
  }

  handleMouseUp(e) {
    var el = e.target;
    if (el && el.mock) {
      el.classList.remove(mouseConfig.hoverClassName, mouseConfig.activeClassName, mouseConfig.focusClassName);
    }
  }

  init(runtime) {
    console.log('Initializing frame manager.');
    this.frameCommunicator = runtime.frameCommunicator;
    this.settings = runtime.settings;
    this.utils = runtime.utils;
    this.viewportManager = runtime.viewportManager;

    // Creates listeners for HUD element states and positions.
    window.addEventListener('resize', this.positionFrames.bind(this));
    document.addEventListener('click', this.handleLinkClick.bind(this));
    /*
    this.urlInput.addEventListener('focus', this.focusUrlbar.bind(this));
    this.urlInput.addEventListener('blur', this.handleBlurUrlBar.bind(this));
    this.closehudButton.addEventListener('click', this.hideHud.bind(this));
    */

    // Listeners for mimicked mouse events from gaze-based cursor.
    window.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    window.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Creates initial iframe and start in mono mode.
    var app = this.newFrame();
    this.viewportManager.toMono(app);

    // Hides the HUD and loading indicators on first load.
    this.hideHud(true);
    this.hideLoadingIndicator();

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

            //  Use the "back" button to reset sensor.
            'b5': () => this.viewportManager.resetSensor(),

            // Horizontal scrolling.
            'a0': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
              runtime.gamepadInput.scroll.scrollX(axis, value)
            ),

            // Vertical scrolling.
            'a1': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
              runtime.gamepadInput.scroll.scrollY(axis, value)
            ),

            // Use the "A" button to click on elements (and hold to submit forms).
            'b11.down': () => this.allowCursor().then(this.cursorMouseDown.bind(this)),
            'b11.up': () => this.allowCursor().then(this.cursorMouseUp.bind(this)),

            //  Use the "X" button to navigate back.
            'b13': () => this.activeFrame.on_back(),

            //  Use the "B" button to navigate forward.
            'b12': () => this.activeFrame.on_forward(),
          },
          '54c-268-PLAYSTATION(R)3 Controller': {
            'b16': () => this.toggleHud(),
            'b3': () => this.toggleHud(),
            'a0': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
              runtime.gamepadInput.scroll.scrollX(axis, value)
            ),
            'a1': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
              runtime.gamepadInput.scroll.scrollY(axis, value)
            ),
            'b14.down': () => this.allowCursor().then(this.cursorMouseDown.bind(this)),
            'b14.up': () => this.allowCursor().then(this.cursorMouseUp.bind(this)),
          },
          // XBOX Wired controller (Windows)
          'xinput': {
            'b9': () => this.toggleHud(),
            'b8': () => this.viewportManager.resetSensor(),
            'a0': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
              runtime.gamepadInput.scroll.scrollX(axis, value)
            ),
            'a1': (gamepad, axis, value) => this.requireMonoFrameOpen().then(
              runtime.gamepadInput.scroll.scrollY(axis, value)
            ),
            'b0.down': () => this.allowCursor().then(this.cursorMouseDown.bind(this)),
            'b0.up': () => this.allowCursor().then(this.cursorMouseUp.bind(this)),
            'b2': () => this.activeFrame.on_back(),
            'b1': () => this.activeFrame.on_forward(),
          }
        },
      },
      scroll: {
        axisThreshold: 0.15,
        smoothingFactor: 0.4,
        velocityThreshold: 0.05
      }
    });

    requestAnimationFrame(this.intersectCursor.bind(this));
    requestAnimationFrame(this.positionCursor.bind(this));

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
      'c.down': () => this.allowCursor().then(this.cursorMouseDown.bind(this)),
      'c.up': () => this.allowCursor().then(this.cursorMouseUp.bind(this)),
      'alt arrowup': () => {
        this.frameCommunicator.send('scroll.step', {
          scrollTop: -scrollConfig.step
        });
      },
      'alt arrowdown': () => {
        this.frameCommunicator.send('scroll.step', {
          scrollTop: scrollConfig.step
        });
      },
      'alt arrowleft': () => {
        this.frameCommunicator.send('scroll.step', {
          scrollLeft: -scrollConfig.step
        });
      },
      'alt arrowright': () => {
        this.frameCommunicator.send('scroll.step', {
          scrollLeft: scrollConfig.step
        });
      },
      'ctrl arrowup': () => {
        this.frameCommunicator.send('scroll.home');
      },
      'ctrl arrowdown': () => {
        this.frameCommunicator.send('scroll.end');
      }
    });

  /*
    if (runtime.settings.play_audio_on_browser_start) {
      neatAudio.fetchSound(runtime.settings.www_browser_start_src).then(sound => {
        this.sfx.browserStart = sound;

        // Sound chime when browser has (re)started.
        this.sfx.play('browserStart');
      });
    }
  */
  }
}
