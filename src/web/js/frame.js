import Url from './lib/url.js';

var url = new Url();

const zoomConfig = {
  min: 0.2,
  max: 3,
  step: 0.1,
  defaultValue: 1
};

export default class Frame {
  constructor(config) {
    this.config = config;

    // Mozbrowser events that we are interested in listening to.
    this.browserEvents = ['mozbrowserclose', 'mozbrowsererror', 'mozbrowservisibilitychange',
      'mozbrowserloadend', 'mozbrowserloadstart', 'mozbrowsertitlechange',
      'mozbrowserlocationchange', 'mozbrowsermetachange', 'mozbrowsericonchange',
      'mozbrowserasyncscroll', 'mozbrowsersecuritychange'];

    this.title = '';
    this.location = config.url;

    this.zoomValue = zoomConfig.defaultValue;
    this.createFrame();
  }

  handleEvent(e) {
    var listener = 'on_' + e.type;
    if (this[listener]) {
      this[listener](e);
    }

    // Broadcast an event to notify other modules.
    // We could use an event emitter here, but there may be good reasons
    // to notify the world for things like history and UI changes.
    window.dispatchEvent(new CustomEvent('frame_' + e.type, {
      bubbles: true,
      detail: e.detail
    }));

  }

  on_mozbrowserlocationchange(e) {
    this.location = e.detail;
  }

  on_mozbrowsertitlechange(e) {
    this.title = e.detail;
  }

  on_backclicked() {
    this.element.goBack();
  }

  on_forwardclicked() {
    this.element.goForward();
  }

  on_stopclicked() {
    this.element.stop();
  }

  on_reloadclicked() {
    this.element.reload();
  }

  createFrame() {
    var element = document.createElement('iframe');
    element.setAttribute('src', this.config.url);
    element.setAttribute('mozbrowser', 'true');
    element.setAttribute('remote', 'true');
    element.className = 'frame threed';
    this.config.container.appendChild(element);

    this.element = element;

    this.browserEvents.forEach(event => {
      element.addEventListener(event, this);
    });
  }

  close() {
    this.element.parentNode.removeChild(this.element);
  }

  zoomIn() {
    this.zoomValue = Math.min(this.zoomValue + zoomConfig.step, zoomConfig.max);
    this.element.zoom(this.zoomValue);
  }

  zoomOut() {
    this.zoomValue = Math.max(this.zoomValue - zoomConfig.step, zoomConfig.min);
    this.element.zoom(this.zoomValue);
  }

  resetZoom() {
    this.zoomValue = zoomConfig.defaultValue;
    this.element.zoom(this.zoomValue);
  }

  navigate(value) {
    var location = url.getUrlFromInput(value);
    this.location = location;
    this.title = '';

    // Reset local values and update the hud when we navigate..
    window.dispatchEvent(new CustomEvent('frame_mozbrowserlocationchange', {
      bubbles: true,
      detail: location
    }));

    this.element.setAttribute('src', location);
  }
}
