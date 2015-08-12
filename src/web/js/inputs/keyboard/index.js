/**
 * A list of selectors for which we ignore keyboard events for.
 */
const focusableElements = [
  'input:not([disabled]):not([readonly])',
  'select:not([disabled]):not([readonly])',
  'textarea:not([disabled]):not([readonly])',
  '[contenteditable]'
];

const keyPhase = {
  down: 1,
  up: 2,
  focused: 3
};

export default class KeyboardInput {

  constructor() {
    this.definitions = {};
  }

  init() {
    window.addEventListener('keydown', this);
    window.addEventListener('keyup', this);
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
   * Checks if an event target matches one of the selectors in focusableElements.
   * @param {Event} e The keyboard event.
   * @returns {Boolean} Whether or not the field is focused.
   */
  isFieldFocused(e) {
    return (e ? e.target : document.activeElement).matches(focusableElements);
  }

  /**
   * Keydown event handler.
   * @param {Event} e The keyboard event.
   */
  handleEvent(e) {
    if (this.isFieldFocused(e) && this.keyPhase === keyPhase.focused) {
      return;
    }

    var inputChord = this.getModifiers(e).
      concat([e.key]).
      join(' ').
      toLowerCase().
      split(' ').
      sort().
      join(' ');

    var inputChordsToTry = [inputChord, inputChord + '.down'];

    switch (e.type) {
      case 'keydown':
        this.keyPhase = keyPhase.down;
        break;
      case 'keyup':
        inputChordsToTry = [inputChord + '.up'];
        this.keyPhase = this.isFieldFocused(e) ? keyPhase.focused : keyPhase.up;
        break;
    }

    inputChordsToTry.forEach(chord => {
      if (this.definitions[chord]) {
        e.preventDefault();
        e.stopPropagation();
        this.definitions[chord]();
      }
    });
  }

  /**
   * Assigns new hotkeys.
   * @param {Object} definitions New hotkeys mapped to callbacks.
   */
  assign(definitions) {
    for (var i in definitions) {
      this.definitions[i.split(' ').sort().join(' ').toLowerCase()] = definitions[i];
    }
  }
}
