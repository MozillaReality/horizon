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
    this.id = config.id;
    this.config = config;

    // Mozbrowser events that we are interested in listening to.
    this.browserEvents = ['mozbrowserclose', 'mozbrowsererror', 'mozbrowservisibilitychange',
      'mozbrowserloadend', 'mozbrowserloadstart', 'mozbrowsertitlechange',
      'mozbrowserlocationchange', 'mozbrowsermetachange', 'mozbrowsericonchange',
      'mozbrowserasyncscroll', 'mozbrowseropentab', 'mozbrowseropenwindow', 'mozbrowsersecuritychange',
      'mozbrowsershowmodalprompt'];

    this.title = '';
    this.location = config.url;
    this.isStereo = false;
    this.icons = [];

    this.zoomValue = zoomConfig.defaultValue;
    this.createFrame();
  }

  handleEvent(e) {
    var listener = 'on_' + e.type;
    if (this[listener]) {
      this[listener](e);
    }

    this.config.browserEvent(e, this);
  }

  get icon() {
    if (!this.icons.length) {
      var size = devicePixelRatio * 50;
      var mozResolution = '#-moz-resolution=' + size + ',' + size;
      var baseUrl = new URL('/favicon.ico' + mozResolution, this.location);
      return baseUrl.toString();
    }
    return this.icons[0].href;
  }

  on_mozbrowserlocationchange(e) {
    this.location = e.detail;
    this.icons = [];
  }

  on_mozbrowsertitlechange(e) {
    this.title = e.detail;
  }

  on_mozbrowsericonchange({detail}) {
    this.icons.push(detail);
  }

  on_mozbrowsermetachange({detail}) {
    if (detail.name !== 'viewmode') {
      return;
    }

    var values = {};
    detail.content.split(',').forEach(def => {
      var [key, val] = def.split('=');
      values[String(key).trim()] = String(val).trim();
    });

    var {projection} = values;

    // If the meta tag is removed, we revert to the default mono viewmode.
    if (detail.type === 'removed') {
      projection = 'mono';
    }

    if (projection === 'stereo' && !this.isStereo) {
      this.isStereo = true;
      window.dispatchEvent(new CustomEvent('stereo-viewmode', {
        detail: this
      }));
    }

    if (projection === 'mono' && this.isStereo) {
      this.isStereo = false;
      window.dispatchEvent(new CustomEvent('mono-viewmode', {
        detail: this
      }));
    }
  }

  on_back() {
    this.element.goBack();
  }

  on_forward() {
    this.element.goForward();
  }

  on_stop() {
    this.element.stop();
  }

  /**
   * Reloads the current page.
   *
   * @param {(Event|null)} e The mozbrowser event.
   * @param {Boolean} hardReload Whether or not to perform a hard reload.
   */
  on_reload(e, hardReload = false) {
    this.element.reload(hardReload);
  }

  createFrame() {
    var element = document.createElement('iframe');
    element.setAttribute('src', this.config.url);
    element.setAttribute('mozbrowser', 'true');
    element.setAttribute('remote', 'true');
    element.className = 'frame--mono threed';
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
    this.icons = [];

    // Reset local values and update the hud when we navigate..
    window.dispatchEvent(new CustomEvent('frame_mozbrowserlocationchange', {
      bubbles: true,
      detail: location
    }));

    this.element.setAttribute('src', location);
  }
}
