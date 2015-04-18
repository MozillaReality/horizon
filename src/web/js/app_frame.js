import * as Url from '/js/lib/url.js';

var url = new Url();

export default class AppFrame {
  constructor(config) {
    this.config = config;
    this.createFrame();
  }

  _handle_back() {
    this.element.goBack();
  }

  _handle_forward() {
    this.element.goForward();
  }

  _handle_stop() {
    this.element.stop();
  }

  _handle_reload() {
    this.element.reload();
  }

  createFrame() {
    var element = document.createElement('iframe');
    element.setAttribute('src', this.config.url);
    element.setAttribute('remote', 'true');
    element.setAttribute('mozbrowser', 'true');
    element.className = 'frame';
    this.config.container.appendChild(element);

    this.element = element;
  }

  navigate(value) {
    window.alert('raw value is ' + value);
    window.alert('value is ' + url.getUrlFromInput(value));
    this.element.setAttribute('src', url.getUrlFromInput(value));
  }
}
