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
      this.appendFrame();
      return;
    }

    this.activeFrame['_handle_' + e.target.dataset.action](e);
  }

  appendFrame() {
    var app = new Frame({
      url: 'http://mozilla.org',
      container: this.container
    });
    this.activeFrameIndex = this.frames.length;
    this.frames.push(app);

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

  handleUrlEntry(e) {
    var urlbarInput = $('#urlbar input');
    e.preventDefault();
    this.navigate(urlbarInput.value);
    urlbarInput.blur();
  }

  navigate(url) {
    this.activeFrame.navigate(url);
  }

  start() {
    window.addEventListener('resize', this.positionFrames.bind(this));
    this.hud.addEventListener('click', this);
    this.urlbar.addEventListener('submit', this.handleUrlEntry.bind(this));
    this.appendFrame();
  }
}
