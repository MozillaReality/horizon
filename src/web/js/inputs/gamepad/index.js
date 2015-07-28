import Gamepads from '../../../../../node_modules/gamepad-plus/src/lib/gamepads.js';
import GamepadScroll from './scroll.js';


export default class GamepadInput {

  constructor(config) {
    this.debug = false;
    this.pollingInterval = {};
    this.config = config || {};
    this.gamepads = {};
  }

  /**
   * Polls the gamepad state, updating the `Gamepads` instance's `state`
   * property with the latest gamepad data.
   */
  update() {
    this.gamepads.update();
    window.requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Stops the loop(s) that are polling the gamepad state.
   */
  _stopUpdate() {
    if (this.pollingInterval) {
      window.clearInterval(this.pollingInterval);
    }

    window.cancelAnimationFrame(this.update.bind(this));
  }

  init(runtime) {
    this.gamepads = new Gamepads(this.config.input);

    if (!this.gamepads.gamepadsSupported) {
      return;
    }

    this.scroll = new GamepadScroll({
      config: this.config.scroll
    });
    this.scroll.init(runtime);

    // At the time of this writing, Firefox is the only browser that
    // fires the `gamepadconnected` event. For the other browsers
    // <https://crbug.com/344556>, we start polling every 100ms
    // until the first gamepad is connected.
    if (Gamepads.utils.browser !== 'firefox') {
      this.pollingInterval = window.setInterval(() => {
        if (this.gamepads.poll().length) {
          this.update();
          window.clearInterval(this.pollingInterval);
        }
      }, 200);
    }

    window.addEventListener('gamepadconnected', e => {
      if (this.debug) {
        console.log('Gamepad connected at index %d: %s. %d buttons, %d axes.',
          e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length,
          e.gamepad.axes.length);
      }
      this.update();
    });

    window.addEventListener('gamepaddisconnected', e => {
      if (this.debug) {
        console.log('Gamepad removed at index %d: %s.', e.gamepad.index, e.gamepad.id);
      }
    });
  }

  /**
   * Assigns gamepad configurations (at initialisation).
   * @param {Object} config Options object to use for creating `Gamepads` instance.
   */
  assign(config) {
    this.config = config || {};
  }

  /**
   * Adds new gamepad index mappings (after initialisation).
   * @param {Object} indices Indices object to use for updating `Gamepads` indices.
   */
  assignIndices(indices) {
    if (!this.gamepads.indices) {
      this.gamepads.indices = {};
    }

    // Extend the existing objects so we preserve the existing index mappings.
    Object.keys(indices).forEach(index => {
      this.gamepads.indices[index] = Object.assign(
        this.gamepads.indices[index] || {}, indices[index]);
    });
  }
}
