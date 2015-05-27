import Gamepads from '../../../../../node_modules/gamepad-plus/src/lib/gamepads.js';

import EventEmitter from '../../lib/eventEmitter.js';


export default class GamepadInput extends EventEmitter {

  constructor() {
    super();
    this._debug = false;
    this._pollingInterval = {};
    this.config = {};
    this.gamepads = {};
  }

  /**
   * Polls the gamepad state, updating the `Gamepads` instance's `state`
   * property with the latest gamepad data.
   */
  _update() {
    this.gamepads.update();
    window.requestAnimationFrame(this._update.bind(this));
  }

  /**
   * Stops the loop(s) that are polling the gamepad state.
   */
  _stopUpdate() {
    if (this._pollingInterval) {
      window.clearInterval(this._pollingInterval);
    }

    window.cancelAnimationFrame(this._update.bind(this));
  }

  init() {
    this.gamepads = new Gamepads(this.config);

    if (!this.gamepads.gamepadsSupported) {
      return;
    }

    // At the time of this writing, Firefox is the only browser that
    // fires the `gamepadconnected` event. For the other browsers
    // <https://crbug.com/344556>, we start polling every 100ms
    // until the first gamepad is connected.
    if (Gamepads.utils.browser !== 'firefox') {
      this._pollingInterval = window.setInterval(() => {
        if (this.gamepads.poll().length) {
          this._update();
          window.clearInterval(this._pollingInterval);
        }
      }, 200);
    }

    window.addEventListener('gamepadconnected', e => {
      this._update();
      this.emit('gamepadconnected', this.gamepads.state[e.gamepad.index]);
    });
    window.addEventListener('gamepaddisconnected', e => {
      this.emit('gamepaddisconnected', this.gamepads.state[e.gamepad.index]);
    });
    window.addEventListener('gamepadaxismove', e => {
      this.emit('gamepadaxismove', this.gamepads.state[e.gamepad.index],
        e.axis, e.value);
    });
    window.addEventListener('gamepadbuttondown', e => {
      this.emit('gamepadbuttondown', this.gamepads.state[e.gamepad.index],
        e.button);
    });
    window.addEventListener('gamepadbuttonup', e => {
      this.emit('gamepadbuttonup', this.gamepads.state[e.gamepad.index],
        e.button);
    });

    if (this._debug) {
      this.on('gamepadconnected', gamepad => {
        console.log('Gamepad connected at index %d: %s. %d buttons, %d axes.',
          gamepad.index, gamepad.id, gamepad.buttons.length,
          gamepad.axes.length);

      }).on('gamepaddisconnected', gamepad => {
        console.log('Gamepad removed at index %d: %s.', gamepad.index,
          gamepad.id);

      }).on('gamepadaxismove', (gamepad, axis, value) => {
        console.log('Gamepad axis move at index %d: %s. Axis: %d. Value: %f.',
          gamepad.index, gamepad.id, axis, value);

      }).on('gamepadbuttondown', (gamepad, button) => {
        console.log('Gamepad button down at index %d: %s. Button: %d.',
          gamepad.index, gamepad.id, button);

      }).on('gamepadbuttonup', (gamepad, button) => {
        console.log('Gamepad button up at index %d: %s. Button: %d.',
          gamepad.index, gamepad.id, button);

      });
    }
  }

  /**
   * Assigns gamepad configurations.
   * @param {Object} config Options object to use for creating `Gamepads` instance.
   */
  assign(config) {
    this.config = config || {};
  }
}
