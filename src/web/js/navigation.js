import * as AppFrame from '/js/app_frame.js';

export default class Navigation {

  constructor() {
    this.apps = [];
    this.activeAppIndex = null;
    this.hud = $('#hud');
    this.container = $('#frames');
  }

  get activeApp() {
    return this.apps[this.activeAppIndex];
  }

  handleEvent(e) {
    var action = e.target.dataset && e.target.dataset.action;
    if (!action) { return; }

    if (action === 'new') {
      this.appendFrame();
      return;
    }

    this.activeApp['_handle_' + e.target.dataset.action](e);
  }

  appendFrame() {
    var app = new AppFrame({
      url: 'http://mozilla.org',
      container: this.container
    });
    this.activeAppIndex = this.apps.length;
    this.apps.push(app);

    this.positionFrames();
  }

  positionFrames() {
    var frameWidth = 840;
    for (var i = 0 ; i < this.apps.length; i++) {
      var x = (i - this.activeAppIndex) * frameWidth;
      this.apps[i].element.style.transform = `translateX(${x}px)`;
    }
  }

  start() {
    this.hud.addEventListener('click', this);
    this.appendFrame();
  }
}
