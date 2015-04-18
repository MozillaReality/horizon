import * as Frame from '/js/frame.js';

export default class Navigation {

  constructor() {
    this.frames = [];
    this.activeFrameIndex = null;

    this.hud = $('#hud');
    this.container = $('#frames');
    this.urlbar = $('#urlbar');
  }

  get activeFrame() {
    return this.frames[this.activeFrameIndex];
  }

  handleEvent(e) {
    var action = e.target.dataset && e.target.dataset.action;
    if (!action) { return; }

    if (action === 'new') {
      this.newFrame();
      return;
    }

    this.activeFrame['_handle_' + e.target.dataset.action](e);
  }

  /**
   * Opens a new browsing frame.
   */
  newFrame() {
    var app = new Frame({
      url: 'http://mozilla.org',
      container: this.container
    });
    this.activeFrameIndex = this.frames.length;
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
    var frameWidth = (window.innerWidth * 0.8) /* frame size */ + 40 /* padding */;
    var centerAdjust = (window.innerWidth - frameWidth)/4 /* to center the frame */;
    for (var i = 0 ; i < this.frames.length; i++) {
      var x = (i - this.activeFrameIndex) * frameWidth + centerAdjust;
      this.frames[i].element.style.transform = `translateX(${x}px)`;
    }
  }

  focusUrlbar() {
    var urlbarInput = $('#urlbar input');
    urlbarInput.focus();
  }

  handleUrlEntry(e) {
    var urlbarInput = $('#urlbar input');
    e.preventDefault();
    this.navigate(urlbarInput.value);
    urlbarInput.blur();
  }

  navigate(url) {
    this.activeFrame.navigate(url);
  }

  start(runtime) {
    window.addEventListener('resize', this.positionFrames.bind(this));
    this.hud.addEventListener('click', this);
    this.urlbar.addEventListener('submit', this.handleUrlEntry.bind(this));
    this.newFrame();

    runtime.hotkeys.assign({
      'ctrl t': () => this.newFrame(),
      'ctrl w': () => this.closeFrame(),
      'ctrl l': () => this.focusUrlbar()
    });
  }
}
