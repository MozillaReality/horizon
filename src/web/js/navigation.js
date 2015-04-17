import * as AppFrame from '/js/app_frame.js';

export default class Navigation {

  constructor() {
    this.apps = [];
    this.activeApp = null;
    this.hud = $('#hud');
  }

  handleEvent(e) {
    if (e.target.dataset && e.target.dataset.action) {
      this.activeApp['_handle_' + e.target.dataset.action](e);
    }
  }

  appendFrame() {
    var app = new AppFrame({
      url: 'http://mozilla.org'
    });
    this.activeApp = app;
    this.apps.push(app);
  }

  start() {
    this.hud.addEventListener('click', this);
    this.appendFrame();
  }
}
