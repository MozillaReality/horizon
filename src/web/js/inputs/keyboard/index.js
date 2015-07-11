/**
 * A list of selectors for which we ignore keyboard events for.
 */
const FOCUSABLE_ELEMENTS = [
  'input:not([disabled]):not([readonly])',
  'select:not([disabled]):not([readonly])',
  'textarea:not([disabled]):not([readonly])',
  '[contenteditable]'
];

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
   * Checks if an event target matches one of the selectors in FOCUSABLE_ELEMENTS.
   * @param {Event}
   */
  isFieldFocused(e) {
    return (e ? e.target : document.activeElement).matches(FOCUSABLE_ELEMENTS);
  }

  /**
   * Keydown event handler.
   * @param {Event}
   */
  handleEvent(e) {
    if (this.isFieldFocused(e)) {
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

    if (e.type === 'keyup') {
      inputChordsToTry = [inputChord + '.up'];
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
   * @param {Object} New hotkeys mapped to callbacks.
   */
  assign(definitions) {
    for (var i in definitions) {
      this.definitions[i.split(' ').sort().join(' ').toLowerCase()] = definitions[i];
    }
  }
}
