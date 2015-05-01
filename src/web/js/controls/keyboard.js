export default class KeyboardControl {

  constructor() {
    this.definitions = {};
  }

  start() {
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
      this.definitions[i.split(' ').sort().join(' ')] = definitions[i];
    }
  }
}
