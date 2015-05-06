/**
 * A list of selectors for which we ignore keyboard events for.
 */
const FOCUSABLE_ELEMENTS = [
  'a[href]', 'area[href]', 'input:not([disabled]):not([readonly])',
  'select:not([disabled]):not([readonly])', 'textarea:not([disabled]):not([readonly])',
  'button:not([disabled]):not([readonly])', 'iframe', 'object', 'embed',
  '[tabindex]:not([tabindex="-1"])', '[contenteditable]'];

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
    if (this.isFieldFocused()) {
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
      this.definitions[i.split(' ').sort().join(' ')] = definitions[i];
    }
  }
}
