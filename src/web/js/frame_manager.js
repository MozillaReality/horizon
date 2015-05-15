import Frame from './frame.js';

export default class FrameManager {
  constructor() {
    this.frames = [];
    this.activeFrameIndex = null;

    this.hud = $('#hud');
    this.container = $('#fs-container');
    this.contentContainer = $('#frames');
    this.urlbar = $('#urlbar');
    this.urlInput = $('#urlbar input');
  }

  get activeFrame() {
    return this.frames[this.activeFrameIndex];
  }

  handleEvent(e) {

    switch(e.type) {
      case 'frame_mozbrowserlocationchange':
      case 'frame_mozbrowsertitlechange':
        this.updateHUDForActiveFrame();
        break;
      case 'frame_mozbrowseropenwindow':
        this.onNewFrame(e.detail.url);
        break;
    }

    var action = e.target.dataset && e.target.dataset.action;
    if (!action) { return; }

    if (action === 'new') {
      this.newFrame();
      return;
    }

    this.activeFrame['on_' + e.target.dataset.action + 'clicked'](e);
  }

  /**
   * Opens a new browsing frame.
   */
  newFrame(location = 'http://www.mozvr.com/projects') {
    var app = new Frame({
      url: location,
      container: this.contentContainer
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
    for (var i = 0 ; i < this.frames.length; i++) {
      var width = this.frames[i].element.offsetWidth;
      var x = (i - this.activeFrameIndex) * width;
      var distance = 1000;
      var rotate = 20 * (i - this.activeFrameIndex) * -1;
      this.frames[i].element.style.transform = `translateX(${x}px)
        perspective(${distance}px)
        rotateY(${rotate}deg)`;
    }
    this.updateHUDForActiveFrame();
  }

  updateHUDForActiveFrame() {
    if (this.activeFrame) {
      this.urlInput.value = this.activeFrame.title || this.activeFrame.location;
    } else {
      this.urlInput.value = '';
    }
  }

  /**
   * Handles the focus hotkey.
   * Sets the urlbar to be the raw location instead of title.
   */
  focusUrlbar() {
    var urlbarInput = $('#urlbar input');

    if (this.activeFrame) {
      urlbarInput.value = this.activeFrame.location;
    }
    urlbarInput.focus();
    this.urlInput.select();
  }

  /**
   * On blur we want to return to the title of the page.
   */
  handleBlurUrlBar() {
    this.updateHUDForActiveFrame();
  }

  handleUrlEntry(e) {
    var urlbarInput = $('#urlbar input');
    e.preventDefault();
    this.navigate(urlbarInput.value);
    urlbarInput.blur();
  }

  navigate(url) {
    if (!this.activeFrame) {
      this.newFrame();
    }
    this.activeFrame.navigate(url);
  }

  start(runtime) {
    window.addEventListener('frame_mozbrowserlocationchange', this);
    window.addEventListener('frame_mozbrowseropenwindow', this);
    window.addEventListener('frame_mozbrowsertitlechange', this);

    window.addEventListener('resize', this.positionFrames.bind(this));
    this.hud.addEventListener('click', this);
    this.urlbar.addEventListener('submit', this.handleUrlEntry.bind(this));
    this.urlInput.addEventListener('focus', this.focusUrlbar.bind(this));
    this.urlInput.addEventListener('blur', this.handleBlurUrlBar.bind(this));
    this.newFrame();

    runtime.keyboardInput.assign({
      'ctrl =': () => this.activeFrame.zoomIn(),
      'ctrl -': () => this.activeFrame.zoomOut(),
      'ctrl 0': () => this.activeFrame.resetZoom(),
      'ctrl r': () => this.activeFrame.on_reloadclicked(),
      'ctrl t': () => this.newFrame(),
      'ctrl w': () => this.closeFrame(),
      'ctrl l': () => this.focusUrlbar(),
      'escape': () => this.activeFrame.on_stopclicked(),
      'backspace': () => this.activeFrame.on_backclicked(),
      'ctrl ArrowLeft': () => this.activeFrame.on_backclicked(),
      'ctrl ArrowRight': () => this.activeFrame.on_forwardclicked()
    });
  }
}
