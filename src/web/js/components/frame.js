import ReactDOM from 'react-dom';

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
    return ReactDOM.findDOMNode(this.refs.iframe);
  }

  handleEvent(e) {
    if (this.props[e.type]) {
      this.props[e.type](this.props.frameProps, e);
    }
  }

  onBack() {
    this.iframe.goBack();
  }

  onForward() {
    this.iframe.goForward();
  }

  onStop() {
    this.iframe.stop();
  }

  /**
   * Reloads the current page.
   *
   * @param {Boolean} hardReload Whether or not to perform a hard reload.
   */
  onReload(hardReload = false) {
    this.iframe.reload(hardReload);
  }

  onClose() {
    this.iframe.parentNode.removeChild(this.iframe);
  }

  onZoomIn() {
    this.zoomValue = Math.min(this.zoomValue + zoomConfig.step, zoomConfig.max);
    this.iframe.zoom(this.zoomValue);
  }

  onZoomOut() {
    this.zoomValue = Math.max(this.zoomValue - zoomConfig.step, zoomConfig.min);
    this.iframe.zoom(this.zoomValue);
  }

  onResetZoom() {
    this.zoomValue = zoomConfig.defaultValue;
    this.iframe.zoom(this.zoomValue);
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

  componentWillReceiveProps(nextProps) {
    if (this.iframe.getAttribute('src') !== nextProps.frameProps.url) {
      this.iframe.setAttribute('src', nextProps.frameProps.url);
    }
  }

  render() {
    return <div className='frameWrapper'>
        <div ref='iframe' />
      </div>;
  }
}
