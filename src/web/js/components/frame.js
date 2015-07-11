import React from '../../../../node_modules/react';
import Url from './../lib/url.js';

var url = new Url();

const zoomConfig = {
  min: 0.2,
  max: 3,
  step: 0.1,
  defaultValue: 1
};

export default class Frame extends React.Component {

  constructor(props) {
    super(props);

    // Mozbrowser events that we are interested in listening to.
    this.browserEvents = ['mozbrowserclose', 'mozbrowsererror', 'mozbrowservisibilitychange',
      'mozbrowserloadend', 'mozbrowserloadstart', 'mozbrowsertitlechange',
      'mozbrowserlocationchange', 'mozbrowsermetachange', 'mozbrowsericonchange',
      'mozbrowserasyncscroll', 'mozbrowseropentab', 'mozbrowseropenwindow', 'mozbrowsersecuritychange',
      'mozbrowsershowmodalprompt'];

    this.title = '';
    this.location = props.url;
    this.isStereo = false;

    this.zoomValue = zoomConfig.defaultValue;
  }

  get iframe() {
    return React.findDOMNode(this.refs.iframe);
  }

  handleEvent(e) {
    if (this.props[e.type]) {
      this.props[e.type](this.props.frameProps, e);
    }
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
      this.props.onStereo();
    }

    if (projection === 'mono' && this.isStereo) {
      this.isStereo = false;
      this.props.onMono();
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

  /**
   * Swaps out the mozbrowser iframe after mounting.
   * Needed due to custom attributes, and potentially using frames from mozbrowser events.
   */
  componentDidMount() {
    var frame = this.iframe;
    var reactid = frame.dataset.reactid;
    if (frame.tagName.toLowerCase() !== 'iframe') {
      frame = document.createElement('iframe');
      frame.setAttribute('remote', 'true');
    }
    frame.className = 'frame';
    frame.dataset.reactid = reactid;

    frame.setAttribute('mozbrowser', 'true');
    frame.setAttribute('allowfullscreen', 'true');
    frame.setAttribute('src', this.props.url);

    if (!frame.hasAttribute('data-listeners-added')) {
      frame.setAttribute('data-listeners-added', true);
      this.browserEvents.forEach(event =>
        frame.addEventListener(event, this));
    }

    this.iframe.parentNode.replaceChild(frame, this.iframe);
  }

  render() {
    return <div className='frameWrapper'>
        <div ref='iframe' />
      </div>;
  }
}
