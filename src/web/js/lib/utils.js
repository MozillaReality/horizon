/**
 * A list of useful selectors.
 */
const FOCUSABLE_ELEMENTS = [
  'a[href]', 'area[href]', 'input', 'select', 'textarea', 'button',
  'object', 'embed', '[tabindex]:not([tabindex="-1"])', '[contenteditable]'
];
const FOCUSABLE_ENABLED_ELEMENTS = [
  'a[href]', 'area[href]', 'input:not([disabled]):not([readonly])',
  'select:not([disabled]):not([readonly])', 'textarea:not([disabled]):not([readonly])',
  'button:not([disabled]):not([readonly])', 'object', 'embed',
  '[tabindex]:not([tabindex="-1"]):not([disabled]):not([readonly])',
  '[contenteditable]:not([disabled]):not([readonly])'
];


export default class Utils {
  constructor() {
    window.$ = this.$;
    window.$$ = this.$$;
    this.FOCUSABLE_ELEMENTS = FOCUSABLE_ELEMENTS;
    this.FOCUSABLE_ENABLED_ELEMENTS = FOCUSABLE_ENABLED_ELEMENTS;
  }

  $(sel) {
    return document.querySelector(sel);
  }

  $$(sel) {
    // NOTE: For some reason `this` is `undefined` in this method
    // (so I can't use `this.toArray`).
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  toArray(list) {
    return Array.prototype.slice.call(list);
  }

  evaluateDOMRequest(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = e => {
        resolve(e.target.result);
      };
      req.onerror = e => {
        reject(e);
      };
    });
  }

  /**
   * Checks if an element matches one of the selectors in FOCUSABLE_ELEMENTS.
   * @param {Element}
   */
  isElementFocusable(el) {
    return (el || document.activeElement).matches(FOCUSABLE_ELEMENTS);
  }

  /**
   * Checks if an element matches one of the selectors in FOCUSABLE_ELEMENTS.
   * @param {Element}
   */
  isElementFocusableAndEnabled(el) {
    return (el || document.activeElement).matches(FOCUSABLE_ENABLED_ELEMENTS);
  }

  /**
   * Checks if the focussed element is inside a form field.
   * @param {Element}
   */
  isFieldFocused(el) {
    el = el || document.activeElement;

    var form = el.closest('form');
    if (form) {
      return this.toArray(form.elements).indexOf(el) !== -1;
    }
  }

  /**
   * Returns the form element of the the focussed element, if possible.
   * @param {Element}
   */
  getFocusedForm(el) {
    el = el || document.activeElement;

    var form = el.closest('form');
    if (form && this.toArray(form.elements).indexOf(el) !== -1) {
      return form;
    }
  }

  /**
   * Converts a string to a title-cased string (i.e., "yolo" to "Yolo").
   * @param {String}
   */
  toTitleCase(str) {
    if (typeof str !== 'string') {
      throw new TypeError("Must call 'toTitleCase' with a string");
    }
    return str.charAt(0).toUpperCase() + str.substring(1);
  }

  /**
   * Parses an element's inline styles (i.e., its `style` attribute).
   *
   * NOTE: We can't just use `getComputedStyle` or `sheet.cssRules` because
   * browsers will omit properties that it doesn't support (e.g., `nav-dir`).
   *
   * @param {Element} el DOM element to parse.
   */
  parseInlineStyle(el) {
    if (!el) {
      return {};
    }

    var styles = el.getAttribute('style');

    if (!styles) {
      return {};
    }

    styles = styles
      .replace(/\/\*[\W\w]*?\*\//g, '')  // Remove comments.
      .replace(/^\s+|\s+$/g, '')  // Remove trailing spaces.
      .replace(/\s*([:;{}])\s*/g, '$1') // Remove trailing separator spaces.
      .replace(/\};+/g, '}')  // Remove unnecessary separators.
      .replace(/([^:;{}])}/g, '$1;}');  // Add trailing separators.

    var ret = {};

    styles.split(';').forEach(function (rule) {
      var [key, value] = rule.split(':');
      if (value) {
        ret[key.trim()] = value.trim();
      }
    });

    return ret;
  }
}
