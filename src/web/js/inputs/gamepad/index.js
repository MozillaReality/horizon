import Gamepads from '../../../../../node_modules/gamepad-plus/src/lib/gamepads.js';
import GamepadScroll from './scroll.js';

import EventEmitter from '../../lib/event_emitter.js';


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

  init(runtime) {
    this.gamepads = new Gamepads(this.config.input);

    if (!this.gamepads.gamepadsSupported) {
      return;
    }

    this.scroll = new GamepadScroll({
      gamepadInput: this,
      config: this.config.scroll
    });
    this.scroll.init(runtime);

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

    // Firing local events so we don't need to look up the gamepad state and
    // wrap it with gamepad-plus's wrapped Gamepad object every time.
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

    // These handle the bindings defined in the `runtime.gamepadInput.assign`
    // call in `FrameManager.init`.
    this.on('gamepadconnected', this._onGamepadConnected.bind(this));
    this.on('gamepaddisconnected', this._onGamepadDisconnected.bind(this));
    this.on('gamepadbuttonup', this._onGamepadButtonUp.bind(this));
    this.on('gamepadaxismove', this._onGamepadAxisMove.bind(this));
  }

  /**
   * Returns whether a `button` index equals the supplied `key`.
   *
   * Useful for determining whether ``navigator.getGamepads()[0].buttons[`$button`]``
   * has any bindings defined (in `FrameManager`).
   *
   * @param {Number} button Index of gamepad button (e.g., `4`).
   * @param {String} key Human-readable format for button binding (e.g., 'b4').
   */
  _buttonEqualsKey(button, key) {
    return 'b' + button === key.trim().toLowerCase();
  }

  /**
   * Returns whether an `axis` index equals the supplied `key`.
   *
   * Useful for determining whether ``navigator.getGamepads()[0].axes[`$button`]``
   * has any bindings defined (in `FrameManager`).
   *
   * @param {Number} button Index of gamepad axis (e.g., `1`).
   * @param {String} key Human-readable format for button binding (e.g., 'a1').
   */
  _axisEqualsKey(axis, key) {
    return 'a' + axis === key.trim().toLowerCase();
  }

  /**
   * Calls any bindings defined for 'connected' (in `FrameManager`).
   *
   * (Called by event listener for `gamepadconnected`.)
   *
   * @param {Gamepad} gamepad Gamepad object (after it's been wrapped by gamepad-plus).
   */
  _onGamepadConnected(gamepad) {
    if ('connected' in gamepad.indices) {
      gamepad.indices.connected(gamepad);
    }
  }

  /**
   * Calls any bindings defined for 'disconnected' (in `FrameManager`).
   *
   * (Called by event listener for `gamepadconnected`.)
   *
   * @param {Gamepad} gamepad Gamepad object (after it's been wrapped by gamepad-plus).
   */
  _onGamepadDisconnected(gamepad) {
    if ('disconnected' in gamepad.indices) {
      gamepad.indices.disconnected(gamepad);
    }
  }

  /**
   * Calls any bindings defined for buttons (e.g., 'b4' in `FrameManager`).
   *
   * (Called by event listener for `gamepadconnected`.)
   *
   * @param {Gamepad} gamepad Gamepad object (after it's been wrapped by gamepad-plus).
   * @param {Number} button Index of gamepad button (integer) being released
   *                        (per `gamepadbuttonup` event).
   */
  _onGamepadButtonUp(gamepad, button) {
    for (var key in gamepad.indices) {
      if (this._buttonEqualsKey(button, key)) {
        gamepad.indices[key](gamepad, button);
      }
    }
  }

  /**
   * Calls any bindings defined for axes (e.g., 'a1' in `FrameManager`).
   *
   * (Called by event listener for `gamepadaxismove`.)
   *
   * @param {Gamepad} gamepad Gamepad object (after it's been wrapped by gamepad-plus).
   * @param {Number} axis Index of gamepad axis (integer) being changed
   *                      (per `gamepadaxismove` event).
   * @param {Number} value Value of gamepad axis (from -1.0 to 1.0) being
   *                       changed (per `gamepadaxismove` event).
   */
  _onGamepadAxisMove(gamepad, axis, value) {
    for (var key in gamepad.indices) {
      if (this._axisEqualsKey(axis, key)) {
        gamepad.indices[key](gamepad, axis, value);
      }
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
