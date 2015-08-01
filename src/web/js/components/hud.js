import neatAudio from '../../../../node_modules/neat-audio/neat-audio.js';

import Tiles from './tiles.js';
import cx from './../lib/class_set.js';
import PermissionPrompt from './permission_prompt.js';

const hudHideSound = '/media/hud_hide.wav';
const hudShowSound = '/media/hud_show.wav';

export default class Hud extends React.Component {

  constructor(props) {
    super(props);

    // Helper object for playing sound effects.
    this.sfx = {
      init: win => {
        neatAudio.init(win || window);
      },
      play: name => {
        neatAudio.playSound(this.sfx[name]);
      }
    };

    this.sfx.init();

    // Preload the sound effects so we can play them later.
    Promise.all([
      neatAudio.fetchSound(hudHideSound),
      neatAudio.fetchSound(hudShowSound)
    ]).then(sounds => {
      this.sfx.hudHide = sounds[0];
      this.sfx.hudShow = sounds[1];
    }, err => {
      console.error('Could not fetch sound:', err.stack);
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.hudVisible && this.props.hudVisible !== nextProps.hudVisible) {
      this.sfx.play('hudShow');
    } else if (!nextProps.hudVisible && this.props.hudVisible !== nextProps.hudVisible) {
      this.sfx.play('hudHide');
    }
  }

  get urlInput() {
    return React.findDOMNode(this.refs.urlInput);
  }

  get iconStyle() {
    var icons = this.props.activeFrameProps.icons;
    var location = this.props.hudUrl;
    var href;
    if (!location || !icons.length) {
      return null;
    }

    if (!icons.length) {
      var size = devicePixelRatio * 50;
      var mozResolution = '#-moz-resolution=' + size + ',' + size;
      var baseUrl = new URL('/favicon.ico' + mozResolution, location);
      href = baseUrl.toString();
    } else {
      href = icons[0].href;
    }

    return {
      backgroundImage: `url(${href})`
    };
  }

  render() {

    return <div id='hud'
      className={cx({
        hud: true,
        threed: true,
        hidden: !this.props.hudVisible
      })}>
      <div id='background' className='background threed pointer-none'></div>

      <PermissionPrompt />

      <div id='title' className='title threed pointer-none'>
        <span id='title__icon' className='title__icon' style={this.iconStyle}></span>
        <span id='title__text' className='title__text'>{this.props.activeFrameProps.title}</span>
      </div>

      <Tiles
        runtime={this.props.runtime} />

      <form id='urlbar' className='urlbar threed' action='#' onSubmit={this.props.onUrlSubmit}>
        <input id='urlbar__input' className='urlbar__input' ref='urlInput' type='text' onChange={this.props.onUrlChange} value={this.props.hudUrl} />
      </form>

      <div id='backfwd' className='backfwd threed'>
        <button className='fa fa-arrow-left nav back' data-action='back' id='back'
          disabled={!this.props.activeFrameProps.canGoBack}
          onClick={this.props.onBack}></button>
        <button className='fa fa-arrow-right nav forward' data-action='forward' id='forward'
          disabled={!this.props.activeFrameProps.canGoForward}
          onClick={this.props.onForward}></button>
      </div>

      <button id='closehud' className='nav closehud threed'>Close HUD</button>
    </div>;
  }
}
