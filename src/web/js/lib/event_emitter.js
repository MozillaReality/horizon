/**
 * A simple event-emitter class. Like Node's but much simpler.
 */

export default class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  emit(name, ...args) {
    (this.listeners[name] || []).forEach(func => func.apply(this, args));
    return this;
  }

  on(name, func) {
    if (name in this.listeners) {
      this.listeners[name].push(func);
    } else {
      this.listeners[name] = [func];
    }
    return this;
  }

  off(name) {
    if (name) {
      this.listeners[name] = [];
    } else {
      this.listeners = {};
    }
    return this;
  }
}
