import neatAudio from '../../../../node_modules/neat-audio/neat-audio.js';
import React from '../../../../node_modules/react';
import Tiles from './tiles.js';
import cx from './../lib/class_set.js';

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

  render() {
    return <div id='hud'
      className={cx({
        hud: true,
        threed: true,
        open: this.props.hudVisible,
        closed: !this.props.hudVisible
      })}>
      <div id='background' className='background threed pointer-none'></div>

      <div id='title' className='title threed pointer-none'>
        <span id='title__icon' className='title__icon'></span>
        <span id='title__text' className='title__text'>{this.props.activeFrameProps.title}</span>
      </div>

      <Tiles
        runtime={this.props.runtime} />

      <form id='urlbar' className='urlbar threed' action='#' onSubmit={this.props.onUrlEntry}>
        <input id='urlbar__input' className='urlbar__input' ref='urlInput' type='text' />
      </form>

      <div id='backfwd' className='backfwd threed'>
        <button className='fa fa-arrow-left nav back' data-action='back' id='back'></button>
        <button className='fa fa-arrow-right nav forward' data-action='forward' id='forward'></button>
      </div>

      <div id='stopreload' className='stopreload threed'>
        <button className='fa fa-repeat nav reload' data-action='reload' id='reload'></button>
        <button className='fa fa-times nav stop' data-action='stop' id='stop'></button>
      </div>

      <button id='closehud' className='nav closehud threed'>Close HUD</button>

      <div id='loading' className='loading threed'>LOADING</div>
    </div>;
  }
}
