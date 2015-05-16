export default class KeyboardInput {

  constructor() {
    this.definitions = {};
    this.utils = {};
  }

  init(runtime) {
    this.utils = runtime.utils;
    window.addEventListener('keydown', this);
  }

  getModifiers(e) {
    var modifiers = [];

    if (e.metaKey || e.ctrlKey) {
      modifiers.push('ctrl');
    }

    if (e.altKey) {
      modifiers.push('alt');
    }

    if (e.shiftKey) {
      modifiers.push('shift');
    }

    return modifiers;
  }

  /**
   * Keydown event handler.
   * @param {Event}
   */
  handleEvent(e) {
    if (this.utils.isFieldFocused(e.target)) {
      return;
    }

    var inputChord = this.getModifiers(e).
      concat([e.key]).
      join(' ').
      toLowerCase().
      split(' ').
      sort().
      join(' ');

    if (this.definitions[inputChord]) {
      e.preventDefault();
      e.stopPropagation();
      this.definitions[inputChord]();
    }
  }

  /**
   * Assigns new hotkeys.
   * @param {Object} New hotkeys mapped to callbacks.
   */
  assign(definitions) {
    for (var i in definitions) {
      this.definitions[i.split(' ').sort().join(' ').toLowerCase()] = definitions[i];
    }
  }
}
