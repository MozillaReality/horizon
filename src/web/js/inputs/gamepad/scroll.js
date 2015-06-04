const DEFAULT_CONFIG = {
  axisThreshold: 0.15,
  smoothingFactor: 0.4,
  velocityThreshold: 0.05
};

export default class GamepadScroll {
  constructor(opts) {
    opts = opts || {};

    this.active = false;
    this.activeElement = null;
    this.bc = null;
    this.config = Object.assign({}, DEFAULT_CONFIG, opts.config || {});
    this.offset = {x: 0, y: 0};
    this.realVelocity = {x: 0.0, y: 0.0};
    this.latestScrollPos = {scrollLeft: 0, scrollTop: 0};
    this.time = 0;
    this.timeSinceLastUpdate = 0;
    this.timeSinceScrollStart = 0;
    this.timeStart = 0;
    this.velocity = {x: 0.0, y: 0.0};
    this.velocitySpeed = null;
    this.warp = 1;
  }

  init(runtime) {
    this.runtime = runtime;

    window.addEventListener('frame_mozbrowserlocationchange',
      this.reset.bind(this));
  }

  /**
   * Resets scrolling (called from `_scroll` and `_update`).
   *
   * (Called by event listener for `frame_mozbrowserlocationchange`.)
   */
  reset() {
    this.latestScrollPos = {scrollLeft: 0, scrollTop: 0};
    this.stop();
  }

  /**
   * Stops scrolling (called from `_scroll` and `_update`).
   *
   * @param {String} direction Direction to scroll ('x', 'y').
   * @param {Number} velocity Velocity to scroll (value of gamepad axis).
   */
  stop(direction) {
    this.active = false;

    if (direction) {
      this.velocity[direction] = 0.0;
    } else {
      // Reset both velocities if no `direction` passed.
      this.velocity = {x: 0.0, y: 0.0};
    }
  }

  /**
   * Starts scrolling (called from `_scroll`).
   *
   * @param {String} direction Direction to scroll ('x', 'y').
   * @param {Number} velocity Velocity to scroll (value of gamepad axis).
   */
  start(direction, velocity) {
    if (Math.abs(velocity) < this.config.axisThreshold) {
      return;
    }

    this.velocity[direction] = velocity;

    if (!this.active) {
      this.active = true;
      this.realVelocity[direction] = 0.0;

      // TODO: Set the offsets to equal the `scrollLeft` and `scrollTop`
      // of the actively scrolled element - that is, the iframe'd document
      // (currently blocked by platform issue #120).
      this.offset.x = this.latestScrollPos.scrollLeft;
      this.offset.y = this.latestScrollPos.scrollTop;

      this.timeStart = Date.now();
      this.time = Date.now();

      this._update();
    }
  }

  /**
   * Animation loop for sending scroll events (called from `start`).
   */
  _update() {
    this.timeSinceLastUpdate = Date.now() - this.time;

    // Trigger hyperscrolling when the stick is held down for a while.
    // Regardless of the values of `x` and `y`, we hyperscroll in both
    // directions at the same velocity (feels much smoother).
    this.velocitySpeed = Math.sqrt(
      this.realVelocity.x * this.realVelocity.x +
      this.realVelocity.y * this.realVelocity.y
    );

    this.warp = 1;

    if (this.velocitySpeed > 0.8) {
      this.timeSinceScrollStart = Date.now() - this.timeStart;
      if (this.timeSinceScrollStart > 3000) {
        this.warp = 5;
      } else if (this.timeSinceScrollStart > 1500) {
        this.warp = 2;
      }
    }

    // We give it some smooth easing in and a subtle easing out.
    this.realVelocity.x = (
      this.warp * this.velocity.x * this.config.smoothingFactor +
      this.realVelocity.x * (1 - this.config.smoothingFactor)
    );
    this.realVelocity.y = (
      this.warp * this.velocity.y * this.config.smoothingFactor +
      this.realVelocity.y * (1 - this.config.smoothingFactor)
    );

    this.offset.x += this.realVelocity.x * this.timeSinceLastUpdate;
    this.offset.y += this.realVelocity.y * this.timeSinceLastUpdate;

    // Ensure the scroll offsets are always positive.
    this.offset.x = Math.max(0, this.offset.x);
    this.offset.y = Math.max(0, this.offset.y);

    // TODO: Set the maximum to be the `scrollWidth` and `scrollHeight`
    // of the actively scrolled element - that is, the iframe'd document
    // (currently blocked by platform issue #120).
    //
    // Until the iframe can communicate those dimensions back to us,
    // there will be no maximum point to stop scrolling at - meaning it's
    // possible for the user to scroll far beyond the limits of the element.

    // We keep track of the last scroll positions we sent because
    // we have no way of knowing what the positions start at
    // (currently, we assume `0,0` every time we navigate to a new page).
    this.latestScrollPos = {
      scrollLeft: Math.round(this.offset.x),
      scrollTop: Math.round(this.offset.y)
    };

    // Send the calculated scroll positions to the `<iframe mozbrowser>`.
    this.runtime.frameCommunicator.send('scroll.to', this.latestScrollPos);

    this.time = Date.now();

    // Abort scrolling if things get too negative.
    if (this.offset.x <= 0) {
      this.stop('x');
    }
    if (this.offset.y <= 0) {
      this.stop('y');
    }

    if (this.active || this.velocitySpeed > this.config.velocityThreshold) {
      window.requestAnimationFrame(this._update.bind(this));
    }
  }

  /**
   * Starts/stops scrolling (called from `scrollX` and `scrollY`).
   *
   * @param {String} direction Direction to scroll ('x', 'y').
   * @param {Number} velocity Velocity to scroll (value of gamepad axis).
   */
  _scroll(direction, velocity) {
    if (Math.abs(velocity) < this.config.axisThreshold) {
      this.stop(direction);
    } else {
      this.start(direction, velocity);
    }
  }

  /**
   * Starts/halts horizontal scrolling (called from `FrameManager`).
   *
   * @param {Number} axis Index of gamepad axis (integer) being changed
   *                      (per `gamepadaxismove` event).
   * @param {Number} value Value of gamepad axis (from -1.0 to 1.0) being
   *                       changed (per `gamepadaxismove` event).
   */
  scrollX(axis, value) {
    this._scroll('x', value);
  }

  /**
   * Starts/halts vertical scrolling (called from `FrameManager`).
   *
   * @param {Number} axis Index of gamepad axis (integer) being changed
   *                      (per `gamepadaxismove` event).
   * @param {Number} value Value of gamepad axis (from -1.0 to 1.0) being
   *                       changed (per `gamepadaxismove` event).
   */
  scrollY(axis, value) {
    this._scroll('y', value);
  }

  /**
   * Assigns scroll configurations (called from `FrameManager`).
   * @param {Object} config Options for scrolling constants.
   */
  assign(config) {
    this.config = config || {};
  }
}
