import * as Url from 'js/lib/url.js';

var url = new Url();

export default class Frame {
  constructor(config) {
    this.config = config;

    // Mozbrowser events that we are interested in listening to.
    this.browserEvents = ['mozbrowserclose', 'mozbrowsererror', 'mozbrowservisibilitychange',
      'mozbrowserloadend', 'mozbrowserloadstart', 'mozbrowsertitlechange',
      'mozbrowserlocationchange', 'mozbrowsermetachange', 'mozbrowsericonchange',
      'mozbrowserasyncscroll', 'mozbrowsersecuritychange'];

    this.createFrame();
  }

  handleEvent(e) {
    console.log('Got event', e.type);
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
    element.setAttribute('mozbrowser', 'true');
    element.className = 'frame';
    this.config.container.appendChild(element);

    this.element = element;

    this.browserEvents.forEach(event => {
      element.addEventListener(event, this);
    });
  }

  close() {
    this.element.parentNode.removeChild(this.element);
  }

  navigate(value) {
    this.element.setAttribute('src', url.getUrlFromInput(value));
  }
}
